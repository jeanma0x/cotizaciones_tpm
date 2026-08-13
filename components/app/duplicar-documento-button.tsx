"use client";

import { CopyIcon, XIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { duplicarDocumento } from "@/app/(app)/documentos/actions";
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

export function DuplicarDocumentoButton({
  correlativo,
  documentoId,
}: {
  correlativo: number;
  documentoId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function duplicar() {
    startTransition(async () => {
      try {
        await duplicarDocumento(documentoId);
      } catch (error) {
        if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
        toast.error(error instanceof Error ? error.message : "Ocurrió un error");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <CopyIcon className="h-4 w-4" />
            Duplicar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>¿Duplicar TPM-{correlativo}?</DialogTitle>
          <DialogDescription>
            Se va a crear un documento nuevo con el mismo cliente e ítems, y un
            correlativo nuevo. El correlativo no se puede reutilizar después, aunque
            cancelés el documento duplicado.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            <XIcon className="h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={duplicar} disabled={isPending}>
            <CopyIcon className="h-4 w-4" />
            Sí, duplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
