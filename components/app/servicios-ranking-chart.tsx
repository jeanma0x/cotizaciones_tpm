"use client";

import { TruckIcon } from "lucide-react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EstadoVacioGrafico } from "@/components/app/estado-vacio-grafico";

const config = { cantidad: { label: "Veces cotizado" } } satisfies ChartConfig;

export function ServiciosRankingChart({
  data,
}: {
  data: { nombre: string; cantidad: number }[];
}) {
  if (data.length === 0) {
    return (
      <EstadoVacioGrafico
        className="h-24"
        icon={<TruckIcon className="h-5 w-5" />}
        mensaje="Todavía no hay suficiente actividad para armar un ranking."
      />
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
