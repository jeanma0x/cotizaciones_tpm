"use client";

import { Building2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
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
  onPendingChange,
}: {
  empresas: { id: string; nombre: string }[];
  empresaActivaId: string | null;
  colapsado?: boolean;
  // Hallazgo real de la Fase 3.3: establecerEmpresaActiva es una server
  // action asíncrona (cookie httpOnly + assertAccesoEmpresa) — si algo
  // navega antes de que termine, la página siguiente puede cargar con la
  // empresa activa todavía sin actualizar. Sidebar usa esto para bloquear la
  // navegación mientras isPending sea true, en vez de confiar en que nadie
  // haga clic demasiado rápido.
  onPendingChange?: (pending: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

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
      {/* Colapsado, el trigger es un botón de 32px (solo ícono) dentro de un
          sidebar de 64px — el comportamiento default (alignItemWithTrigger,
          centrado sobre el trigger) hace que el popup, con min-w-36 (144px),
          quede centrado sobre ese botón angosto y termine tapando la propia
          columna de íconos del sidebar. side="right" lo abre como flyout
          hacia el contenido, igual que ya hacen los Tooltip de los ítems del
          nav cuando el sidebar está colapsado. */}
      <SelectContent
        side={colapsado ? "right" : "bottom"}
        align={colapsado ? "start" : "center"}
        alignItemWithTrigger={!colapsado}
      >
        {Object.entries(items).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
