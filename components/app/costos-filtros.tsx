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

export function CostosFiltros({
  empresas,
}: {
  empresas: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  if (empresas.length <= 1) return null;

  function setEmpresa(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "TODOS") params.delete("empresaId");
    else params.set("empresaId", value);
    startTransition(() => {
      router.push(`/costos?${params.toString()}`);
    });
  }

  const empresasItems = {
    TODOS: "Todas las empresas",
    ...Object.fromEntries(empresas.map((e) => [e.id, e.nombre])),
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        items={empresasItems}
        value={searchParams.get("empresaId") ?? "TODOS"}
        onValueChange={(v) => setEmpresa(v as string)}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(empresasItems).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
