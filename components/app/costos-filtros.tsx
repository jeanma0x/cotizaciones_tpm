"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { RangoFechaInput } from "@/components/app/rango-fecha-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIA_COSTO_LABELS } from "@/lib/validations/costo";

// Prefijo interno para distinguir, dentro del mismo <Select>, un valor de
// "otroDetalle" específico (ej. "Otro: Seguros") de una categoría fija —
// nunca llega a la URL tal cual, setParam lo traduce al par de searchParams
// real (categoria=OTRO + otroDetalle=Seguros).
const PREFIJO_OTRO_DETALLE = "OTRO_DETALLE:";

// Fase 3.2: el filtro de empresa que vivía acá se reemplazó por el selector
// de empresa global (ver components/app/selector-empresa-global.tsx).
export function CostosFiltros({ otrosDetalles = [] }: { otrosDetalles?: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setParams(nuevos: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(nuevos)) {
      if (!value || value === "TODOS" || value === "TODAS") params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => {
      router.push(`/costos?${params.toString()}`);
    });
  }

  function onCategoriaChange(valor: string) {
    if (valor.startsWith(PREFIJO_OTRO_DETALLE)) {
      setParams({ categoria: "", otroDetalle: valor.slice(PREFIJO_OTRO_DETALLE.length) });
    } else {
      setParams({ categoria: valor, otroDetalle: "" });
    }
  }

  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";
  const otroDetalleActivo = searchParams.get("otroDetalle") ?? "";

  // Pedido de Oldemar: "Otro" debe poder registrarse y filtrarse después
  // como si fuera una categoría más, sin ampliar el enum fijo cada vez que
  // aparece un gasto que no encaja en las categorías existentes.
  const CATEGORIAS_ITEMS = {
    TODAS: "Todas las categorías",
    ...CATEGORIA_COSTO_LABELS,
    ...Object.fromEntries(
      otrosDetalles.map((d) => [`${PREFIJO_OTRO_DETALLE}${d}`, `Otro: ${d}`]),
    ),
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        items={CATEGORIAS_ITEMS}
        value={otroDetalleActivo ? `${PREFIJO_OTRO_DETALLE}${otroDetalleActivo}` : searchParams.get("categoria") ?? "TODAS"}
        onValueChange={(v) => onCategoriaChange(v as string)}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(CATEGORIAS_ITEMS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <RangoFechaInput
        idPrefix="costos-filtros"
        desde={desde}
        hasta={hasta}
        onDesdeChange={(v) => setParams({ desde: v })}
        onHastaChange={(v) => setParams({ hasta: v })}
      />
    </div>
  );
}
