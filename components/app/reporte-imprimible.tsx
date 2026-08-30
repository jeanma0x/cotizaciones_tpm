import { formatearMonto } from "@/lib/formato-numero";
import type { FilaDetalleCosto, FilaDetalleDocumento } from "@/lib/reportes/detalle";
import type { FilaReporteCliente } from "@/lib/reportes/clientes";
import type { FilaReporteCosto } from "@/lib/reportes/costos";

export type TotalPorEmpresa = {
  empresaNombre: string;
  moneda: string;
  cotizado: number;
  facturado: number;
  costos: number;
  utilidadNeta: number;
};

// Contenido del reporte con la MISMA identidad institucional que
// cotizaciones/facturas (logo real, tipografía, colores — ver
// documento-imprimible.tsx y docs/document-export.md): un reporte es un
// documento formal para entregarle al contador, no una captura de pantalla
// de la app. Estructura exacta pedida en
// docs/fase3-clientes-proyectos-costos-activos.md ("Módulo de Reportes"):
// resumen ejecutivo, desglose por proyecto, desglose por empresa (si no se
// filtró a una sola), y un detalle opcional de documentos/costos
// individuales. "Costos por categoría" es un agregado adicional, no pedido
// explícitamente pero coherente con datos ya contratados (Fase 3.1).
export function ReporteImprimible({
  subtitulo,
  totalesPorEmpresa,
  desgloseProyecto,
  desgloseCostos,
  mostrarDesgloseEmpresa,
  detalle,
}: {
  subtitulo: string;
  totalesPorEmpresa: TotalPorEmpresa[];
  desgloseProyecto: FilaReporteCliente[];
  desgloseCostos: FilaReporteCosto[];
  mostrarDesgloseEmpresa: boolean;
  detalle: { documentos: FilaDetalleDocumento[]; costos: FilaDetalleCosto[] } | null;
}) {
  const totalesPorMoneda = new Map<
    string,
    { cotizado: number; facturado: number; costos: number; utilidadNeta: number }
  >();
  for (const t of totalesPorEmpresa) {
    const actual = totalesPorMoneda.get(t.moneda) ?? {
      cotizado: 0,
      facturado: 0,
      costos: 0,
      utilidadNeta: 0,
    };
    actual.cotizado += t.cotizado;
    actual.facturado += t.facturado;
    actual.costos += t.costos;
    actual.utilidadNeta += t.utilidadNeta;
    totalesPorMoneda.set(t.moneda, actual);
  }

  return (
    <div className="documento-imprimible relative mx-auto max-w-3xl bg-surface px-10 py-12 text-text-primary">
      <header className="encabezado-firma mb-8 flex flex-col items-center gap-2 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático de marca */}
        <img src="/marca/svg/logo-color.svg" alt="Servicios Generales TPM" className="h-14 w-auto" />
        <h1 className="font-mono text-xl font-extrabold text-brand">Reporte financiero</h1>
        <p className="text-xs font-medium uppercase tracking-widest text-accent-hover">{subtitulo}</p>
      </header>

      <section className="mb-8">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand">
          <span className="h-px w-4 bg-accent" />
          Resumen ejecutivo
        </h2>
        {totalesPorMoneda.size === 0 ? (
          <p className="text-sm text-muted-foreground">Sin actividad en este período.</p>
        ) : (
          <div className="flex flex-wrap gap-8">
            {Array.from(totalesPorMoneda.entries()).map(([moneda, t]) => (
              <dl key={moneda} className="text-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {moneda}
                </dt>
                <dd className="font-mono">Cotizado: {formatearMonto(t.cotizado)}</dd>
                <dd className="font-mono">Facturado: {formatearMonto(t.facturado)}</dd>
                <dd className="font-mono">Costos: {formatearMonto(t.costos)}</dd>
                <dd className="font-mono font-bold">Utilidad neta: {formatearMonto(t.utilidadNeta)}</dd>
              </dl>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand">
          <span className="h-px w-4 bg-accent" />
          Desglose por proyecto
        </h2>
        {desgloseProyecto.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin actividad en este período.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-1.5 pr-2">Cliente</th>
                <th className="py-1.5 pr-2">Proyecto</th>
                <th className="py-1.5 pr-2 text-right">Facturado</th>
                <th className="py-1.5 pr-2 text-right">Costos</th>
                <th className="py-1.5 pr-2 text-right">Utilidad</th>
              </tr>
            </thead>
            <tbody>
              {desgloseProyecto.map((f) => (
                <tr key={`${f.clienteId}-${f.proyectoId ?? "directo"}`} className="border-b border-border last:border-b-0">
                  <td className="py-1.5 pr-2">{f.clienteNombre}</td>
                  <td className="py-1.5 pr-2 text-muted-foreground">{f.proyectoNombre ?? "Sin proyecto"}</td>
                  <td className="py-1.5 pr-2 text-right font-mono">
                    {f.moneda} {formatearMonto(f.facturado)}
                  </td>
                  <td className="py-1.5 pr-2 text-right font-mono">
                    {f.moneda} {formatearMonto(f.costos)}
                  </td>
                  <td className="py-1.5 pr-2 text-right font-mono font-semibold">
                    {f.moneda} {formatearMonto(f.utilidad)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {mostrarDesgloseEmpresa && (
        <section className="mb-8">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand">
            <span className="h-px w-4 bg-accent" />
            Desglose por empresa
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-1.5 pr-2">Empresa</th>
                <th className="py-1.5 pr-2 text-right">Cotizado</th>
                <th className="py-1.5 pr-2 text-right">Facturado</th>
                <th className="py-1.5 pr-2 text-right">Costos</th>
                <th className="py-1.5 pr-2 text-right">Utilidad</th>
              </tr>
            </thead>
            <tbody>
              {totalesPorEmpresa.map((t) => (
                <tr key={t.empresaNombre} className="border-b border-border last:border-b-0">
                  <td className="py-1.5 pr-2">{t.empresaNombre}</td>
                  <td className="py-1.5 pr-2 text-right font-mono">
                    {t.moneda} {formatearMonto(t.cotizado)}
                  </td>
                  <td className="py-1.5 pr-2 text-right font-mono">
                    {t.moneda} {formatearMonto(t.facturado)}
                  </td>
                  <td className="py-1.5 pr-2 text-right font-mono">
                    {t.moneda} {formatearMonto(t.costos)}
                  </td>
                  <td className="py-1.5 pr-2 text-right font-mono font-semibold">
                    {t.moneda} {formatearMonto(t.utilidadNeta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand">
          <span className="h-px w-4 bg-accent" />
          Costos por categoría
        </h2>
        {desgloseCostos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin costos en este período.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {desgloseCostos.map((c) => (
                <tr key={`${c.empresaId}-${c.categoria}`} className="border-b border-border last:border-b-0">
                  <td className="py-1.5 pr-2">
                    {c.categoriaLabel}
                    {mostrarDesgloseEmpresa && <span className="text-muted-foreground"> · {c.empresaNombre}</span>}
                  </td>
                  <td className="py-1.5 pr-2 text-right font-mono">
                    {c.moneda} {formatearMonto(c.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {detalle && (
        <section className="page-break-before">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand">
            <span className="h-px w-4 bg-accent" />
            Detalle — documentos facturados
          </h2>
          {detalle.documentos.length === 0 ? (
            <p className="mb-6 text-sm text-muted-foreground">Sin documentos en este período.</p>
          ) : (
            <table className="mb-6 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-1.5 pr-2">Fecha</th>
                  <th className="py-1.5 pr-2">Cliente</th>
                  <th className="py-1.5 pr-2">Proyecto</th>
                  <th className="py-1.5 pr-2">Tipo</th>
                  <th className="py-1.5 pr-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {detalle.documentos.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-b-0">
                    <td className="py-1 pr-2 font-mono">{d.fecha.toISOString().slice(0, 10)}</td>
                    <td className="py-1 pr-2">{d.clienteNombre}</td>
                    <td className="py-1 pr-2 text-muted-foreground">{d.proyectoNombre ?? "—"}</td>
                    <td className="py-1 pr-2">{d.tipoLabel}</td>
                    <td className="py-1 pr-2 text-right font-mono">
                      {d.moneda} {formatearMonto(d.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand">
            <span className="h-px w-4 bg-accent" />
            Detalle — costos operativos
          </h2>
          {detalle.costos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin costos en este período.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-1.5 pr-2">Fecha</th>
                  <th className="py-1.5 pr-2">Categoría</th>
                  <th className="py-1.5 pr-2">Descripción</th>
                  <th className="py-1.5 pr-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {detalle.costos.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-b-0">
                    <td className="py-1 pr-2 font-mono">{c.fecha.toISOString().slice(0, 10)}</td>
                    <td className="py-1 pr-2">{c.categoriaLabel}</td>
                    <td className="py-1 pr-2">{c.descripcion}</td>
                    <td className="py-1 pr-2 text-right font-mono">
                      {c.moneda} {formatearMonto(c.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}
