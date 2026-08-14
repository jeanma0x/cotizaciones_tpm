"use client";

import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = { cantidad: { label: "Documentos" } } satisfies ChartConfig;
const TONOS = ["var(--navy-300)", "var(--navy-500)", "var(--navy-700)"];

export function DesgloseTipoChart({
  data,
}: {
  data: { label: string; cantidad: number }[];
}) {
  if (data.every((d) => d.cantidad === 0)) {
    return (
      <p className="flex h-24 items-center justify-center text-center text-sm text-muted-foreground">
        Todavía no hay documentos para graficar.
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.cantidad));

  return (
    <ChartContainer config={config} className="w-full" style={{ height: 132 }}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          axisLine={false}
          width={96}
          tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="label" />} />
        <Bar dataKey="cantidad" radius={4} isAnimationActive animationDuration={400}>
          {data.map((d, i) => (
            <Cell
              key={d.label}
              fill={d.cantidad === max && max > 0 ? "var(--color-accent)" : TONOS[i % TONOS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
