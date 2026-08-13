import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type ItemAtencion = {
  id: string;
  correlativo: number;
  clienteNombre: string;
  motivo: "vencida" | "sin_respuesta" | "por_vencer";
  dias: number;
};

const MOTIVO_LABEL: Record<ItemAtencion["motivo"], (dias: number) => string> = {
  vencida: (d) => `Vencida hace ${d} ${d === 1 ? "día" : "días"}`,
  sin_respuesta: (d) => `Sin respuesta hace ${d} ${d === 1 ? "día" : "días"}`,
  por_vencer: (d) => `Vence en ${d} ${d === 1 ? "día" : "días"}`,
};

// Zona 3 del panel (scope.md): nunca una tarjeta más — borde/fondo
// distintivo si hay pendientes, estado positivo explícito si no hay nada
// (ver design-system.md "Panel — layout y estilo de gráficos").
export function AtencionRequerida({ items }: { items: ItemAtencion[] }) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
        <CheckCircle2Icon className="h-4 w-4 text-success" />
        Todo al día — nada requiere tu atención.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-accent bg-danger-bg/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-danger">
        <AlertTriangleIcon className="h-4 w-4" />
        {items.length} {items.length === 1 ? "documento requiere" : "documentos requieren"} tu
        atención
      </div>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/documentos/${item.id}`}
            className={cn(
              "flex items-center justify-between gap-3 rounded p-2 text-sm transition-colors duration-(--motion-fast)",
              "bg-surface hover:bg-muted/50",
            )}
          >
            <span className="flex items-center gap-2">
              <span className="correlativo-tag">TPM-{item.correlativo}</span>
              {item.clienteNombre}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                item.motivo === "por_vencer" ? "text-accent-hover" : "text-danger",
              )}
            >
              {MOTIVO_LABEL[item.motivo](item.dias)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
