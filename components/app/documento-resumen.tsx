import { BanIcon } from "lucide-react";
import { EstadoBadge } from "@/components/app/estado-badge";
import { formatearMonto } from "@/lib/formato-numero";

// Mismo componente en dos contextos de ancho distintos — página completa
// (app/(app)/documentos/[id]/page.tsx) y dentro del Sheet de vista rápida
// (documento-vista-rapida-sheet.tsx). Reacciona a su propio contenedor, no
// al viewport — ver design-system.md "Container queries".
export type DocumentoResumenData = {
  correlativo: number;
  tipoLabel: string;
  empresaNombre: string;
  clienteNombre: string;
  fecha: Date;
  validoHasta: Date | null;
  condicionesPago: string | null;
  descripcionGeneral?: string | null;
  moneda: string;
  total: number;
  estado: string;
  // Ortogonal a `estado` (ver comentario en schema.prisma) — opcional
  // porque documento-vista-rapida-sheet.tsx todavía no lo pasa.
  anulado?: boolean;
};

export function DocumentoResumen({ data }: { data: DocumentoResumenData }) {
  return (
    <div className="doc-resumen">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="correlativo-tag">TPM-{data.correlativo}</span>
        <span className="font-semibold text-text-primary">{data.tipoLabel}</span>
        <EstadoBadge estado={data.estado} />
        {data.anulado && (
          <span className="inline-flex items-center gap-1 rounded bg-danger-bg px-2 py-0.5 text-xs font-medium text-danger">
            <BanIcon className="h-3 w-3" />
            Anulada
          </span>
        )}
      </div>
      <div className="doc-resumen-grid">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Empresa</p>
          <p>{data.empresaNombre}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p>
          <p>{data.clienteNombre}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Fecha</p>
          <p className="font-mono text-sm">{data.fecha.toISOString().slice(0, 10)}</p>
        </div>
        {data.validoHasta && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Válido hasta
            </p>
            <p className="font-mono text-sm">
              {data.validoHasta.toISOString().slice(0, 10)}
            </p>
          </div>
        )}
        {data.condicionesPago && (
          <div className="doc-resumen-span-full">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Condiciones de pago
            </p>
            <p>{data.condicionesPago}</p>
          </div>
        )}
        {data.descripcionGeneral && (
          <div className="doc-resumen-span-full">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Descripción general
            </p>
            <p className="whitespace-pre-wrap">{data.descripcionGeneral}</p>
          </div>
        )}
        <div className="doc-resumen-span-full">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="font-mono text-lg font-semibold text-brand dark:text-brand-hover">
            {data.moneda} {formatearMonto(data.total)}
          </p>
        </div>
      </div>
    </div>
  );
}
