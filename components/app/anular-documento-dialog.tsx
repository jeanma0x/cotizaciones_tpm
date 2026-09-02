"use client";

import { BanIcon, PowerIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { anularDocumento, reactivarDocumento } from "@/app/(app)/documentos/actions";
import { AutosizeTextarea } from "@/components/app/autosize-textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Alternativa al "soft delete" descartado (ver comentario en
// documentos/actions.ts): a diferencia de Desactivar/Activar en Cliente,
// Servicio, Costo y Activo, acá la dirección "hacia adelante" (Anular) sí
// exige un motivo — es una acción financiera con más peso, no un simple
// ocultar del catálogo.
export function AnularDocumentoDialog({
  id,
  correlativo,
  anulado,
}: {
  id: string;
  correlativo: number;
  anulado: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function reactivar() {
    startTransition(async () => {
      try {
        await reactivarDocumento(id);
        toast.success("Documento reactivado");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocurrió un error");
      }
    });
  }

  function anular() {
    startTransition(async () => {
      try {
        await anularDocumento(id, motivo);
        toast.success("Documento anulado");
        setOpen(false);
        setMotivo("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocurrió un error");
      }
    });
  }

  if (anulado) {
    return (
      <Button variant="outline" size="sm" onClick={reactivar} disabled={isPending}>
        <PowerIcon className="h-4 w-4" />
        Reactivar
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <BanIcon className="h-4 w-4" />
            Anular
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>¿Anular TPM-{correlativo}?</DialogTitle>
          <DialogDescription>
            Deja de contar en el panel, los reportes y las exportaciones — pero el
            documento sigue visible en el listado y conserva su correlativo para
            siempre. Podés reactivarlo después desde acá mismo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="motivoAnulacion">Motivo</Label>
          <AutosizeTextarea
            id="motivoAnulacion"
            placeholder="Ej. Cliente canceló el servicio, se cargó por error…"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setMotivo("");
            }}
            disabled={isPending}
          >
            <XIcon className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={anular}
            disabled={isPending || !motivo.trim()}
          >
            <BanIcon className="h-4 w-4" />
            Sí, anular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
