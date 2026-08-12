"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { alternarActivoCliente } from "@/app/(app)/clientes/actions";
import { Button } from "@/components/ui/button";

export function ToggleActivoCliente({
  id,
  activo,
}: {
  id: string;
  activo: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function alternar() {
    startTransition(async () => {
      try {
        await alternarActivoCliente(id);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocurrió un error");
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={alternar} disabled={isPending}>
      {activo ? "Desactivar" : "Activar"}
    </Button>
  );
}
