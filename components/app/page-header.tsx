import { cn } from "@/lib/utils";

// Ancla de marca repetida en el header de cada pantalla principal — ícono
// en badge circular con tinte de color + engranaje muy sutil de fondo, para
// que el shell completo se lea como "Servicios Generales TPM" y no como un
// dashboard genérico. Todas las pantallas principales lo usan por
// construcción, no por recordar aplicar un patrón manualmente.
export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
}) {
  return (
    // flex-col en mobile: con `actions` presente, "justify-between" en una
    // sola fila angosta le quitaba todo el espacio al título (shrink-0 en
    // los botones, min-w-0 en el título) hasta dejarlo invisible — el
    // título de la pantalla desaparecía por completo en un teléfono real.
    // Hallado en la auditoría móvil, 08/09/26.
    <div className="relative flex flex-col items-start gap-4 overflow-hidden rounded-xl border border-border bg-card px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático de marca, no necesita optimización de next/image */}
      <img
        src="/marca/svg/icono-color.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 -right-6 h-28 w-28 opacity-[0.06]"
      />
      <div className="relative flex min-w-0 items-center gap-4">
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-hover">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-text-primary">{title}</h1>
          {description && (
            <p className="truncate text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className={cn("relative flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0")}>
          {actions}
        </div>
      )}
    </div>
  );
}
