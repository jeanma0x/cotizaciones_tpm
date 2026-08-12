"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { alternarActivoServicio } from "@/app/(app)/servicios/actions";
import { Button } from "@/components/ui/button";

export function ToggleActivoServicio({
  id,
  activo,
}: {
  id: string;
  activo: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function alternar() {
    startTransition(async () => {
      try {
        await alternarActivoServicio(id);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocurrió un error");
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={alternar}
      disabled={isPending}
    >
      {activo ? "Desactivar" : "Activar"}
    </Button>
  );
}
