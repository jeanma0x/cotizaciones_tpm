"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { ClienteCombobox } from "@/components/app/cliente-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ClienteConProyectos = {
  id: string;
  nombre: string;
  proyectos: { id: string; nombre: string }[];
};

// Filtro cliente + proyecto (cascada: el select de proyecto solo muestra los
// del cliente elegido) para el reporte "Por cliente/proyecto" — mismo
// patrón cliente→proyecto que ya usa documento-form.tsx, pero persistido en
// la URL (searchParams) en vez de react-hook-form.
export function ReporteFiltroCliente({
  basePath,
  clientes,
}: {
  basePath: string;
  clientes: ClienteConProyectos[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const clienteId = searchParams.get("clienteId") ?? "";
  const proyectoId = searchParams.get("proyectoId") ?? "";

  const proyectosDelCliente = useMemo(
    () => clientes.find((c) => c.id === clienteId)?.proyectos ?? [],
    [clientes, clienteId],
  );

  function setParams(nuevos: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(nuevos)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-56">
        <ClienteCombobox
          clientes={clientes}
          value={clienteId}
          onValueChange={(v) => setParams({ clienteId: v, proyectoId: "" })}
          placeholder="Todos los clientes"
        />
      </div>
      <Select
        items={{ "": "Todos los proyectos", ...Object.fromEntries(proyectosDelCliente.map((p) => [p.id, p.nombre])) }}
        value={proyectoId}
        onValueChange={(v) => setParams({ proyectoId: v as string })}
        disabled={!clienteId}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos los proyectos</SelectItem>
          {proyectosDelCliente.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
