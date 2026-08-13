"use client";

import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export function BuscadorLista({
  basePath,
  placeholder,
}: {
  basePath: string;
  placeholder: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function onChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value) params.delete("q");
      else params.set("q", value);
      startTransition(() => {
        router.push(`${basePath}?${params.toString()}`);
      });
    }, 350);
  }

  return (
    <InputGroup className="w-64">
      <InputGroupAddon>
        <SearchIcon className="h-4 w-4" />
      </InputGroupAddon>
      <InputGroupInput
        placeholder={placeholder}
        value={q}
        onChange={(e) => onChange(e.target.value)}
      />
    </InputGroup>
  );
}
