"use client";

import { Building2Icon } from "lucide-react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EstadoVacioGrafico } from "@/components/app/estado-vacio-grafico";

// Barra horizontal por empresa (cantidad de documentos — currency-agnóstico,
// nunca mezclar montos de distintas monedas en el mismo eje). Igual criterio
// de color que el resto del panel: variaciones de navy + un acento ámbar
// para la empresa con más actividad (ver design-system.md "Panel — gráficos").
const config = { totalDocs: { label: "Documentos" } } satisfies ChartConfig;
const TONOS = ["var(--navy-300)", "var(--navy-500)", "var(--navy-700)", "var(--navy-900)"];

export function DesgloseEmpresaChart({
  data,
}: {
  data: { nombre: string; totalDocs: number }[];
}) {
  if (data.every((d) => d.totalDocs === 0)) {
    return (
      <EstadoVacioGrafico
        className="h-24"
        icon={<Building2Icon className="h-5 w-5" />}
        mensaje="Todavía no hay documentos para graficar."
      />
    );
  }

  const max = Math.max(...data.map((d) => d.totalDocs));

  return (
    <ChartContainer
      config={config}
      className="w-full"
      style={{ height: Math.max(data.length * 34, 96) }}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          dataKey="nombre"
          type="category"
          tickLine={false}
          axisLine={false}
          width={132}
          tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="nombre" />} />
        <Bar dataKey="totalDocs" radius={4} isAnimationActive animationDuration={400}>
          {data.map((d, i) => (
            <Cell
              key={d.nombre}
              fill={d.totalDocs === max && max > 0 ? "var(--color-accent)" : TONOS[i % TONOS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
