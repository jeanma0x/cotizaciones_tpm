"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tono = "brand" | "accent" | "success" | "danger";

const TONOS: Record<Tono, { bg: string; fg: string; linea: string }> = {
  brand: { bg: "bg-brand/10", fg: "text-brand dark:text-brand-hover", linea: "var(--color-brand)" },
  accent: { bg: "bg-accent/15", fg: "text-accent-hover", linea: "var(--color-accent)" },
  success: { bg: "bg-success-bg", fg: "text-success", linea: "var(--color-success)" },
  danger: { bg: "bg-danger-bg", fg: "text-danger", linea: "var(--color-danger)" },
};

export function StatCard({
  label,
  labelExtra,
  value,
  icon,
  tono = "brand",
  sparkline,
  size = "default",
}: {
  label: string;
  // Nodo ya renderizado, junto al label (ej. un ícono "i" que abre un
  // diálogo con el detalle de cómo se calcula la cifra) — mismo criterio
  // que `icon`: nunca una referencia a componente cruzando el límite
  // Server/Client.
  labelExtra?: React.ReactNode;
  value: React.ReactNode;
  // Nodo ya renderizado (ej. <WalletIcon className="h-4.5 w-4.5" />), NUNCA
  // una referencia a componente — este componente es "use client" y se usa
  // desde Server Components (dashboard/page.tsx); pasar la referencia de la
  // función cruzando ese límite revienta con "Functions cannot be passed
  // directly to Client Components" (el mismo bug que ya pasó con
  // AnimatedNumber). El padre renderiza el ícono, acá solo se posiciona.
  icon?: React.ReactNode;
  tono?: Tono;
  sparkline?: number[];
  size?: "default" | "hero";
}) {
  const t = TONOS[tono];
  const esHero = size === "hero";

  return (
    <Card className={cn("h-full", esHero && "border-none")}>
      <CardContent className="flex h-full flex-col justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          {icon && (
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                t.bg,
                t.fg,
              )}
            >
              {icon}
            </span>
          )}
          <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
            {label}
            {labelExtra}
          </p>
        </div>

        <div className="flex items-end justify-between gap-3">
          <p className={cn("font-mono font-bold text-text-primary", esHero ? "text-3xl" : "text-2xl")}>
            {value}
          </p>
          {sparkline && sparkline.length > 1 && (
            <div className="h-8 w-20 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkline.map((v, i) => ({ i, v }))}>
                  <defs>
                    <linearGradient id={`spark-${tono}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={t.linea} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={t.linea} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={t.linea}
                    strokeWidth={1.5}
                    fill={`url(#spark-${tono})`}
                    isAnimationActive
                    animationDuration={400}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
