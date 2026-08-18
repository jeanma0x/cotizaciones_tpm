"use client";

import { CheckIcon, PenLineIcon, TrashIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { actualizarFirmaUsuario } from "@/app/(app)/usuarios/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FIRMA_MAX_BYTES } from "@/lib/validations/usuario";

function leerComoDataUri(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(archivo);
  });
}

export function FirmaUsuarioDialog({
  usuarioId,
  nombre,
  firmaActual,
  trigger,
}: {
  usuarioId: string;
  nombre: string;
  firmaActual: string | null;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(firmaActual);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function onOpenChange(nuevo: boolean) {
    setOpen(nuevo);
    if (nuevo) setPreview(firmaActual);
  }

  async function onArchivoSeleccionado(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    if (!["image/png", "image/jpeg"].includes(archivo.type)) {
      toast.error("Solo se aceptan imágenes PNG o JPEG");
      return;
    }
    if (archivo.size > FIRMA_MAX_BYTES) {
      toast.error(
        `La imagen pesa demasiado (máximo ${Math.round(FIRMA_MAX_BYTES / 1024)}KB) — subí una versión más liviana.`,
      );
      return;
    }

    const dataUri = await leerComoDataUri(archivo);
    setPreview(dataUri);
  }

  async function guardar(firma: string | null) {
    setSubmitting(true);
    try {
      await actualizarFirmaUsuario(usuarioId, { firma });
      toast.success(firma ? "Firma guardada" : "Firma eliminada");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error");
    } finally {
      setSubmitting(false);
    }
  }

  const hayCambios = preview !== firmaActual;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Firma de {nombre}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Subí una foto o escaneo de la firma real — se usa para insertarla
            automáticamente en los documentos que este usuario firme, en vez
            de dejar el espacio en blanco para firmar a mano.
          </p>

          <div className="flex h-24 items-center justify-center rounded border border-dashed border-border bg-muted/30">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URI, no un asset estático
              <img src={preview} alt="Vista previa de la firma" className="h-16 object-contain" />
            ) : (
              <p className="text-xs text-muted-foreground">Sin firma cargada</p>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={onArchivoSeleccionado}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <PenLineIcon className="h-4 w-4" />
              {preview ? "Cambiar imagen" : "Subir imagen"}
            </Button>
            {preview && (
              <Button type="button" variant="outline" size="sm" onClick={() => setPreview(null)}>
                <TrashIcon className="h-4 w-4" />
                Quitar
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={submitting || !hayCambios}
            onClick={() => guardar(preview)}
          >
            <CheckIcon className="h-4 w-4" />
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
