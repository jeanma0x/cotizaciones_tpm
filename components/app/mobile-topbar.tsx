"use client";

import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Solo visible en mobile (md:hidden) — el sidebar completo arranca fuera de
// pantalla ahí, así que hace falta algo siempre visible para abrirlo. Vive
// fuera de <Sidebar> porque tiene que aparecer en el flujo normal (arriba
// del contenido), no dentro del panel que empieza oculto. Ver
// components/app/sidebar.tsx.
export function MobileTopBar() {
  return (
    <div className="flex items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Abrir menú"
        onClick={() => window.dispatchEvent(new Event("abrir-sidebar-movil"))}
        className="shrink-0 text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground"
      >
        <MenuIcon className="h-5 w-5" />
      </Button>
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático de marca, no necesita optimización de next/image */}
      <img
        src="/marca/svg/icono-fondo-oscuro.svg"
        alt=""
        aria-hidden="true"
        className="h-5 w-5 shrink-0"
      />
      <span className="truncate font-mono text-base font-extrabold tracking-wide text-sidebar-foreground">
        TPM
      </span>
    </div>
  );
}
