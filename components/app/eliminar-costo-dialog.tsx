"use client";

import { TrashIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { eliminarCostoOperativo } from "@/app/(app)/costos/actions";
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

export function EliminarCostoDialog({
  id,
  descripcion,
}: {
  id: string;
  descripcion: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function eliminar() {
    startTransition(async () => {
      try {
        await eliminarCostoOperativo(id);
        toast.success("Costo eliminado");
        router.refresh();
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocurrió un error");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <TrashIcon className="h-4 w-4" />
            Eliminar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>¿Eliminar &ldquo;{descripcion}&rdquo;?</DialogTitle>
          <DialogDescription>
            Esto quita el registro del costo por completo de la tabla — a
            diferencia de cotizaciones/facturas, no queda como fila para
            editar o reactivar después. Sí queda un rastro en el historial de
            auditoría (quién y cuándo lo borró), pero el costo en sí no se
            puede recuperar.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            <XIcon className="h-4 w-4" />
            Cancelar
          </Button>
          <Button variant="destructive" onClick={eliminar} disabled={isPending}>
            <TrashIcon className="h-4 w-4" />
            Sí, eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
