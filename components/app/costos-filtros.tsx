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
import { CATEGORIA_COSTO_LABELS } from "@/lib/validations/costo";

const CATEGORIAS_ITEMS = {
  TODAS: "Todas las categorías",
  ...CATEGORIA_COSTO_LABELS,
};

// Fase 3.2: el filtro de empresa que vivía acá se reemplazó por el selector
// de empresa global (ver components/app/selector-empresa-global.tsx).
export function CostosFiltros() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "TODOS" || value === "TODAS") params.delete(key);
    else params.set(key, value);
    startTransition(() => {
      router.push(`/costos?${params.toString()}`);
    });
  }

  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        items={CATEGORIAS_ITEMS}
        value={searchParams.get("categoria") ?? "TODAS"}
        onValueChange={(v) => setParam("categoria", v as string)}
      >
        <SelectTrigger className="w-44">
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

      <input
        type="date"
        aria-label="Desde"
        value={desde}
        max={hasta || undefined}
        onChange={(e) => setParam("desde", e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <span className="text-sm text-muted-foreground">a</span>
      <input
        type="date"
        aria-label="Hasta"
        value={hasta}
        min={desde || undefined}
        onChange={(e) => setParam("hasta", e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  );
}
