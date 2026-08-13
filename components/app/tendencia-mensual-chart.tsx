"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Zona 2 del panel (scope.md): monto cotizado vs. facturado por mes, últimos
// 12 meses — nunca los colores default de Recharts, solo variaciones de
// --color-brand + --color-accent (ver design-system.md "Panel — layout y
// estilo de gráficos").
const config = {
  cotizado: { label: "Cotizado", color: "var(--navy-500)" },
  facturado: { label: "Facturado", color: "var(--color-accent)" },
} satisfies ChartConfig;

export function TendenciaMensualChart({
  data,
}: {
  data: { mes: string; cotizado: number; facturado: number }[];
}) {
  if (data.every((d) => d.cotizado === 0 && d.facturado === 0)) {
    return (
      <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Todavía no hay suficiente historial para graficar una tendencia.
      </p>
    );
  }

  return (
    <ChartContainer config={config} className="h-56 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="mes"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
          width={40}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="cotizado" fill="var(--navy-500)" radius={2} isAnimationActive animationDuration={400} />
        <Bar dataKey="facturado" fill="var(--color-accent)" radius={2} isAnimationActive animationDuration={400} />
      </BarChart>
    </ChartContainer>
  );
}
