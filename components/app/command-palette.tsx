"use client";

import {
  ClipboardList,
  FilePlus,
  LayoutGrid,
  Truck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const ATAJOS = [
  { href: "/dashboard", label: "Panel", icon: LayoutGrid },
  { href: "/documentos/nuevo", label: "Nuevo documento", icon: FilePlus },
  { href: "/documentos", label: "Documentos", icon: ClipboardList },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/servicios", label: "Servicios", icon: Truck },
];

// Búsqueda global rápida — Cmd+K / Ctrl+K. Ver design-system.md
// "Accesibilidad" (alcanzable por teclado desde cualquier pantalla).
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onAbrirDesdeSidebar() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("abrir-command-palette", onAbrirDesdeSidebar);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("abrir-command-palette", onAbrirDesdeSidebar);
    };
  }, []);

  function ir(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Buscar" description="Navegación rápida">
      <CommandInput placeholder="Ir a…" />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>
        <CommandGroup heading="Navegación">
          {ATAJOS.map(({ href, label, icon: Icon }) => (
            <CommandItem key={href} onSelect={() => ir(href)}>
              <Icon className="h-4 w-4" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
