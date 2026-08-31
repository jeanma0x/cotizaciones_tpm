"use client";

import { HistoryIcon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CATEGORIA_COSTO_LABELS } from "@/lib/validations/costo";
import { formatearMonto } from "@/lib/formato-numero";

export type FilaAuditoriaCosto = {
  id: string;
  accion: "CREADO" | "EDITADO" | "ELIMINADO";
  categoria: keyof typeof CATEGORIA_COSTO_LABELS;
  categoriaOtroDetalle: string | null;
  descripcion: string;
  monto: number;
  moneda: string;
  empresaNombre: string;
  usuarioNombre: string | null;
  fecha: string; // ISO, ya con hora — se muestra completo (no es una fecha de calendario pura)
};

const ACCION_ESTILO: Record<
  FilaAuditoriaCosto["accion"],
  { label: string; icon: typeof PlusIcon; className: string }
> = {
  CREADO: { label: "Creado", icon: PlusIcon, className: "text-success bg-success-bg" },
  EDITADO: { label: "Editado", icon: PencilIcon, className: "text-status-enviada bg-status-enviada-bg" },
  ELIMINADO: { label: "Eliminado", icon: TrashIcon, className: "text-danger bg-danger-bg" },
};

function formatearFechaHora(iso: string) {
  return new Date(iso).toLocaleString("es-GT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistorialCostosSheet({
  entradas,
  mostrarEmpresa,
}: {
  entradas: FilaAuditoriaCosto[];
  mostrarEmpresa: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline">
            <HistoryIcon className="h-4 w-4" />
            Historial
          </Button>
        }
      />
      <SheetContent className="flex flex-col gap-4 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Historial de costos</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-4">
          {entradas.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Todavía no hay actividad registrada.
            </p>
          )}
          {entradas.map((entrada) => {
            const estilo = ACCION_ESTILO[entrada.accion];
            const Icon = estilo.icon;
            return (
              <div
                key={entrada.id}
                className="flex flex-col gap-1.5 rounded-lg border border-border p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge className={estilo.className}>
                    <Icon className="h-3 w-3" />
                    {estilo.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatearFechaHora(entrada.fecha)}
                  </span>
                </div>
                <p className="font-medium text-text-primary">{entrada.descripcion}</p>
                <p className="text-xs text-muted-foreground">
                  {entrada.categoria === "OTRO" && entrada.categoriaOtroDetalle
                    ? `Otro: ${entrada.categoriaOtroDetalle}`
                    : CATEGORIA_COSTO_LABELS[entrada.categoria]}{" "}
                  · {entrada.moneda}{" "}
                  {formatearMonto(entrada.monto)}
                  {mostrarEmpresa && ` · ${entrada.empresaNombre}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entrada.usuarioNombre ?? "Usuario eliminado"}
                </p>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
