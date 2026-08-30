import { FileBarChart2Icon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ReporteAcciones } from "@/components/app/reporte-acciones";
import { ReporteFiltroCliente } from "@/components/app/reporte-filtro-cliente";
import { ReporteFiltroDetalle } from "@/components/app/reporte-filtro-detalle";
import { ReporteFiltroRango } from "@/components/app/reporte-filtro-rango";
import { ReporteImprimible, type TotalPorEmpresa } from "@/components/app/reporte-imprimible";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEmpresaActivaId } from "@/lib/empresa-activa";
import { rangoFechaPorDefecto } from "@/lib/rango-fecha";
import { obtenerReporteClientes } from "@/lib/reportes/clientes";
import { obtenerReporteCostos } from "@/lib/reportes/costos";
import { obtenerDetalleReporte } from "@/lib/reportes/detalle";
import { obtenerReporteFinanciero } from "@/lib/reportes/financiero";

// Módulo de Reportes (Fase 3.6, docs/fase3-clientes-proyectos-costos-activos.md):
// UN solo reporte con filtros opcionales de fecha/empresa/cliente/proyecto,
// no una pantalla por tipo de reporte — distinto del panel (que es para ver
// el negocio en vivo), este es un documento formal y estático de un
// período cerrado, para entregarle al contador o guardar como respaldo.
export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{
    desde?: string;
    hasta?: string;
    clienteId?: string;
    proyectoId?: string;
    detalle?: string;
  }>;
}) {
  const { desde: desdeStr, hasta: hastaStr, clienteId, proyectoId, detalle } = await searchParams;
  const [empresasPermitidas, empresaActivaId] = await Promise.all([
    getEmpresasPermitidas(),
    getEmpresaActivaId(),
  ]);
  const empresaIds = empresaActivaId ? [empresaActivaId] : empresasPermitidas;
  const { desde, hasta } = rangoFechaPorDefecto(desdeStr, hastaStr);
  const incluirDetalle = detalle === "1";

  const [financiero, clientesConProyectos, desgloseProyecto, desgloseCostos, detalleReporte] =
    await Promise.all([
      obtenerReporteFinanciero({ empresaIds, desde, hasta }),
      db.cliente.findMany({
        where: { empresaId: { in: empresaIds } },
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true, proyectos: { orderBy: { nombre: "asc" } } },
      }),
      obtenerReporteClientes({ empresaIds, desde, hasta, clienteId, proyectoId }),
      obtenerReporteCostos({ empresaIds, desde, hasta, clienteId, proyectoId }),
      incluirDetalle
        ? obtenerDetalleReporte({ empresaIds, desde, hasta, clienteId, proyectoId })
        : Promise.resolve(null),
    ]);

  const totalesPorEmpresa = new Map<string, TotalPorEmpresa>();
  for (const f of financiero) {
    const actual = totalesPorEmpresa.get(f.empresaNombre) ?? {
      empresaNombre: f.empresaNombre,
      moneda: f.moneda,
      cotizado: 0,
      facturado: 0,
      costos: 0,
      utilidadNeta: 0,
    };
    actual.cotizado += f.cotizado;
    actual.facturado += f.facturado;
    actual.costos += f.costos;
    actual.utilidadNeta += f.utilidadNeta;
    totalesPorEmpresa.set(f.empresaNombre, actual);
  }

  const params = new URLSearchParams();
  params.set("desde", desdeStr ?? desde.toISOString().slice(0, 10));
  params.set("hasta", hastaStr ?? hasta.toISOString().slice(0, 10));
  if (empresaActivaId) params.set("empresaId", empresaActivaId);
  if (clienteId) params.set("clienteId", clienteId);
  if (proyectoId) params.set("proyectoId", proyectoId);
  if (incluirDetalle) params.set("detalle", "1");

  const subtitulo = `${params.get("desde")} a ${params.get("hasta")}`;

  const contenidoImprimible = (
    <ReporteImprimible
      subtitulo={subtitulo}
      totalesPorEmpresa={Array.from(totalesPorEmpresa.values())}
      desgloseProyecto={desgloseProyecto}
      desgloseCostos={desgloseCostos}
      mostrarDesgloseEmpresa={!empresaActivaId}
      detalle={detalleReporte}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reportes"
        description="Un documento formal del período elegido — para el contador o como respaldo."
        icon={FileBarChart2Icon}
        actions={
          <ReporteAcciones
            exportarHref={`/api/reportes/exportar?${params.toString()}`}
            contenidoImprimible={contenidoImprimible}
          />
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <ReporteFiltroRango basePath="/reportes" />
        <ReporteFiltroCliente basePath="/reportes" clientes={clientesConProyectos} />
        <ReporteFiltroDetalle basePath="/reportes" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        {contenidoImprimible}
      </div>
    </div>
  );
}
