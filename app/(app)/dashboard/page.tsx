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
import { DesgloseEmpresaChart } from "@/components/app/desglose-empresa-chart";
import { DesgloseTipoChart } from "@/components/app/desglose-tipo-chart";
import { DistribucionEstadoChart } from "@/components/app/distribucion-estado-chart";
import { EstadoBadge } from "@/components/app/estado-badge";
import { ServiciosRankingChart } from "@/components/app/servicios-ranking-chart";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { TendenciaMensualChart } from "@/components/app/tendencia-mensual-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEmpresasPermitidas } from "@/lib/auth";
import { getUsuarioActual } from "@/lib/current-usuario";
import { db } from "@/lib/db";

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
export default async function DashboardPage() {
  const [empresasPermitidas, usuario] = await Promise.all([
    getEmpresasPermitidas(),
    getUsuarioActual(),
  ]);
  const primerNombre = usuario?.nombre?.split(" ")[0] ?? "";
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
      select: { total: true, empresa: { select: { moneda: true } } },
    }),
    db.costoOperativo.findMany({
      where: { ...where, fechaGasto: { gte: inicioMes } },
      select: { monto: true, empresa: { select: { moneda: true } } },
    }),
  ]);

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
    return { empresa, totalDocs, facturado, cotizado };
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

  // ---- Utilidad neta (mes): Facturado del mes − Costos del mes, por moneda.
  // Sin ISR/IVA todavía — Oldemar va a mandar la fórmula exacta (reunión
  // 14/08), no se inventa el orden de cálculo sin eso.
  const utilidadNetaPorMoneda: Record<string, number> = {};
  for (const doc of facturadoDelMes) {
    const moneda = doc.empresa.moneda;
    utilidadNetaPorMoneda[moneda] = (utilidadNetaPorMoneda[moneda] ?? 0) + Number(doc.total);
  }
  for (const costo of costosDelMes) {
    const moneda = costo.empresa.moneda;
    utilidadNetaPorMoneda[moneda] = (utilidadNetaPorMoneda[moneda] ?? 0) - Number(costo.monto);
  }
  const utilidadNetaEntradas = Object.entries(utilidadNetaPorMoneda);
  const utilidadNetaNegativa = utilidadNetaEntradas.some(([, monto]) => monto < 0);

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
    </div>
  );
}
