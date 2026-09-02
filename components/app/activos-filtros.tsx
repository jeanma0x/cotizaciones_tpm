"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIPO_ACTIVO_LABELS } from "@/lib/validations/activo";

// Mismo patrón que components/app/costos-filtros.tsx (Tanda 3 / feedback de
// Oldemar): un valor de "otroDetalle" específico (ej. "Otro: Maquinaria de
// soldar") nunca llega a la URL tal cual, setParam lo traduce al par de
// searchParams real (tipo=OTRO + tipoOtroDetalle=Maquinaria de soldar).
const PREFIJO_OTRO_DETALLE = "OTRO_DETALLE:";

export function ActivosFiltros({ otrosDetalles = [] }: { otrosDetalles?: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setParams(nuevos: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(nuevos)) {
      if (!value || value === "TODOS") params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => {
      router.push(`/activos?${params.toString()}`);
    });
  }

  function onTipoChange(valor: string) {
    if (valor.startsWith(PREFIJO_OTRO_DETALLE)) {
      setParams({ tipo: "", tipoOtroDetalle: valor.slice(PREFIJO_OTRO_DETALLE.length) });
    } else {
      setParams({ tipo: valor, tipoOtroDetalle: "" });
    }
  }

  const tipoOtroDetalleActivo = searchParams.get("tipoOtroDetalle") ?? "";

  // Pedido de Oldemar: "Otro" debe poder registrarse y filtrarse después como
  // si fuera un tipo más, sin ampliar el enum fijo cada vez que aparece un
  // activo que no encaja en los tipos existentes.
  const TIPOS_ITEMS = {
    TODOS: "Todos los tipos",
    ...TIPO_ACTIVO_LABELS,
    ...Object.fromEntries(
      otrosDetalles.map((d) => [`${PREFIJO_OTRO_DETALLE}${d}`, `Otro: ${d}`]),
    ),
  };

  return (
    <Select
      items={TIPOS_ITEMS}
      value={
        tipoOtroDetalleActivo
          ? `${PREFIJO_OTRO_DETALLE}${tipoOtroDetalleActivo}`
          : searchParams.get("tipo") ?? "TODOS"
      }
      onValueChange={(v) => onTipoChange(v as string)}
    >
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(TIPOS_ITEMS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
