"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { RangoFechaInput } from "@/components/app/rango-fecha-input";

// Wrapper delgado sobre RangoFechaInput: persiste desde/hasta en la URL
// (searchParams), mismo patrón que CostosFiltros/BuscadorLista — para que
// el rango elegido sobreviva a recargar la página o compartir el link.
export function ReporteFiltroRango({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  }

  return (
    <RangoFechaInput
      idPrefix="reporte-rango"
      desde={searchParams.get("desde") ?? ""}
      hasta={searchParams.get("hasta") ?? ""}
      onDesdeChange={(v) => setParam("desde", v)}
      onHastaChange={(v) => setParam("hasta", v)}
    />
  );
}
