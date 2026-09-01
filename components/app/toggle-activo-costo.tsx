"use client";

import { PowerIcon, PowerOffIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { alternarActivoCostoOperativo } from "@/app/(app)/costos/actions";
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

export function ToggleActivoCosto({
  id,
  descripcion,
  activo,
}: {
  id: string;
  descripcion: string;
  activo: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function alternar() {
    startTransition(async () => {
      try {
        await alternarActivoCostoOperativo(id);
        toast.success(activo ? "Costo desactivado" : "Costo activado");
        router.refresh();
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocurrió un error");
      }
    });
  }

  // Ver nota en toggle-activo-cliente.tsx: solo se confirma la dirección de
  // "Desactivar", no la de "Activar".
  if (!activo) {
    return (
      <Button variant="outline" size="sm" onClick={alternar} disabled={isPending}>
        <PowerIcon className="h-4 w-4" />
        Activar
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <PowerOffIcon className="h-4 w-4" />
            Desactivar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>¿Desactivar &ldquo;{descripcion}&rdquo;?</DialogTitle>
          <DialogDescription>
            Deja de contar en el panel y en los reportes, pero el registro no se
            borra — podés reactivarlo después desde acá mismo.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            <XIcon className="h-4 w-4" />
            Cancelar
          </Button>
          <Button variant="destructive" onClick={alternar} disabled={isPending}>
            <PowerOffIcon className="h-4 w-4" />
            Sí, desactivar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
