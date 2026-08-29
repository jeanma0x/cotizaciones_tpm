import {
  AlertTriangleIcon,
  LayoutGridIcon,
  PiggyBankIcon,
  ReceiptIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { AnimatedNumber } from "@/components/app/animated-number";
import { AtencionRequerida, type ItemAtencion } from "@/components/app/atencion-requerida";
import { CostosCategoriaChart } from "@/components/app/costos-categoria-chart";
import { DesgloseEmpresaChart } from "@/components/app/desglose-empresa-chart";
import { DesgloseTipoChart } from "@/components/app/desglose-tipo-chart";
import { DistribucionEstadoChart } from "@/components/app/distribucion-estado-chart";
import { EstadoBadge } from "@/components/app/estado-badge";
import { ServiciosRankingChart } from "@/components/app/servicios-ranking-chart";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { TendenciaMensualChart } from "@/components/app/tendencia-mensual-chart";
import { UtilidadProyectoFiltros } from "@/components/app/utilidad-proyecto-filtros";
import { UtilidadProyectoTable } from "@/components/app/utilidad-proyecto-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getEmpresasPermitidas } from "@/lib/auth";
import { getUsuarioActual } from "@/lib/current-usuario";
import { db } from "@/lib/db";
import { getEmpresaActivaId } from "@/lib/empresa-activa";
import { CATEGORIA_COSTO_LABELS } from "@/lib/validations/costo";

const TIPO_LABELS: Record<string, string> = {
  COTIZACION: "Cotizaciones",
  PROPUESTA: "Propuestas",
  FACTURA: "Facturas",
};

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  EN_NEGOCIACION: "En negociación",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
  VENCIDA: "Vencida",
  FACTURADA: "Facturada",
};

const UN_DIA_MS = 24 * 60 * 60 * 1000;
const MESES_TENDENCIA = 12;

// Compartido entre "Monto vigente cotizado" y "Facturado (histórico)": ambos
// pueden tener más de una moneda a la vez (GTQ y USD), y concatenadas en una
// sola línea se leen pegadas — cada una va en su propia línea cuando hay más
// de una.
function MontoPorMoneda({
  entradas,
  claseColor = "text-accent-hover",
}: {
  entradas: [string, number][];
  claseColor?: string;
}) {
  if (entradas.length === 0) return <span className={claseColor}>0.00</span>;
  if (entradas.length === 1) {
    return (
      <span className={claseColor}>
        {entradas[0][0]} <AnimatedNumber value={entradas[0][1]} decimals={2} />
      </span>
    );
  }
  return (
    <span className="flex flex-col gap-0.5 text-xl leading-tight">
      {entradas.map(([moneda, monto]) => (
        <span key={moneda} className={claseColor}>
          {moneda} <AnimatedNumber value={monto} decimals={2} />
        </span>
      ))}
    </span>
  );
}

// Definiciones de métrica (no especificadas al detalle byte a byte en
// scope.md, decisión tomada acá — avisar si el cliente las quiere distintas):
// - "Monto vigente cotizado": suma de documentos ENVIADA o EN_NEGOCIACION.
// - "Tasa de conversión": ACEPTADA + FACTURADA sobre todo lo que salió de
//   Borrador.
// - "Atención hoy" (Zona 1 y 3): unión deduplicada de VENCIDA + sin
//   respuesta hace más de 7 días + próximas a vencer en 3 días o menos.
export default async function DashboardPage({
  searchParams,
}: {
  // Fase 3.4 — filtros propios de la zona "Utilidad por proyecto". La
  // empresa ya se filtra con el selector global (Fase 3.2), no hace falta
  // repetirla acá.
  searchParams: Promise<{
    upClienteId?: string;
    upProyectoId?: string;
    upDesde?: string;
    upHasta?: string;
  }>;
}) {
  const { upClienteId, upProyectoId, upDesde, upHasta } = await searchParams;
  const [empresasPermitidasTodas, usuario, empresaActivaId] = await Promise.all([
    getEmpresasPermitidas(),
    getUsuarioActual(),
    getEmpresaActivaId(),
  ]);
  const primerNombre = usuario?.nombre?.split(" ")[0] ?? "";
  // Selector de empresa global (Fase 3.2): si el usuario eligió una empresa
  // activa, el panel se agrega solo para esa empresa; si eligió "todas" (o
  // solo tiene una permitida), el comportamiento es igual al de antes de
  // esta fase — agregado de todas las permitidas.
  const empresasPermitidas = empresaActivaId ? [empresaActivaId] : empresasPermitidasTodas;
  const where = { empresaId: { in: empresasPermitidas } };
  const hoy = new Date();
  const hace12Meses = new Date(hoy.getTime() - MESES_TENDENCIA * 31 * UN_DIA_MS);
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const [
    vigentes,
    resueltos,
    candidatosAtencion,
    porEmpresa,
    porTipo,
    porEstado,
    empresas,
    recientes,
    docsTendencia,
    itemsCatalogo,
    servicios,
    facturadoDelMes,
    costosDelMes,
    clientesConProyectos,
    proyectosFiltrados,
  ] = await Promise.all([
    db.documento.findMany({
      where: { ...where, estado: { in: ["ENVIADA", "EN_NEGOCIACION"] } },
      select: { id: true, total: true, empresa: { select: { moneda: true } } },
    }),
    // notIn RECHAZADA, no solo "not BORRADOR": una rechazada no debería
    // seguir inflando el denominador de la tasa de conversión — es
    // justamente el número que Oldemar pidió que dejara de reflejar
    // negocios que no van a cerrar (ronda de reunión con cliente, 14/08).
    db.documento.groupBy({
      by: ["estado"],
      where: { ...where, estado: { notIn: ["BORRADOR", "RECHAZADA"] } },
      _count: true,
    }),
    db.documento.findMany({
      where: { ...where, estado: { in: ["VENCIDA", "ENVIADA", "EN_NEGOCIACION"] } },
      include: {
        cliente: true,
        historial: { orderBy: { fecha: "desc" }, take: 1 },
      },
    }),
    // Sin esto, "Desglose por empresa → N documentos" contaba también las
    // rechazadas en el total.
    db.documento.groupBy({
      by: ["empresaId", "estado"],
      where: { ...where, estado: { not: "RECHAZADA" } },
      _count: true,
      _sum: { total: true },
    }),
    // Sin esto, "Desglose por tipo" contaba rechazadas en cada categoría.
    db.documento.groupBy({
      by: ["tipo"],
      where: { ...where, estado: { not: "RECHAZADA" } },
      _count: true,
    }),
    db.documento.groupBy({
      by: ["estado"],
      where,
      _count: true,
    }),
    db.empresa.findMany({
      where: { id: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
    }),
    db.documento.findMany({
      where,
      include: { cliente: true, empresa: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Sin esto, el monto de una rechazada seguía sumándose al gráfico de
    // tendencia (como "cotizado" o "facturado" según su tipo).
    db.documento.findMany({
      where: { ...where, fecha: { gte: hace12Meses }, estado: { not: "RECHAZADA" } },
      select: { fecha: true, tipo: true, total: true, empresa: { select: { moneda: true } } },
    }),
    // Sin esto, los ítems de una rechazada seguían inflando el ranking de
    // "Servicios más cotizados".
    db.itemDocumento.findMany({
      where: {
        documento: { empresaId: { in: empresasPermitidas }, estado: { not: "RECHAZADA" } },
      },
      select: { descripcion: true, cantidad: true, precioUnitario: true },
    }),
    db.servicio.findMany({ where: { empresaId: { in: empresasPermitidas } } }),
    // "Facturado del mes" para Utilidad neta: por fecha del documento, no por
    // cuándo se marcó FACTURADA (no existe ese timestamp en el modelo).
    db.documento.findMany({
      where: { ...where, estado: "FACTURADA", fecha: { gte: inicioMes } },
      select: {
        total: true,
        empresaId: true,
        empresa: { select: { moneda: true, codigoPais: true } },
      },
    }),
    db.costoOperativo.findMany({
      where: { ...where, fechaGasto: { gte: inicioMes } },
      select: { monto: true, categoria: true, empresa: { select: { moneda: true } } },
    }),
    // Fase 3.4 — catálogo completo de clientes/proyectos (sin filtrar por
    // upClienteId/upProyectoId) para poblar los <select> de los filtros.
    db.cliente.findMany({
      where: { empresaId: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        proyectos: { orderBy: { nombre: "asc" }, select: { id: true, nombre: true } },
      },
    }),
    // Proyectos EN ALCANCE de los filtros elegidos — la utilidad de cada uno
    // se calcula después, una vez que se conocen sus IDs.
    db.proyecto.findMany({
      where: {
        cliente: { empresaId: { in: empresasPermitidas } },
        ...(upClienteId ? { clienteId: upClienteId } : {}),
        ...(upProyectoId ? { id: upProyectoId } : {}),
      },
      include: { cliente: { include: { empresa: { select: { moneda: true } } } } },
      orderBy: { nombre: "asc" },
    }),
  ]);

  // ---- Zona 8: utilidad por proyecto (Fase 3.4) ----
  // Rango de fecha opcional: aplica tanto a lo facturado (Documento.fecha)
  // como a los costos (CostoOperativo.fechaGasto) — misma "fecha de devengo"
  // que ya rige en todo el resto del sistema (ver schema.prisma).
  const rangoFechaUtilidad: { gte?: Date; lte?: Date } | undefined =
    upDesde || upHasta
      ? {
          ...(upDesde ? { gte: new Date(`${upDesde}T00:00:00.000Z`) } : {}),
          ...(upHasta ? { lte: new Date(`${upHasta}T23:59:59.999Z`) } : {}),
        }
      : undefined;

  const proyectoIdsFiltrados = proyectosFiltrados.map((p) => p.id);
  const [facturadoPorProyecto, costosPorProyecto] =
    proyectoIdsFiltrados.length > 0
      ? await Promise.all([
          // estado FACTURADA (no tipo "FACTURA"): mismo criterio que el
          // resto del panel ("Facturado (histórico)", desglose por
          // empresa) — una cotización convertida a factura (ver
          // convertir-a-factura-button.tsx) queda con tipo COTIZACION pero
          // estado FACTURADA, y sí debe contar acá como facturado real.
          db.documento.groupBy({
            by: ["proyectoId"],
            where: {
              proyectoId: { in: proyectoIdsFiltrados },
              estado: "FACTURADA",
              ...(rangoFechaUtilidad ? { fecha: rangoFechaUtilidad } : {}),
            },
            _sum: { total: true },
          }),
          db.costoOperativo.groupBy({
            by: ["proyectoId"],
            where: {
              proyectoId: { in: proyectoIdsFiltrados },
              ...(rangoFechaUtilidad ? { fechaGasto: rangoFechaUtilidad } : {}),
            },
            _sum: { monto: true },
          }),
        ])
      : [[], []];

  const facturadoPorProyectoMapa = new Map(
    facturadoPorProyecto.map((f) => [f.proyectoId, Number(f._sum.total ?? 0)]),
  );
  const costosPorProyectoMapa = new Map(
    costosPorProyecto.map((c) => [c.proyectoId, Number(c._sum.monto ?? 0)]),
  );
  const utilidadPorProyecto = proyectosFiltrados
    .map((p) => {
      const facturado = facturadoPorProyectoMapa.get(p.id) ?? 0;
      const costos = costosPorProyectoMapa.get(p.id) ?? 0;
      return {
        id: p.id,
        clienteNombre: p.cliente.nombre,
        proyectoNombre: p.nombre,
        moneda: p.cliente.empresa.moneda,
        facturado,
        costos,
        utilidad: facturado - costos,
      };
    })
    .sort((a, b) => b.utilidad - a.utilidad);

  // ---- Zona 1 + 5: métricas generales y desglose por tipo/estado ----
  const montoVigentePorMoneda = vigentes.reduce<Record<string, number>>((acc, doc) => {
    const moneda = doc.empresa.moneda;
    acc[moneda] = (acc[moneda] ?? 0) + Number(doc.total);
    return acc;
  }, {});

  const totalNoBorrador = resueltos.reduce((acc, r) => acc + r._count, 0);
  const aceptadosOFacturados = resueltos
    .filter((r) => r.estado === "ACEPTADA" || r.estado === "FACTURADA")
    .reduce((acc, r) => acc + r._count, 0);
  const tasaConversion =
    totalNoBorrador > 0 ? (aceptadosOFacturados / totalNoBorrador) * 100 : 0;

  const desgloseTipo = (["COTIZACION", "PROPUESTA", "FACTURA"] as const).map((tipo) => ({
    tipo,
    label: TIPO_LABELS[tipo],
    cantidad: porTipo.find((f) => f.tipo === tipo)?._count ?? 0,
  }));

  const chartData = porEstado.map((f) => ({
    estado: f.estado,
    label: ESTADO_LABELS[f.estado] ?? f.estado,
    cantidad: f._count,
  }));

  // ---- Zona 1 + 3: atención requerida (vencida / sin respuesta / por vencer) ----
  const itemsAtencion: ItemAtencion[] = [];
  for (const doc of candidatosAtencion) {
    const vigenciaDias = doc.vigenciaDias ?? 15;
    const vencimiento = new Date(doc.fecha.getTime() + vigenciaDias * UN_DIA_MS);
    const clienteNombre = doc.cliente?.nombre ?? "—";

    if (doc.estado === "VENCIDA") {
      const dias = Math.max(0, Math.floor((hoy.getTime() - vencimiento.getTime()) / UN_DIA_MS));
      itemsAtencion.push({ id: doc.id, correlativo: doc.correlativo, clienteNombre, motivo: "vencida", dias });
      continue;
    }

    const diasParaVencer = Math.ceil((vencimiento.getTime() - hoy.getTime()) / UN_DIA_MS);
    if (diasParaVencer >= 0 && diasParaVencer <= 3) {
      itemsAtencion.push({
        id: doc.id,
        correlativo: doc.correlativo,
        clienteNombre,
        motivo: "por_vencer",
        dias: diasParaVencer,
      });
      continue;
    }

    const ultimoCambio = doc.historial[0]?.fecha ?? doc.createdAt;
    const diasSinRespuesta = Math.floor((hoy.getTime() - ultimoCambio.getTime()) / UN_DIA_MS);
    if (diasSinRespuesta > 7) {
      itemsAtencion.push({
        id: doc.id,
        correlativo: doc.correlativo,
        clienteNombre,
        motivo: "sin_respuesta",
        dias: diasSinRespuesta,
      });
    }
  }
  const ORDEN_URGENCIA = { vencida: 0, por_vencer: 1, sin_respuesta: 2 };
  itemsAtencion.sort((a, b) => ORDEN_URGENCIA[a.motivo] - ORDEN_URGENCIA[b.motivo]);

  // ---- Zona 2: tendencia mensual (cotizado vs. facturado) ----
  // Una serie de meses POR MONEDA — nunca sumar GTQ y USD en el mismo número
  // (Panamá y una parte de Estados Unidos facturan en USD, el resto en GTQ).
  // Ver punto 1 de la ronda de cierre de huecos: el mismo criterio que ya
  // se aplicaba en "Monto vigente cotizado" faltaba acá.
  function mesesVacios() {
    const mapa = new Map<string, { mes: string; cotizado: number; facturado: number }>();
    for (let i = MESES_TENDENCIA - 1; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const clave = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleDateString("es-GT", { month: "short", year: "2-digit" });
      mapa.set(clave, { mes: label, cotizado: 0, facturado: 0 });
    }
    return mapa;
  }

  const mesesPorMoneda = new Map<string, Map<string, { mes: string; cotizado: number; facturado: number }>>();
  // Se pre-siembra con TODAS las monedas de las empresas permitidas, no solo
  // las que ya tienen documentos en los últimos 12 meses — si Panamá (USD)
  // no tiene actividad todavía, tiene que verse como "necesitás más
  // historial" en su propia sección, nunca desaparecer sin explicación.
  for (const moneda of new Set(empresas.map((e) => e.moneda))) {
    mesesPorMoneda.set(moneda, mesesVacios());
  }
  for (const doc of docsTendencia) {
    const moneda = doc.empresa.moneda;
    if (!mesesPorMoneda.has(moneda)) mesesPorMoneda.set(moneda, mesesVacios());
    const clave = `${doc.fecha.getFullYear()}-${doc.fecha.getMonth()}`;
    const fila = mesesPorMoneda.get(moneda)!.get(clave);
    if (!fila) continue;
    if (doc.tipo === "FACTURA") fila.facturado += Number(doc.total);
    else fila.cotizado += Number(doc.total);
  }
  // Monedas ordenadas por actividad total, para que la de más movimiento
  // (normalmente GTQ) aparezca primero.
  const tendenciaPorMoneda = Array.from(mesesPorMoneda.entries())
    .map(([moneda, mapa]) => ({
      moneda,
      data: Array.from(mapa.values()),
      actividad: Array.from(mapa.values()).reduce((acc, f) => acc + f.cotizado + f.facturado, 0),
    }))
    .sort((a, b) => b.actividad - a.actividad);

  // ---- Zona 4: desglose por empresa ----
  const desgloseEmpresa = empresas.map((empresa) => {
    const filas = porEmpresa.filter((f) => f.empresaId === empresa.id);
    const totalDocs = filas.reduce((acc, f) => acc + f._count, 0);
    const facturado = filas
      .filter((f) => f.estado === "FACTURADA")
      .reduce((acc, f) => acc + Number(f._sum.total ?? 0), 0);
    const cotizado = filas
      .filter((f) => f.estado === "ENVIADA" || f.estado === "EN_NEGOCIACION")
      .reduce((acc, f) => acc + Number(f._sum.total ?? 0), 0);
    // Fase 3.4 — contraparte de "Facturado (histórico)": lo ya ACEPTADA
    // pero que todavía no pasó a FACTURADA (pendiente de cobro real).
    const aceptado = filas
      .filter((f) => f.estado === "ACEPTADA")
      .reduce((acc, f) => acc + Number(f._sum.total ?? 0), 0);
    return { empresa, totalDocs, facturado, cotizado, aceptado };
  });

  // Acumulado histórico de todo lo facturado (no solo del mes) — es lo que
  // Oldemar pidió como "histórico de ingresos ya cerrados" en la reunión del
  // 14/08, sin darse cuenta de que el dato ya existía por empresa acá abajo,
  // solo que sin una tarjeta principal que lo destaque junto al vigente.
  const montoFacturadoPorMoneda = desgloseEmpresa.reduce<Record<string, number>>(
    (acc, d) => {
      acc[d.empresa.moneda] = (acc[d.empresa.moneda] ?? 0) + d.facturado;
      return acc;
    },
    {},
  );
  // Fase 3.4 — "Aceptado (sin facturar)": complemento de "Facturado
  // (histórico)", mismo criterio de agregación por moneda.
  const montoAceptadoPorMoneda = desgloseEmpresa.reduce<Record<string, number>>(
    (acc, d) => {
      acc[d.empresa.moneda] = (acc[d.empresa.moneda] ?? 0) + d.aceptado;
      return acc;
    },
    {},
  );

  // ---- Zona 6: servicios más cotizados ----
  // Aproximación por nombre: ItemDocumento no guarda una referencia al
  // Servicio de catálogo del que se copió (ver schema.prisma), solo el texto
  // de la descripción — así que se empareja por coincidencia exacta de
  // nombre. Si el cliente edita la descripción del ítem, deja de contar acá.
  // Señalado como limitación real del modelo de datos, no una decisión de
  // diseño — ver conversación.
  const porNombre = new Map<string, { cantidad: number }>();
  for (const item of itemsCatalogo) {
    const clave = item.descripcion.trim().toLowerCase();
    const actual = porNombre.get(clave) ?? { cantidad: 0 };
    actual.cantidad += Number(item.cantidad);
    porNombre.set(clave, actual);
  }
  const rankingServicios = servicios
    .map((s) => ({
      nombre: s.nombre,
      ...(porNombre.get(s.nombre.trim().toLowerCase()) ?? { cantidad: 0 }),
    }))
    .filter((s) => s.cantidad > 0)
    // Por cantidad, no por monto: "monto" suma ítems de servicios que
    // pueden pertenecer a empresas con monedas distintas (coincidencia de
    // nombre entre catálogos), y además "monto" nunca se muestra en esta
    // tarjeta — ordenar por lo mismo que se ve evita un orden que no
    // coincide con lo que el usuario lee (ver punto 1, cierre de huecos).
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  const montoVigenteEntradas = Object.entries(montoVigentePorMoneda);
  const montoFacturadoEntradas = Object.entries(montoFacturadoPorMoneda);
  const montoAceptadoEntradas = Object.entries(montoAceptadoPorMoneda);

  // ---- Utilidad neta (mes): Facturado del mes − Costos del mes − ISR, por moneda.
  //
  // ISR: Régimen Opcional Simplificado sobre Ingresos de Actividades
  // Lucrativas (Decreto 10-2012, Libro I, art. 44 y siguientes) — 5% sobre
  // los primeros Q30,000 de ingresos MENSUALES por contribuyente, 7% sobre
  // el excedente. Es el régimen más común para una PYME de servicios (bajo
  // costo fijo, alta relación margen/ingreso) y el que se eligió acá a falta
  // de que Oldemar confirme cuál tiene inscrito cada empresa en su RTU — si
  // alguna empresa está en Régimen sobre las Utilidades (25% sobre la
  // ganancia neta, no sobre el ingreso), este cálculo quedaría distinto y
  // hay que ajustarlo.
  //
  // Solo aplica a empresas de Guatemala (codigoPais "502" — Corporación SIAP
  // y Servicios Generales TPM): Panamá y Estados Unidos tributan bajo sus
  // propias leyes, no la guatemalteca, y no se les aplica este descuento.
  //
  // IVA NO se descuenta acá a propósito: es un impuesto de traslado (se
  // cobra al cliente y se acredita contra el IVA pagado en compras), no un
  // costo del negocio — reducir "Facturado" por el 12% de IVA solo sería
  // correcto si supiéramos cuánto IVA se pagó en compras (crédito fiscal),
  // que este sistema no registra. Restarlo sin eso sobreestimaría el
  // impuesto real y subestimaría la utilidad.
  const ISR_LIMITE_TRAMO_1 = 30000; // Q30,000 mensuales
  const ISR_TASA_TRAMO_1 = 0.05;
  const ISR_TASA_TRAMO_2 = 0.07;
  const GUATEMALA_CODIGO_PAIS = "502";

  function calcularIsrSimplificado(ingresoMensual: number) {
    if (ingresoMensual <= 0) return 0;
    if (ingresoMensual <= ISR_LIMITE_TRAMO_1) return ingresoMensual * ISR_TASA_TRAMO_1;
    return (
      ISR_LIMITE_TRAMO_1 * ISR_TASA_TRAMO_1 +
      (ingresoMensual - ISR_LIMITE_TRAMO_1) * ISR_TASA_TRAMO_2
    );
  }

  const facturadoPorEmpresaDelMes = new Map<
    string,
    { moneda: string; esGuatemala: boolean; total: number }
  >();
  for (const doc of facturadoDelMes) {
    const actual = facturadoPorEmpresaDelMes.get(doc.empresaId) ?? {
      moneda: doc.empresa.moneda,
      esGuatemala: doc.empresa.codigoPais === GUATEMALA_CODIGO_PAIS,
      total: 0,
    };
    actual.total += Number(doc.total);
    facturadoPorEmpresaDelMes.set(doc.empresaId, actual);
  }

  const utilidadNetaPorMoneda: Record<string, number> = {};
  const isrPorMoneda: Record<string, number> = {};
  for (const { moneda, esGuatemala, total } of facturadoPorEmpresaDelMes.values()) {
    utilidadNetaPorMoneda[moneda] = (utilidadNetaPorMoneda[moneda] ?? 0) + total;
    if (esGuatemala) {
      const isr = calcularIsrSimplificado(total);
      isrPorMoneda[moneda] = (isrPorMoneda[moneda] ?? 0) + isr;
      utilidadNetaPorMoneda[moneda] -= isr;
    }
  }
  // Costos por categoría — misma agrupación por moneda que el resto del
  // panel: nunca mezclar GTQ y USD. Pre-sembrado con TODAS las monedas de
  // las empresas permitidas (mismo criterio que "Tendencia" arriba): si una
  // empresa no tiene costos este mes, su tarjeta debe verse como "todavía
  // no hay costos", nunca desaparecer sin explicación.
  const costosPorCategoriaPorMoneda: Record<string, Record<string, number>> = {};
  for (const moneda of new Set(empresas.map((e) => e.moneda))) {
    costosPorCategoriaPorMoneda[moneda] = {};
  }
  for (const costo of costosDelMes) {
    const moneda = costo.empresa.moneda;
    utilidadNetaPorMoneda[moneda] = (utilidadNetaPorMoneda[moneda] ?? 0) - Number(costo.monto);
    const porCategoria = (costosPorCategoriaPorMoneda[moneda] ??= {});
    porCategoria[costo.categoria] = (porCategoria[costo.categoria] ?? 0) + Number(costo.monto);
  }
  const costosPorCategoriaEntradas = Object.entries(costosPorCategoriaPorMoneda).map(
    ([moneda, porCategoria]) => ({
      moneda,
      data: Object.entries(porCategoria)
        .map(([categoria, monto]) => ({
          categoria: categoria as keyof typeof CATEGORIA_COSTO_LABELS,
          label: CATEGORIA_COSTO_LABELS[categoria as keyof typeof CATEGORIA_COSTO_LABELS],
          monto,
        }))
        .sort((a, b) => b.monto - a.monto),
    }),
  );
  const utilidadNetaEntradas = Object.entries(utilidadNetaPorMoneda);
  const utilidadNetaNegativa = utilidadNetaEntradas.some(([, monto]) => monto < 0);
  const isrEntradas = Object.entries(isrPorMoneda).filter(([, monto]) => monto > 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Panel"
        icon={LayoutGridIcon}
        description={primerNombre ? `Bienvenido, ${primerNombre}` : undefined}
      />

      {/* Zona 1 — estado del negocio ahora mismo: cifras hero, --text-3xl,
          --color-accent en vez de --color-brand para que se lean también
          en modo oscuro (navy-500 sobre fondo oscuro casi no se distingue). */}
      <div className="stat-cards-grid">
        <StatCard
          label="Monto vigente cotizado"
          icon={<WalletIcon className="h-4.5 w-4.5" />}
          tono="accent"
          size="hero"
          value={<MontoPorMoneda entradas={montoVigenteEntradas} />}
        />
        <StatCard
          label="Facturado (histórico)"
          icon={<ReceiptIcon className="h-4.5 w-4.5" />}
          tono="accent"
          size="hero"
          value={<MontoPorMoneda entradas={montoFacturadoEntradas} />}
        />
        <StatCard
          label="Aceptado (sin facturar)"
          icon={<ReceiptIcon className="h-4.5 w-4.5" />}
          tono="accent"
          size="hero"
          value={<MontoPorMoneda entradas={montoAceptadoEntradas} />}
        />
        <StatCard
          label="Tasa de conversión"
          icon={<TrendingUpIcon className="h-4.5 w-4.5" />}
          tono="accent"
          size="hero"
          value={
            <span className="text-accent-hover">
              <AnimatedNumber value={tasaConversion} suffix="%" />
            </span>
          }
        />
        <StatCard
          label="Atención hoy"
          icon={<AlertTriangleIcon className="h-4.5 w-4.5" />}
          tono={itemsAtencion.length > 0 ? "danger" : "success"}
          size="hero"
          value={
            <span className={itemsAtencion.length > 0 ? "text-danger" : "text-success"}>
              <AnimatedNumber value={itemsAtencion.length} />
            </span>
          }
        />
        <StatCard
          label="Utilidad neta (mes)"
          icon={<PiggyBankIcon className="h-4.5 w-4.5" />}
          tono={utilidadNetaNegativa ? "danger" : "success"}
          size="hero"
          value={
            <MontoPorMoneda
              entradas={utilidadNetaEntradas}
              claseColor={utilidadNetaNegativa ? "text-danger" : "text-success"}
            />
          }
        />
      </div>

      {/* Transparencia del descuento de ISR en "Utilidad neta" — nunca un
          cálculo invisible. Solo aparece cuando hay algo que mostrar (mes
          sin facturación de empresas de Guatemala = sin línea). */}
      {isrEntradas.length > 0 && (
        <p className="-mt-4 text-xs text-muted-foreground">
          Incluye ISR estimado (régimen opcional simplificado, 5%/7% sobre
          ingresos, solo empresas de Guatemala):{" "}
          <span className="font-mono">
            {isrEntradas.map(([moneda, monto]) => `${moneda} ${monto.toFixed(2)}`).join(" · ")}
          </span>
        </p>
      )}

      {/* Zona 3 — atención requerida: lista accionable, nunca solo un número */}
      <AtencionRequerida items={itemsAtencion} />

      {/* Zona 2 — tendencia mensual, una tarjeta por moneda: nunca sumar GTQ
          y USD en el mismo gráfico (ver punto 1, ronda de cierre de huecos). */}
      {tendenciaPorMoneda.map(({ moneda, data }) => (
        <Card key={moneda}>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Tendencia — cotizado vs. facturado ({moneda}, últimos 12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TendenciaMensualChart data={data} />
          </CardContent>
        </Card>
      ))}

      {/* Zonas 4-7 — grilla más pareja, container queries para reacomodarse */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Desglose por empresa
            </CardTitle>
            {/* Aclaración pedida por Jean/Oldemar: "Cotizado" y "Facturado"
                son totales independientes del período, no un embudo — no
                todas las cotizaciones terminan en factura, y algunos
                servicios se facturan directo, sin cotización previa. Sin
                esta nota, los dos montos lado a lado se leen como si uno
                debiera derivar del otro. */}
            <CardDescription>
              Totales independientes: no toda cotización termina en factura, y algunos
              servicios se facturan directo, sin cotización previa.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <DesgloseEmpresaChart
              data={desgloseEmpresa.map(({ empresa, totalDocs }) => ({
                nombre: empresa.nombre,
                totalDocs,
              }))}
            />
            <div className="flex flex-col gap-2 text-sm">
              {desgloseEmpresa.map(({ empresa, facturado, cotizado }) => (
                <div
                  key={empresa.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 first:border-t-0 first:pt-0"
                >
                  <span className="font-medium text-text-primary">{empresa.nombre}</span>
                  <span className="font-mono text-brand dark:text-brand-hover">
                    Facturado {empresa.moneda} {facturado.toFixed(2)}
                  </span>
                  <span className="font-mono text-status-enviada">
                    Cotizado {empresa.moneda} {cotizado.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Desglose por tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DesgloseTipoChart data={desgloseTipo} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Servicios más cotizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ServiciosRankingChart data={rankingServicios} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Distribución por estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DistribucionEstadoChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Documentos recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {recientes.length === 0 && (
              <p className="text-sm text-muted-foreground">Todavía no hay documentos.</p>
            )}
            {recientes.map((doc) => (
              <Link
                key={doc.id}
                href={`/documentos/${doc.id}`}
                className="flex items-center justify-between gap-2 rounded p-2 text-sm hover:bg-muted/50"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="correlativo-tag shrink-0">TPM-{doc.correlativo}</span>
                  <span className="truncate">{doc.cliente?.nombre ?? "—"}</span>
                </span>
                <EstadoBadge estado={doc.estado} />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Costos por categoría del mes — una tarjeta por moneda, mismo
          criterio que "Tendencia": nunca mezclar GTQ y USD en un mismo
          gráfico, y mostrar la tarjeta aunque esa moneda no tenga costos
          este mes (estado vacío explícito en vez de desaparecer). */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {costosPorCategoriaEntradas.map(({ moneda, data }) => (
          <Card key={moneda}>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                Costos por categoría ({moneda}, este mes)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CostosCategoriaChart data={data} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Zona 8 (Fase 3.4) — utilidad por proyecto: facturado − costos, con
          fecha de devengo (nunca fecha de pago/cierre) en ambos lados. La
          empresa ya se filtra con el selector global; acá solo cliente,
          proyecto y rango de fecha, propios de esta zona. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
            Utilidad por proyecto
          </CardTitle>
          <CardDescription>
            Facturado menos costos de cada proyecto, usando la fecha del gasto (no de pago).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <UtilidadProyectoFiltros clientes={clientesConProyectos} />
          <UtilidadProyectoTable data={utilidadPorProyecto} />
        </CardContent>
      </Card>
    </div>
  );
}
