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

// Reutilizado por Usuarios/Empresas/Clientes/Servicios (Costos tiene su
// propio HistorialCostosSheet, con columnas de monto/moneda propias — este
// es el genérico para todo lo demás, mismo patrón visual).
export type FilaAuditoriaGenerica = {
  id: string;
  variant: "creado" | "editado" | "eliminado";
  accionLabel: string;
  titulo: string;
  detalle: string;
  usuarioNombre: string | null;
  fecha: string; // ISO, con hora
};

const VARIANTE_ESTILO: Record<
  FilaAuditoriaGenerica["variant"],
  { icon: typeof PlusIcon; className: string }
> = {
  creado: { icon: PlusIcon, className: "text-success bg-success-bg" },
  editado: { icon: PencilIcon, className: "text-status-enviada bg-status-enviada-bg" },
  eliminado: { icon: TrashIcon, className: "text-danger bg-danger-bg" },
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

export function HistorialAuditoriaSheet({
  titulo,
  entradas,
}: {
  titulo: string;
  entradas: FilaAuditoriaGenerica[];
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
          <SheetTitle>{titulo}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-4">
          {entradas.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Todavía no hay actividad registrada.
            </p>
          )}
          {entradas.map((entrada) => {
            const estilo = VARIANTE_ESTILO[entrada.variant];
            const Icon = estilo.icon;
            return (
              <div
                key={entrada.id}
                className="flex flex-col gap-1.5 rounded-lg border border-border p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge className={estilo.className}>
                    <Icon className="h-3 w-3" />
                    {entrada.accionLabel}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatearFechaHora(entrada.fecha)}
                  </span>
                </div>
                <p className="font-medium text-text-primary">{entrada.titulo}</p>
                <p className="text-xs text-muted-foreground">{entrada.detalle}</p>
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
