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
  WalletIcon,
  XIcon,
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
  { href: "/costos", label: "Costos", icon: WalletIcon },
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
  // Aparte de "colapsado" (angosto/ancho, solo aplica de md para arriba): en
  // mobile el sidebar entero se oculta fuera de pantalla y se desliza como
  // panel superpuesto — antes se quedaba fijo a su ancho completo (240px) en
  // CUALQUIER tamaño de pantalla, aplastando el contenido en una franja
  // angosta en un teléfono real. Ver punto 7, ronda de cierre de huecos.
  const [mobileAbierto, setMobileAbierto] = useState(false);
  // El colapso angosto (solo íconos) es una preferencia de escritorio — en
  // mobile el panel siempre se abre a ancho completo, sin importar si quedó
  // colapsado la última vez en una pantalla grande.
  const [esMobile, setEsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setEsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setEsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  useEffect(() => {
    const guardado = window.localStorage.getItem(LOCALSTORAGE_KEY);
    if (guardado === "true") setColapsado(true);
    setMontado(true);
  }, []);
  useEffect(() => {
    setMobileAbierto(false);
  }, [pathname]);
  // El botón que abre el panel vive en MobileTopBar, fuera de este
  // componente (acá adentro no puede estar visible: el <aside> completo
  // arranca oculto fuera de pantalla en mobile). Mismo patrón que ya usa el
  // buscador con "abrir-command-palette".
  useEffect(() => {
    function onAbrir() {
      setMobileAbierto(true);
    }
    window.addEventListener("abrir-sidebar-movil", onAbrir);
    return () => window.removeEventListener("abrir-sidebar-movil", onAbrir);
  }, []);
  const colapsadoEfectivo = colapsado && !esMobile;

  function alternarColapso() {
    setColapsado((actual) => {
      const nuevo = !actual;
      window.localStorage.setItem(LOCALSTORAGE_KEY, String(nuevo));
      return nuevo;
    });
  }

  return (
    <>
      {mobileAbierto && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-hidden="true"
          onClick={() => setMobileAbierto(false)}
        />
      )}

      <motion.aside
        animate={{ width: colapsadoEfectivo ? ANCHO_COLAPSADO : ANCHO_EXPANDIDO }}
        initial={false}
        transition={montado ? { duration: 0.2, ease: [0.2, 0, 0, 1] } : { duration: 0 }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-transform duration-200 md:static md:z-auto md:translate-x-0",
          mobileAbierto ? "translate-x-0" : "-translate-x-full",
        )}
      >
      <div className="flex items-center gap-2 px-5 py-6">
        <Cog className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        {!colapsadoEfectivo && (
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-mono text-lg font-extrabold tracking-wide text-sidebar-foreground">
              TPM
            </span>
            <span className="truncate text-xs uppercase tracking-widest text-sidebar-foreground/70">
              Servicios Generales
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Cerrar menú"
          onClick={() => setMobileAbierto(false)}
          className="ml-auto shrink-0 text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground md:hidden"
        >
          <XIcon className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-3">
        {colapsadoEfectivo ? (
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
              aria-label={colapsadoEfectivo ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors duration-(--motion-fast)",
                colapsadoEfectivo && "justify-center px-0",
                activo
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!colapsadoEfectivo && <span className="truncate">{label}</span>}
            </Link>
          );

          if (!colapsadoEfectivo) return <div key={href}>{link}</div>;

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
          colapsadoEfectivo && "flex-col justify-center px-0",
        )}
      >
        <UserButton />
        <SelectorTema colapsado={colapsadoEfectivo} />
      </div>

      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={alternarColapso}
              aria-label={colapsado ? "Expandir menú" : "Colapsar menú"}
              className="hidden items-center justify-center gap-2 border-t border-sidebar-border py-3 text-sidebar-foreground/60 transition-colors duration-(--motion-fast) hover:bg-white/10 hover:text-sidebar-foreground md:flex"
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
    </>
  );
}
