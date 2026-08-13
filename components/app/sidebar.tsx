"use client";

import { UserButton } from "@clerk/nextjs";
import {
  Building2,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ClipboardList,
  Cog,
  FilePlus,
  LayoutGrid,
  MoonIcon,
  SearchIcon,
  ShieldCheck,
  SunIcon,
  Truck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Panel", icon: LayoutGrid },
  { href: "/documentos/nuevo", label: "Nuevo documento", icon: FilePlus },
  { href: "/documentos", label: "Documentos", icon: ClipboardList },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/servicios", label: "Servicios", icon: Truck },
];

const NAV_ITEMS_SUPERUSUARIO: NavItem[] = [
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/usuarios", label: "Usuarios", icon: ShieldCheck },
];

const LOCALSTORAGE_KEY = "sidebar-colapsado";
const ANCHO_EXPANDIDO = 240;
const ANCHO_COLAPSADO = 64;

function SelectorTema({ colapsado }: { colapsado: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  if (!montado) return <div className="h-7 w-7 shrink-0" aria-hidden="true" />;

  const esOscuro = resolvedTheme === "dark";
  const etiqueta = esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={etiqueta}
            onClick={() => setTheme(esOscuro ? "light" : "dark")}
            className="shrink-0 text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground"
          >
            {esOscuro ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          </Button>
        }
      />
      <TooltipContent side={colapsado ? "right" : "top"}>{etiqueta}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar({ esSuperusuario }: { esSuperusuario: boolean }) {
  const pathname = usePathname();
  const items = esSuperusuario ? [...NAV_ITEMS, ...NAV_ITEMS_SUPERUSUARIO] : NAV_ITEMS;

  const [colapsado, setColapsado] = useState(false);
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const guardado = window.localStorage.getItem(LOCALSTORAGE_KEY);
    if (guardado === "true") setColapsado(true);
    setMontado(true);
  }, []);

  function alternarColapso() {
    setColapsado((actual) => {
      const nuevo = !actual;
      window.localStorage.setItem(LOCALSTORAGE_KEY, String(nuevo));
      return nuevo;
    });
  }

  return (
    <motion.aside
      animate={{ width: colapsado ? ANCHO_COLAPSADO : ANCHO_EXPANDIDO }}
      initial={false}
      transition={montado ? { duration: 0.2, ease: [0.2, 0, 0, 1] } : { duration: 0 }}
      className="flex h-full shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar"
    >
      <div className="flex items-center gap-2 px-5 py-6">
        <Cog className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        {!colapsado && (
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-mono text-lg font-extrabold tracking-wide text-sidebar-foreground">
              TPM
            </span>
            <span className="truncate text-xs uppercase tracking-widest text-sidebar-foreground/70">
              Servicios Generales
            </span>
          </div>
        )}
      </div>

      <div className="px-3">
        {colapsado ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event("abrir-command-palette"))}
                  aria-label="Buscar"
                  className="flex w-full items-center justify-center rounded border border-sidebar-border bg-white/5 py-1.5 text-sidebar-foreground/70 transition-colors duration-(--motion-fast) hover:bg-white/10 hover:text-sidebar-foreground"
                >
                  <SearchIcon className="h-4 w-4" />
                </button>
              }
            />
            <TooltipContent side="right">Buscar</TooltipContent>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("abrir-command-palette"))}
            className="flex w-full items-center justify-between gap-2 rounded border border-sidebar-border bg-white/5 px-3 py-1.5 text-sm text-sidebar-foreground/70 transition-colors duration-(--motion-fast) hover:bg-white/10 hover:text-sidebar-foreground"
          >
            <span className="flex items-center gap-2">
              <SearchIcon className="h-4 w-4" />
              Buscar
            </span>
            <kbd className="rounded border border-sidebar-border bg-black/20 px-1.5 py-0.5 font-mono text-xs text-sidebar-foreground/70">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-1 overflow-y-auto px-3 pt-3">
        {items.map(({ href, label, icon: Icon }) => {
          const activo =
            href === "/documentos"
              ? pathname === "/documentos" ||
                (pathname.startsWith("/documentos/") &&
                  !pathname.startsWith("/documentos/nuevo"))
              : pathname === href || pathname.startsWith(`${href}/`);

          const link = (
            <Link
              href={href}
              aria-label={colapsado ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors duration-(--motion-fast)",
                colapsado && "justify-center px-0",
                activo
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!colapsado && <span className="truncate">{label}</span>}
            </Link>
          );

          if (!colapsado) return <div key={href}>{link}</div>;

          return (
            <Tooltip key={href}>
              <TooltipTrigger render={link} />
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div
        className={cn(
          "mt-auto flex items-center gap-2 border-t border-sidebar-border px-5 py-4",
          colapsado && "flex-col justify-center px-0",
        )}
      >
        <UserButton />
        <SelectorTema colapsado={colapsado} />
      </div>

      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={alternarColapso}
              aria-label={colapsado ? "Expandir menú" : "Colapsar menú"}
              className="flex items-center justify-center gap-2 border-t border-sidebar-border py-3 text-sidebar-foreground/60 transition-colors duration-(--motion-fast) hover:bg-white/10 hover:text-sidebar-foreground"
            >
              {colapsado ? (
                <ChevronsRightIcon className="h-4 w-4" />
              ) : (
                <ChevronsLeftIcon className="h-4 w-4" />
              )}
            </button>
          }
        />
        <TooltipContent side="right">
          {colapsado ? "Expandir menú" : "Colapsar menú"}
        </TooltipContent>
      </Tooltip>
    </motion.aside>
  );
}
