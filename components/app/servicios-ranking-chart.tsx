"use client";

import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = { cantidad: { label: "Veces cotizado" } } satisfies ChartConfig;

export function ServiciosRankingChart({
  data,
}: {
  data: { nombre: string; cantidad: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="flex h-24 items-center justify-center text-center text-sm text-muted-foreground">
        Todavía no hay suficiente actividad para armar un ranking.
      </p>
    );
  }

  return (
    <ChartContainer
      config={config}
      className="w-full"
      style={{ height: Math.max(data.length * 34, 96) }}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          dataKey="nombre"
          type="category"
          tickLine={false}
          axisLine={false}
          width={140}
          tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="nombre" />} />
        <Bar dataKey="cantidad" radius={4} isAnimationActive animationDuration={400}>
          {data.map((d, i) => (
            <Cell key={d.nombre} fill={i === 0 ? "var(--color-accent)" : "var(--navy-500)"} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
