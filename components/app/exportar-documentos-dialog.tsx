"use client";

import { DownloadIcon } from "lucide-react";
import { useState } from "react";
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
import { Label } from "@/components/ui/label";

function primerDiaDelMes() {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ExportarDocumentosDialog() {
  const [open, setOpen] = useState(false);
  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(hoyISO());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <DownloadIcon className="h-4 w-4" />
            Exportar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Exportar documentos</DialogTitle>
          <DialogDescription>
            Descarga un CSV con correlativo, tipo, empresa, cliente, total y estado de
            todos los documentos del rango elegido.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="exportar-desde">Desde</Label>
            <input
              id="exportar-desde"
              type="date"
              value={desde}
              max={hasta}
              onChange={(e) => setDesde(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="exportar-hasta">Hasta</Label>
            <input
              id="exportar-hasta"
              type="date"
              value={hasta}
              min={desde}
              onChange={(e) => setHasta(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            nativeButton={false}
            render={
              <a
                href={`/api/documentos/exportar?desde=${desde}&hasta=${hasta}`}
                onClick={() => setOpen(false)}
              />
            }
          >
            <DownloadIcon className="h-4 w-4" />
            Descargar CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
