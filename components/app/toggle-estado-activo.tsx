"use client";

import { PowerIcon, PowerOffIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { alternarActivoRegistroActivo } from "@/app/(app)/activos/actions";
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

// Nombre "ToggleEstadoActivo" (no "ToggleActivoActivo") para no confundir el
// verbo con el sustantivo — mismo patrón que ToggleActivoCliente/Servicio.
export function ToggleEstadoActivo({
  id,
  nombre,
  activo,
}: {
  id: string;
  nombre: string;
  activo: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function alternar() {
    startTransition(async () => {
      try {
        await alternarActivoRegistroActivo(id);
        router.refresh();
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocurrió un error");
      }
    });
  }

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
          <DialogTitle>¿Desactivar {nombre}?</DialogTitle>
          <DialogDescription>
            No va a aparecer para elegir en documentos nuevos. Podés reactivarlo
            después desde acá mismo.
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
