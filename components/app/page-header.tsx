import { Cog } from "lucide-react";

// Ancla de marca repetida en el header de cada pantalla principal — un
// engranaje muy sutil de fondo, mismo tratamiento en las 7 pantallas, para
// que el shell completo se lea como "Servicios Generales TPM" y no como un
// dashboard genérico sin firma visual. Ver conversación: "todas las
// pantallas comparten el mismo shell sin ningún momento de identidad fuerte".
export function PageHeader({
  title,
  actions,
}: {
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center justify-between overflow-hidden rounded-lg border border-border bg-card px-6 py-5">
      <Cog
        className="pointer-events-none absolute -top-6 -right-6 h-28 w-28 text-brand/[0.06]"
        aria-hidden="true"
      />
      <h1 className="relative text-xl font-semibold text-text-primary">{title}</h1>
      {actions && <div className="relative flex items-center gap-2">{actions}</div>}
    </div>
  );
}
