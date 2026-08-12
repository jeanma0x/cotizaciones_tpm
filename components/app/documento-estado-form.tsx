"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cambiarEstadoDocumento } from "@/app/(app)/documentos/actions";
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

export function DocumentoEstadoForm({
  documentoId,
  estadoActual,
}: {
  documentoId: string;
  estadoActual: string;
}) {
  const [estado, setEstado] = useState(estadoActual);
  const [nota, setNota] = useState("");
  const [isPending, startTransition] = useTransition();

  function aplicar() {
    startTransition(async () => {
      try {
        await cambiarEstadoDocumento(documentoId, estado, nota || undefined);
        toast.success("Estado actualizado");
        setNota("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocurrió un error");
      }
    });
  }

  return (
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
        Cambiar estado
      </Button>
    </div>
  );
}
