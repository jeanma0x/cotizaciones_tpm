"use client";

import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIPOS = { TODOS: "Todos los tipos", COTIZACION: "Cotización", PROPUESTA: "Propuesta", FACTURA: "Factura" };
const ESTADOS = {
  TODOS: "Todos los estados",
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  EN_NEGOCIACION: "En negociación",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
  VENCIDA: "Vencida",
  FACTURADA: "Facturada",
};

// Fase 3.2: el filtro de empresa que vivía acá se reemplazó por el selector
// de empresa global (ver components/app/selector-empresa-global.tsx) —
// dejar dos selectores de empresa distintos en pantalla confundía cuál
// mandaba. Este componente ya no recibe `empresas`.
export function DocumentosFiltros() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "TODOS") params.delete(key);
    else params.set(key, value);
    startTransition(() => {
      router.push(`/documentos?${params.toString()}`);
    });
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function onBuscarChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam("q", value), 350);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <InputGroup className="w-64">
        <InputGroupAddon>
          <SearchIcon className="h-4 w-4" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Buscar por cliente o correlativo…"
          value={q}
          onChange={(e) => onBuscarChange(e.target.value)}
        />
      </InputGroup>
      <Select
        items={TIPOS}
        value={searchParams.get("tipo") ?? "TODOS"}
        onValueChange={(v) => setParam("tipo", v as string)}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(TIPOS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={ESTADOS}
        value={searchParams.get("estado") ?? "TODOS"}
        onValueChange={(v) => setParam("estado", v as string)}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ESTADOS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
