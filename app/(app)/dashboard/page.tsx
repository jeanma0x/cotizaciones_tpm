import { AlertTriangleIcon } from "lucide-react";
import Link from "next/link";
import { EstadoBadge } from "@/components/app/estado-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";

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

  const [totalDocumentos, vigentes, resueltos, pendientes] = await Promise.all([
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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink">Panel</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Total de documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-navy">{totalDocumentos}</p>
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
              <p className="font-mono text-2xl font-bold text-navy">0.00</p>
            ) : (
              Object.entries(montoVigentePorMoneda).map(([moneda, monto]) => (
                <p key={moneda} className="font-mono text-2xl font-bold text-navy">
                  {moneda} {monto.toFixed(2)}
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
            <p className="font-mono text-2xl font-bold text-navy">
              {tasaConversion.toFixed(0)}%
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
              {sinRespuesta.length}
            </p>
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
                className="flex items-center justify-between gap-3 rounded bg-paper p-2 text-sm hover:bg-muted/50"
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
