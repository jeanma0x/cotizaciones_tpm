"use client";

import { PowerIcon, PowerOffIcon } from "lucide-react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  function alternar() {
    startTransition(async () => {
      try {
        await alternarActivoServicio(id);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocurrió un error");
      }
    });
  }

  return (
    <Button
      variant={activo ? "destructive" : "outline"}
      size="sm"
      onClick={alternar}
      disabled={isPending}
    >
      {activo ? <PowerOffIcon className="h-4 w-4" /> : <PowerIcon className="h-4 w-4" />}
      {activo ? "Desactivar" : "Activar"}
    </Button>
  );
}
