"use client";

import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

// Fase 3.2: el filtro de empresa que vivía acá se reemplazó por el selector
// de empresa global (ver components/app/selector-empresa-global.tsx).
export function ClientesFiltros({ placeholder }: { placeholder: string }) {
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
      router.push(`/clientes?${params.toString()}`);
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
          placeholder={placeholder}
          value={q}
          onChange={(e) => onBuscarChange(e.target.value)}
        />
      </InputGroup>
    </div>
  );
}
