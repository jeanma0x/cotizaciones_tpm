"use client";

import { RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { cambiarEstadoDocumento } from "@/app/(app)/documentos/actions";
import { EstadoBadge } from "@/components/app/estado-badge";
import { Button } from "@/components/ui/button";
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

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        {estadoOptimista.historial.map((h) => (
          <div key={h.id} className="flex items-center gap-3 text-sm">
            <span className="font-mono text-xs text-muted-foreground">
              {h.fecha.toISOString().slice(0, 16).replace("T", " ")}
            </span>
            <EstadoBadge estado={h.estado} />
            {h.nota && <span className="text-muted-foreground">— {h.nota}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
