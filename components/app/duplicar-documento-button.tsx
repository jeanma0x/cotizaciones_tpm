"use client";

import { CopyIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { duplicarDocumento } from "@/app/(app)/documentos/actions";
import { Button } from "@/components/ui/button";

export function DuplicarDocumentoButton({ documentoId }: { documentoId: string }) {
  const [isPending, startTransition] = useTransition();

  function duplicar() {
    startTransition(async () => {
      try {
        await duplicarDocumento(documentoId);
      } catch (error) {
        if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
        toast.error(error instanceof Error ? error.message : "Ocurrió un error");
      }
    });
  }

  return (
    <Button variant="outline" onClick={duplicar} disabled={isPending}>
      <CopyIcon className="h-4 w-4" />
      Duplicar
    </Button>
  );
}
