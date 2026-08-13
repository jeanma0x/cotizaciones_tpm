import { AlertTriangleIcon, LayoutGridIcon, TrendingUpIcon, WalletIcon } from "lucide-react";
import Link from "next/link";
import { AnimatedNumber } from "@/components/app/animated-number";
import { AtencionRequerida, type ItemAtencion } from "@/components/app/atencion-requerida";
import { DistribucionEstadoChart } from "@/components/app/distribucion-estado-chart";
import { EstadoBadge } from "@/components/app/estado-badge";
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
  ] = await Promise.all([
    db.documento.findMany({
      where: { ...where, estado: { in: ["ENVIADA", "EN_NEGOCIACION"] } },
      select: { id: true, total: true, empresa: { select: { moneda: true } } },
    }),
    db.documento.groupBy({
      by: ["estado"],
      where: { ...where, estado: { not: "BORRADOR" } },
      _count: true,
    }),
    db.documento.findMany({
      where: { ...where, estado: { in: ["VENCIDA", "ENVIADA", "EN_NEGOCIACION"] } },
      include: {
        cliente: true,
        historial: { orderBy: { fecha: "desc" }, take: 1 },
      },
    }),
    db.documento.groupBy({
      by: ["empresaId", "estado"],
      where,
      _count: true,
      _sum: { total: true },
    }),
    db.documento.groupBy({
      by: ["tipo"],
      where,
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
    db.documento.findMany({
      where: { ...where, fecha: { gte: hace12Meses } },
      select: { fecha: true, tipo: true, total: true },
    }),
    db.itemDocumento.findMany({
      where: { documento: { empresaId: { in: empresasPermitidas } } },
      select: { descripcion: true, cantidad: true, precioUnitario: true },
    }),
    db.servicio.findMany({ where: { empresaId: { in: empresasPermitidas } } }),
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
  const maxCantidadPorTipo = Math.max(...desgloseTipo.map((d) => d.cantidad), 1);

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
  const mesesMap = new Map<string, { mes: string; cotizado: number; facturado: number }>();
  for (let i = MESES_TENDENCIA - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const clave = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString("es-GT", { month: "short", year: "2-digit" });
    mesesMap.set(clave, { mes: label, cotizado: 0, facturado: 0 });
  }
  for (const doc of docsTendencia) {
    const clave = `${doc.fecha.getFullYear()}-${doc.fecha.getMonth()}`;
    const fila = mesesMap.get(clave);
    if (!fila) continue;
    if (doc.tipo === "FACTURA") fila.facturado += Number(doc.total);
    else fila.cotizado += Number(doc.total);
  }
  const tendenciaData = Array.from(mesesMap.values());

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
  const maxDocsPorEmpresa = Math.max(...desgloseEmpresa.map((d) => d.totalDocs), 1);

  // ---- Zona 6: servicios más cotizados ----
  // Aproximación por nombre: ItemDocumento no guarda una referencia al
  // Servicio de catálogo del que se copió (ver schema.prisma), solo el texto
  // de la descripción — así que se empareja por coincidencia exacta de
  // nombre. Si el cliente edita la descripción del ítem, deja de contar acá.
  // Señalado como limitación real del modelo de datos, no una decisión de
  // diseño — ver conversación.
  const porNombre = new Map<string, { cantidad: number; monto: number }>();
  for (const item of itemsCatalogo) {
    const clave = item.descripcion.trim().toLowerCase();
    const actual = porNombre.get(clave) ?? { cantidad: 0, monto: 0 };
    actual.cantidad += Number(item.cantidad);
    actual.monto += Number(item.cantidad) * Number(item.precioUnitario);
    porNombre.set(clave, actual);
  }
  const rankingServicios = servicios
    .map((s) => ({
      nombre: s.nombre,
      ...(porNombre.get(s.nombre.trim().toLowerCase()) ?? { cantidad: 0, monto: 0 }),
    }))
    .filter((s) => s.cantidad > 0)
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 5);
  const maxCantidadServicio = Math.max(...rankingServicios.map((s) => s.cantidad), 1);

  const montoVigenteEntradas = Object.entries(montoVigentePorMoneda);

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
      <div className="stat-cards-grid !grid-cols-1 sm:!grid-cols-3">
        <StatCard
          label="Monto vigente cotizado"
          icon={<WalletIcon className="h-4.5 w-4.5" />}
          tono="accent"
          size="hero"
          value={
            montoVigenteEntradas.length === 0 ? (
              <span className="text-accent-hover">0.00</span>
            ) : montoVigenteEntradas.length === 1 ? (
              <span className="text-accent-hover">
                {montoVigenteEntradas[0][0]}{" "}
                <AnimatedNumber value={montoVigenteEntradas[0][1]} decimals={2} />
              </span>
            ) : (
              // Más de una moneda vigente a la vez (ej. GTQ y USD): cada
              // monto en su propia línea, texto más chico — concatenados en
              // una sola línea se leen pegados y no como dos cifras distintas.
              <span className="flex flex-col gap-0.5 text-xl leading-tight">
                {montoVigenteEntradas.map(([moneda, monto]) => (
                  <span key={moneda} className="text-accent-hover">
                    {moneda} <AnimatedNumber value={monto} decimals={2} />
                  </span>
                ))}
              </span>
            )
          }
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
      </div>

      {/* Zona 3 — atención requerida: lista accionable, nunca solo un número */}
      <AtencionRequerida items={itemsAtencion} />

      {/* Zona 2 — tendencia mensual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
            Tendencia — cotizado vs. facturado (últimos 12 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TendenciaMensualChart data={tendenciaData} />
        </CardContent>
      </Card>

      {/* Zonas 4-7 — grilla más pareja, container queries para reacomodarse */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Desglose por empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {desgloseEmpresa.map(({ empresa, totalDocs, facturado, cotizado }) => (
              <div key={empresa.id} className="flex flex-col gap-1.5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-text-primary">{empresa.nombre}</span>
                  <span className="text-muted-foreground">{totalDocs} documentos</span>
                  <span className="font-mono text-brand">
                    Facturado {empresa.moneda} {facturado.toFixed(2)}
                  </span>
                  <span className="font-mono text-status-enviada">
                    Cotizado {empresa.moneda} {cotizado.toFixed(2)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{
                      width: `${maxDocsPorEmpresa > 0 ? (totalDocs / maxDocsPorEmpresa) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Desglose por tipo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {desgloseTipo.map(({ tipo, label, cantidad }) => (
              <div key={tipo} className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-mono font-semibold text-text-primary">{cantidad}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${maxCantidadPorTipo > 0 ? (cantidad / maxCantidadPorTipo) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
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
          <CardContent className="flex flex-col gap-3.5">
            {rankingServicios.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Todavía no hay suficiente actividad para armar un ranking.
              </p>
            )}
            {rankingServicios.map((s, i) => (
              <div key={s.nombre} className="flex items-center gap-3">
                <span
                  className={
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold " +
                    (i === 0
                      ? "bg-accent text-on-accent"
                      : "bg-muted text-muted-foreground")
                  }
                >
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-text-primary">{s.nombre}</span>
                    <span className="shrink-0 font-mono text-xs font-semibold text-muted-foreground">
                      {s.cantidad}x
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={"h-full rounded-full " + (i === 0 ? "bg-accent" : "bg-brand")}
                      style={{ width: `${(s.cantidad / maxCantidadServicio) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
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
