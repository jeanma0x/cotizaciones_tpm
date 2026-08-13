import { AlertTriangleIcon } from "lucide-react";
import Link from "next/link";
import { AnimatedNumber } from "@/components/app/animated-number";
import { DistribucionEstadoChart } from "@/components/app/distribucion-estado-chart";
import { EstadoBadge } from "@/components/app/estado-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEmpresasPermitidas } from "@/lib/auth";
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

// Definiciones de las métricas (no especificadas al detalle en scope.md,
// decisión tomada acá — avisar si el cliente las quiere distintas):
// - "Monto vigente cotizado": suma de documentos ENVIADA o EN_NEGOCIACION
//   (todavía esperando respuesta del cliente).
// - "Tasa de conversión": ACEPTADA + FACTURADA sobre todo lo que salió de
//   Borrador (documentos realmente enviados, no borradores sin mandar).
// - "Sin respuesta hace más de 7 días": ENVIADA/EN_NEGOCIACION cuyo último
//   cambio de estado fue hace más de una semana.
const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

export default async function DashboardPage() {
  const empresasPermitidas = await getEmpresasPermitidas();
  const where = { empresaId: { in: empresasPermitidas } };

  const [
    totalDocumentos,
    vigentes,
    resueltos,
    pendientes,
    porEmpresa,
    porTipo,
    porEstado,
    empresas,
    recientes,
  ] = await Promise.all([
    db.documento.count({ where }),
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
      where: { ...where, estado: { in: ["ENVIADA", "EN_NEGOCIACION"] } },
      include: {
        empresa: true,
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
  ]);

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

  const hace7Dias = new Date(Date.now() - SIETE_DIAS_MS);
  const sinRespuesta = pendientes.filter((doc) => {
    const ultimoCambio = doc.historial[0]?.fecha ?? doc.createdAt;
    return ultimoCambio < hace7Dias;
  });

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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-text-primary">Panel</h1>

      <div className="stat-cards-grid">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Total de documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-brand">
              <AnimatedNumber value={totalDocumentos} />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Monto vigente cotizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(montoVigentePorMoneda).length === 0 ? (
              <p className="font-mono text-2xl font-bold text-brand">0.00</p>
            ) : (
              Object.entries(montoVigentePorMoneda).map(([moneda, monto]) => (
                <p key={moneda} className="font-mono text-2xl font-bold text-brand">
                  {moneda} <AnimatedNumber value={monto} formato={(n) => n.toFixed(2)} />
                </p>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Tasa de conversión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-brand">
              <AnimatedNumber value={tasaConversion} formato={(n) => `${n.toFixed(0)}%`} />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Sin respuesta hace 7+ días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-danger">
              <AnimatedNumber value={sinRespuesta.length} />
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Desglose por empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {desgloseEmpresa.map(({ empresa, totalDocs, facturado, cotizado }) => (
              <div
                key={empresa.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 text-sm last:border-b-0 last:pb-0"
              >
                <span className="font-medium text-text-primary">{empresa.nombre}</span>
                <span className="text-muted-foreground">{totalDocs} documentos</span>
                <span className="font-mono text-brand">
                  Facturado {empresa.moneda} {facturado.toFixed(2)}
                </span>
                <span className="font-mono text-status-enviada">
                  Cotizado {empresa.moneda} {cotizado.toFixed(2)}
                </span>
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
          <CardContent className="flex flex-col gap-2">
            {desgloseTipo.map(({ tipo, label, cantidad }) => (
              <div key={tipo} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono font-semibold text-text-primary">{cantidad}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
                className="flex items-center justify-between gap-3 rounded p-2 text-sm hover:bg-muted/50"
              >
                <span className="flex items-center gap-2">
                  <span className="correlativo-tag">TPM-{doc.correlativo}</span>
                  {doc.cliente?.nombre ?? "—"}
                  <span className="text-xs text-muted-foreground">{doc.empresa.nombre}</span>
                </span>
                <EstadoBadge estado={doc.estado} />
              </Link>
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
      </div>

      {sinRespuesta.length > 0 && (
        <div className="rounded border border-dashed border-danger bg-danger-bg p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-danger">
            <AlertTriangleIcon className="h-4 w-4" />
            Documentos sin respuesta hace más de una semana
          </div>
          <div className="flex flex-col gap-2">
            {sinRespuesta.map((doc) => (
              <Link
                key={doc.id}
                href={`/documentos/${doc.id}`}
                className="flex items-center justify-between gap-3 rounded bg-surface p-2 text-sm hover:bg-muted/50"
              >
                <span className="flex items-center gap-2">
                  <span className="correlativo-tag">TPM-{doc.correlativo}</span>
                  {doc.cliente?.nombre ?? "—"}
                </span>
                <EstadoBadge estado={doc.estado} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
