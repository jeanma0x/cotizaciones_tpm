"use client";

import { RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { cambiarEstadoDocumento } from "@/app/(app)/documentos/actions";
import { EstadoBadge, getEstiloEstado } from "@/components/app/estado-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ESTADOS: Record<string, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  EN_NEGOCIACION: "En negociación",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
  VENCIDA: "Vencida",
  FACTURADA: "Facturada",
};

type Historial = { id: string; fecha: Date; estado: string; nota: string | null };

const UN_DIA_MS = 24 * 60 * 60 * 1000;

function formatearRelativo(fecha: Date) {
  const dias = Math.floor((Date.now() - fecha.getTime()) / UN_DIA_MS);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 30) return `Hace ${dias} días`;
  return fecha.toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" });
}

export function DocumentoEstadoForm({
  documentoId,
  estadoActual,
  historialInicial,
}: {
  documentoId: string;
  estadoActual: string;
  historialInicial: Historial[];
}) {
  const [estado, setEstado] = useState(estadoActual);
  const [nota, setNota] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Actualiza estado e historial en la UI de inmediato, sin esperar la
  // respuesta del servidor — revierte con un toast si la mutación falla.
  // Ver design-system.md "Interacciones optimistas".
  const [estadoOptimista, agregarCambioOptimista] = useOptimistic(
    { estado: estadoActual, historial: historialInicial },
    (actual, nuevoEstado: string) => ({
      estado: nuevoEstado,
      historial: [
        {
          id: "optimista",
          fecha: new Date(),
          estado: nuevoEstado,
          nota: null,
        },
        ...actual.historial,
      ],
    }),
  );

  function aplicar() {
    const nuevoEstado = estado;
    startTransition(async () => {
      agregarCambioOptimista(nuevoEstado);
      try {
        await cambiarEstadoDocumento(documentoId, nuevoEstado, nota || undefined);
        toast.success("Estado actualizado");
        setNota("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocurrió un error");
        setEstado(estadoActual);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        Estado actual
        <EstadoBadge estado={estadoOptimista.estado} />
        {isPending && <span className="text-xs italic">Guardando…</span>}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Select items={ESTADOS} value={estado} onValueChange={(v) => setEstado(v as string)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ESTADOS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Nota (opcional)"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          className="sm:w-64"
        />
        <Button onClick={aplicar} disabled={isPending || estado === estadoActual}>
          <RefreshCwIcon className="h-4 w-4" />
          Cambiar estado
        </Button>
      </div>

      {/* Línea de tiempo, no una lista de filas idénticas: cada paso tiene su
          propio ícono/color (los mismos del EstadoBadge, ver getEstiloEstado)
          conectados por un riel vertical, y el paso más reciente se destaca
          — así se lee como una bitácora de trazabilidad real, que es
          justamente el valor que se le vendió al cliente (ver CLAUDE.md
          "Nunca se pierde el historial"), no como una lista genérica. */}
      <div className="flex flex-col border-t border-border pt-5">
        {estadoOptimista.historial.map((h, i) => {
          const estilo = getEstiloEstado(h.estado);
          const Icon = estilo?.icon;
          const esActual = i === 0;
          const esUltimo = i === estadoOptimista.historial.length - 1;

          return (
            <div key={h.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                    estilo?.className ?? "bg-muted text-muted-foreground",
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                </span>
                {!esUltimo && (
                  <span className="my-0.5 min-h-6 w-0.5 flex-1 rounded-full bg-border" />
                )}
              </div>
              <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", !esUltimo && "pb-6")}>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      esActual ? "text-text-primary" : "text-muted-foreground",
                    )}
                  >
                    {estilo?.label ?? h.estado}
                  </span>
                  {esActual && (
                    <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent-hover">
                      Actual
                    </span>
                  )}
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatearRelativo(h.fecha)}
                  </span>
                </div>
                {h.nota && <p className="text-sm text-muted-foreground">{h.nota}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
