"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Cliente = {
  id: string;
  nombre: string;
  proyectos: { id: string; nombre: string }[];
};

const TODOS = "TODOS";

// Fase 3.4 — filtros de la zona "Utilidad por proyecto" del panel. La
// empresa ya se filtra con el selector global (Fase 3.2); acá solo faltan
// cliente/proyecto/fecha, propios de esta zona.
export function UtilidadProyectoFiltros({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const clienteId = searchParams.get("upClienteId") ?? TODOS;
  const proyectoId = searchParams.get("upProyectoId") ?? TODOS;
  const desde = searchParams.get("upDesde") ?? "";
  const hasta = searchParams.get("upHasta") ?? "";

  const proyectosDelCliente = useMemo(
    () => clientes.find((c) => c.id === clienteId)?.proyectos ?? [],
    [clientes, clienteId],
  );

  function setParams(cambios: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(cambios)) {
      if (!value || value === TODOS) params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
  }

  const clientesItems = {
    [TODOS]: "Todos los clientes",
    ...Object.fromEntries(clientes.map((c) => [c.id, c.nombre])),
  };
  const proyectosItems = {
    [TODOS]: "Todos los proyectos",
    ...Object.fromEntries(proyectosDelCliente.map((p) => [p.id, p.nombre])),
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        items={clientesItems}
        value={clienteId}
        onValueChange={(v) =>
          // Cambiar de cliente invalida el proyecto elegido — mismo criterio
          // que ya se usa en CostoFormDialog/DocumentoForm.
          setParams({ upClienteId: v as string, upProyectoId: TODOS })
        }
      >
        <SelectTrigger className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(clientesItems).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={proyectosItems}
        value={proyectoId}
        onValueChange={(v) => setParams({ upProyectoId: v as string })}
        disabled={clienteId === TODOS}
      >
        <SelectTrigger className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(proyectosItems).map(([value, label]) => (
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
        onChange={(e) => setParams({ upDesde: e.target.value })}
        className="h-8 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <span className="text-sm text-muted-foreground">a</span>
      <input
        type="date"
        aria-label="Hasta"
        value={hasta}
        min={desde || undefined}
        onChange={(e) => setParams({ upHasta: e.target.value })}
        className="h-8 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  );
}
