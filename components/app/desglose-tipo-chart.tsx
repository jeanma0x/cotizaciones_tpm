"use client";

import { ClipboardListIcon } from "lucide-react";
import { useId } from "react";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EstadoVacioGrafico } from "@/components/app/estado-vacio-grafico";

const config = { cantidad: { label: "Documentos" } } satisfies ChartConfig;
const TONOS = ["var(--navy-300)", "var(--navy-500)", "var(--navy-700)"];

export function DesgloseTipoChart({
  data,
}: {
  data: { label: string; cantidad: number }[];
}) {
  const idBase = useId();

  if (data.every((d) => d.cantidad === 0)) {
    return (
      <EstadoVacioGrafico
        className="h-24"
        icon={<ClipboardListIcon className="h-5 w-5" />}
        mensaje="Todavía no hay documentos para graficar."
      />
    );
  }

  const max = Math.max(...data.map((d) => d.cantidad));
  const colores = [...TONOS, "var(--color-accent)"];

  return (
    <ChartContainer config={config} className="w-full" style={{ height: 132 }}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 28, top: 0, bottom: 0 }}>
        <defs>
          {colores.map((color, i) => (
            <linearGradient key={color} id={`${idBase}-${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={0.95} />
              <stop offset="100%" stopColor={color} stopOpacity={0.65} />
            </linearGradient>
          ))}
        </defs>
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
          {data.map((d, i) => {
            const esMax = d.cantidad === max && max > 0;
            const idxColor = esMax ? colores.length - 1 : i % TONOS.length;
            return <Cell key={d.label} fill={`url(#${idBase}-${idxColor})`} />;
          })}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
