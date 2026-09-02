"use client";

import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatearMonto } from "@/lib/formato-numero";

// Pedido explícito de Oldemar (02/09/26): un ícono de referencia visual en
// el panel para ver cómo se está aplicando el tema de impuestos — antes solo
// vivía como una línea de texto bajo las tarjetas (fácil de pasar por alto).
// Un diálogo, no un tooltip, a propósito: tiene que quedar como algo al que
// se pueda volver después, y un tooltip no funciona bien en mobile (sin
// hover). Los montos que recibe son los YA CALCULADOS de este mes/vista —
// nunca reinventa la fórmula acá, solo la explica.
export function UtilidadNetaInfoDialog({
  isrEntradas,
  ivaEntradas,
}: {
  isrEntradas: [string, number][];
  ivaEntradas: [string, number][];
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Cómo se calcula Utilidad neta"
            className="-my-1 shrink-0 text-muted-foreground hover:text-text-primary"
          >
            <InfoIcon className="h-3 w-3" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cómo se calcula Utilidad neta</DialogTitle>
          <DialogDescription>
            Facturado del mes − Costos del mes − ISR estimado − IVA estimado.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm">
          <div>
            <p className="font-medium text-text-primary">
              ISR (régimen opcional simplificado)
            </p>
            <p className="text-muted-foreground">
              5% sobre los primeros Q30,000 de facturado mensual por empresa, 7%
              sobre el excedente. Solo empresas de Guatemala.
            </p>
            {isrEntradas.length > 0 && (
              <p className="mt-1 font-mono text-xs text-text-primary">
                Este mes: {isrEntradas.map(([m, v]) => `${m} ${formatearMonto(v)}`).join(" · ")}
              </p>
            )}
          </div>
          <div>
            <p className="font-medium text-text-primary">IVA (12%, escenario pesimista)</p>
            <p className="text-muted-foreground">
              Se descuenta como un costo fijo del 12% sobre el facturado, aunque en
              la realidad exista crédito fiscal (el IVA pagado en compras se
              acredita contra el IVA cobrado) — este sistema no lo rastrea, así que
              se asume el escenario más conservador a propósito. Cualquier crédito
              fiscal real termina siendo ganancia adicional, nunca una utilidad que
              resultó ser menor a la esperada. Solo empresas de Guatemala.
            </p>
            {ivaEntradas.length > 0 && (
              <p className="mt-1 font-mono text-xs text-text-primary">
                Este mes: {ivaEntradas.map(([m, v]) => `${m} ${formatearMonto(v)}`).join(" · ")}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
