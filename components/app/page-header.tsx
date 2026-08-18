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
    <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-border bg-card px-6 py-5 shadow-sm">
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
        <div className={cn("relative flex shrink-0 items-center gap-2")}>{actions}</div>
      )}
    </div>
  );
}
