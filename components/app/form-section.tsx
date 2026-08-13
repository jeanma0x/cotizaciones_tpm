import { cn } from "@/lib/utils";

// Componente real, no una clase CSS que a veces se aplica y a veces no
// (eso fue exactamente el problema en rondas anteriores: el borde estaba
// pero era tan sutil que no se leía como agrupación). Todo formulario nuevo
// usa esto por construcción — ícono + título son obligatorios, no opcionales.
export function FormSection({
  title,
  icon: Icon,
  actions,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h2>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
