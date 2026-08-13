"use client";

import { AlertTriangleIcon, ChevronDownIcon, CheckCircle2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
//
// Desplegable, no una lista volcada entera: con actividad real, "X
// documentos requieren tu atención" puede ser una lista larga que empuja
// todo lo demás del panel para abajo apenas se entra — colapsada por
// defecto, el encabezado es el que abre/cierra.
export function AtencionRequerida({ items }: { items: ItemAtencion[] }) {
  const [abierto, setAbierto] = useState(false);

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success-bg p-5 shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2Icon className="h-6 w-6 text-success" />
        </span>
        <div>
          <p className="font-semibold text-success">Todo al día</p>
          <p className="text-sm text-success/80">
            Nada requiere tu atención en este momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-accent bg-danger-bg/40 p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        aria-expanded={abierto}
        className={cn(
          "flex w-full items-center justify-between gap-2 text-sm font-semibold text-danger",
          abierto && "mb-3",
        )}
      >
        <span className="flex items-center gap-2">
          <AlertTriangleIcon className="h-4 w-4" />
          {items.length} {items.length === 1 ? "documento requiere" : "documentos requieren"} tu
          atención
        </span>
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-(--motion-fast)",
            abierto && "rotate-180",
          )}
        />
      </button>
      {abierto && (
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
      )}
    </div>
  );
}
