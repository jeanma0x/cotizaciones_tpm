import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

// Antes era texto muted sin fondo (text-sm text-muted-foreground) — se leía
// casi invisible, sobre todo en la barra de impresión. Ahora es un chip real
// (borde + fondo + sombra) para que se note como un elemento de navegación,
// no como una nota al margen. Un solo componente compartido, no 4 copias
// del mismo className ligeramente distintas entre sí.
export function VolverLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-text-primary shadow-sm transition-colors duration-(--motion-fast) hover:border-accent hover:bg-accent/10 hover:text-accent-hover"
    >
      <ArrowLeftIcon className="h-3.5 w-3.5 transition-transform duration-(--motion-fast) group-hover:-translate-x-0.5" />
      {label}
    </Link>
  );
}
