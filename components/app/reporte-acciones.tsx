"use client";

import { DownloadIcon, PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

// Botones compartidos del reporte: "Exportar Excel" (link directo a la
// ruta de exportar) e "Imprimir/PDF".
//
// El botón de imprimir NO usa window.print() directo sobre la página: el
// contenido del reporte vive dentro de <main>, que a su vez vive dentro de
// .app-shell (ver app/(app)/layout.tsx) — y la regla global @media print de
// app/globals.css oculta TODO .app-shell (necesario para que, al imprimir
// un Documento desde su modal, no se vea la app de fondo). Si el reporte
// imprimiera in-place, quedaría una página en blanco. En vez de tocar esa
// regla global (arriesgar el comportamiento ya probado de Documentos), se
// reusa el mismo mecanismo que ya funciona ahí: un Dialog que el navegador
// porta FUERA de .app-shell (documento-imprimir-dialog.tsx hace exactamente
// esto) — mismas clases print: para que el reporte ocupe la página
// completa en vez del ancho recortado del modal.
export function ReporteAcciones({
  exportarHref,
  contenidoImprimible,
}: {
  exportarHref: string;
  contenidoImprimible: React.ReactNode;
}) {
  return (
    <div className="no-imprimir flex items-center gap-2">
      <Button variant="outline" nativeButton={false} render={<a href={exportarHref} />}>
        <DownloadIcon className="h-4 w-4" />
        Exportar Excel
      </Button>
      <Dialog>
        <DialogTrigger
          render={
            <Button variant="outline">
              <PrinterIcon className="h-4 w-4" />
              Imprimir / PDF
            </Button>
          }
        />
        <DialogContent
          className="max-h-[92vh] w-full max-w-4xl sm:max-w-4xl overflow-hidden p-0
            print:static print:block print:h-auto print:max-h-none print:w-auto
            print:max-w-none print:translate-x-0 print:translate-y-0
            print:overflow-visible print:rounded-none print:shadow-none print:ring-0
            [&>[data-slot=dialog-close]]:z-20 [&>[data-slot=dialog-close]]:bg-surface
            [&>[data-slot=dialog-close]]:print:hidden"
        >
          <div className="max-h-[92vh] overflow-y-auto rounded-xl print:max-h-none print:overflow-visible print:rounded-none">
            {/* bg-[#EAE6DC]: color fijo a propósito, no un token — ver el
                comentario completo (Tanda 4 del audit crítico) en
                documento-imprimir-dialog.tsx. */}
            <div data-theme="light" className="fondo-imprimible bg-[#EAE6DC] text-foreground">
              <div className="no-imprimir flex justify-center pt-6">
                <Button size="sm" onClick={() => window.print()}>
                  <PrinterIcon className="h-4 w-4" />
                  Imprimir
                </Button>
              </div>
              {contenidoImprimible}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
