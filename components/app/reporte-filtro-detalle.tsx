"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Interruptor "incluir detalle" pedido en
// docs/fase3-clientes-proyectos-costos-activos.md ("Módulo de Reportes"):
// por defecto el reporte solo muestra totales agregados; con esto activado
// se agrega el listado de documentos/costos individuales que componen esos
// totales, para que el contador pueda auditar de dónde sale cada cifra.
export function ReporteFiltroDetalle({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const activo = searchParams.get("detalle") === "1";

  function alternar(valor: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) params.set("detalle", "1");
    else params.delete("detalle");
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Checkbox id="reporte-detalle" checked={activo} onCheckedChange={(v) => alternar(v === true)} />
      <Label htmlFor="reporte-detalle" className="cursor-pointer text-sm font-normal">
        Incluir detalle (documentos y costos individuales)
      </Label>
    </div>
  );
}
