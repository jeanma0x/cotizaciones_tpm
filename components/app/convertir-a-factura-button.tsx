"use client";

import { ReceiptIcon, XIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { convertirAFactura } from "@/app/(app)/documentos/actions";
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

export function ConvertirAFacturaButton({
  documentoId,
  correlativo,
}: {
  documentoId: string;
  correlativo: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function convertir() {
    startTransition(async () => {
      try {
        await convertirAFactura(documentoId);
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
          <Button>
            <ReceiptIcon className="h-4 w-4" />
            Convertir a factura
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>¿Convertir TPM-{correlativo} en factura?</DialogTitle>
          <DialogDescription>
            Se crea una factura nueva con el mismo cliente, ítems y totales, con su
            propio correlativo. Esta cotización pasa a estado &quot;Facturada&quot; y queda
            enlazada a la factura nueva en el historial de ambas. No se puede
            deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            <XIcon className="h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={convertir} disabled={isPending}>
            <ReceiptIcon className="h-4 w-4" />
            Sí, convertir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
