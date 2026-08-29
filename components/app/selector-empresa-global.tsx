"use client";

import { Building2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { establecerEmpresaActiva } from "@/app/(app)/actions";
import { cn } from "@/lib/utils";

const TODAS = "__TODAS__";

// Fase 3.2 — reemplaza cualquier selector de empresa local (Documentos,
// Clientes, y el que vivía suelto en "Nuevo documento"): un solo lugar que
// filtra Panel/Documentos/Clientes/Servicios/Costos/Activos a la vez. Nunca
// se oculta condicionado por rol — un MIEMBRO con una sola empresa permitida
// simplemente no ve el selector (no hay nada entre qué elegir), igual que ya
// hacían los filtros locales que reemplaza.
export function SelectorEmpresaGlobal({
  empresas,
  empresaActivaId,
  colapsado,
}: {
  empresas: { id: string; nombre: string }[];
  empresaActivaId: string | null;
  colapsado?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (empresas.length <= 1) return null;

  const items = {
    [TODAS]: "Todas las empresas",
    ...Object.fromEntries(empresas.map((e) => [e.id, e.nombre])),
  };

  function onChange(valor: string) {
    const nuevaEmpresaId = valor === TODAS ? null : valor;
    startTransition(async () => {
      await establecerEmpresaActiva(nuevaEmpresaId);
      router.refresh();
    });
  }

  return (
    <Select
      items={items}
      value={empresaActivaId ?? TODAS}
      onValueChange={(v) => onChange(v as string)}
      disabled={isPending}
    >
      <SelectTrigger
        aria-label="Empresa activa"
        className={cn(
          "w-full text-sidebar-foreground",
          colapsado && "w-8 justify-center border-none bg-transparent p-0",
        )}
      >
        {colapsado ? <Building2Icon className="h-4 w-4" /> : <SelectValue />}
      </SelectTrigger>
      <SelectContent>
        {Object.entries(items).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
