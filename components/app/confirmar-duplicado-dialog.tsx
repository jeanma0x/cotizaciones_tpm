"use client";

import { AlertCircleIcon, CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Diálogo compartido de doble confirmación para Cliente/Servicio/Proyecto
// (Tanda 2 del audit crítico): el usuario trabaja desde Excel/WhatsApp y
// puede repetir nombres fácilmente, pero un homónimo legítimo también
// existe — así que esto nunca bloquea, solo confirma antes de crear.
// Tono neutro (ghost/outline), no destructivo: crear un duplicado a
// propósito es una acción válida, no peligrosa, a diferencia de
// toggle-activo-cliente.tsx (que sí usa variant="destructive").
export function ConfirmarDuplicadoDialog({
  open,
  mensaje,
  pendiente,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  mensaje: string;
  pendiente: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircleIcon className="h-4.5 w-4.5 text-accent-hover" />
            Ya existe algo parecido
          </DialogTitle>
          <DialogDescription>{mensaje}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={pendiente}>
            <XIcon className="h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={pendiente}>
            <CheckIcon className="h-4 w-4" />
            Crear de todas formas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
