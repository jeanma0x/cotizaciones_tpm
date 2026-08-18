"use client";

import { WalletIcon } from "lucide-react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EstadoVacioGrafico } from "@/components/app/estado-vacio-grafico";

const config = { monto: { label: "Monto" } } satisfies ChartConfig;
const TONOS = ["var(--navy-300)", "var(--navy-500)", "var(--navy-700)", "var(--navy-900)"];

export function CostosCategoriaChart({
  data,
}: {
  data: { label: string; monto: number }[];
}) {
  if (data.length === 0) {
    return (
      <EstadoVacioGrafico
        className="h-24"
        icon={<WalletIcon className="h-5 w-5" />}
        mensaje="Todavía no hay costos registrados este mes."
      />
    );
  }

  const max = Math.max(...data.map((d) => d.monto));

  return (
    <ChartContainer
      config={config}
      className="w-full"
      style={{ height: Math.max(data.length * 34, 96) }}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
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
        <Bar dataKey="monto" radius={4} isAnimationActive animationDuration={400}>
          {data.map((d, i) => (
            <Cell
              key={d.label}
              fill={d.monto === max ? "var(--color-accent)" : TONOS[i % TONOS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
