"use client";

import { TruckIcon } from "lucide-react";
import { useId } from "react";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
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
  const idBase = useId();

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
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 32, top: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`${idBase}-accent`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.95} />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.65} />
          </linearGradient>
          <linearGradient id={`${idBase}-navy`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--navy-500)" stopOpacity={0.95} />
            <stop offset="100%" stopColor="var(--navy-500)" stopOpacity={0.65} />
          </linearGradient>
        </defs>
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
        <Bar
          dataKey="cantidad"
          radius={4}
          isAnimationActive
          animationDuration={400}
          activeBar={{ fillOpacity: 0.85 }}
        >
          <LabelList
            dataKey="cantidad"
            position="right"
            fill="var(--color-text-secondary)"
            fontSize={11}
          />
          {data.map((d, i) => (
            <Cell key={d.nombre} fill={`url(#${idBase}-${i === 0 ? "accent" : "navy"})`} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
