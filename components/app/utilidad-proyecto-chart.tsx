"use client";

import { UsersIcon } from "lucide-react";
import { useId } from "react";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EstadoVacioGrafico } from "@/components/app/estado-vacio-grafico";
import { formatearCompacto } from "@/lib/formato-numero";
import { crearTickTruncado } from "@/components/app/chart-tick-truncado";

const config = { facturado: { label: "Facturado" } } satisfies ChartConfig;
const TickNombre = crearTickTruncado(13);
const TONOS = ["var(--navy-300)", "var(--navy-500)", "var(--navy-700)", "var(--navy-900)"];

// Pedido de Oldemar: una gráfica por cliente/proyecto "similar a Costos por
// categoría" — mismo tratamiento visual (barras horizontales, degradé,
// LabelList con el monto visible sin hover). Grafica facturado (no
// utilidad): mezclar el estilo de barra positiva de CostosCategoriaChart
// con valores que pueden ser negativos (una utilidad en rojo) se vería
// roto — la utilidad exacta, con signo, se sigue viendo en la tabla de
// abajo (UtilidadProyectoTable), que no cambia.
export function UtilidadProyectoChart({
  data,
}: {
  data: { label: string; facturado: number }[];
}) {
  const idBase = useId();

  if (data.length === 0) {
    return (
      <EstadoVacioGrafico
        className="h-24"
        icon={<UsersIcon className="h-5 w-5" />}
        mensaje="Todavía no hay proyectos con actividad en este rango."
      />
    );
  }

  const max = Math.max(...data.map((d) => d.facturado));
  const colores = [...TONOS, "var(--color-accent)"];

  return (
    <ChartContainer
      config={config}
      className="w-full"
      style={{ height: Math.max(data.length * 34, 96) }}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
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
          tick={TickNombre}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="label" />} />
        <Bar
          dataKey="facturado"
          radius={4}
          isAnimationActive
          animationDuration={400}
          activeBar={{ fillOpacity: 0.85 }}
        >
          <LabelList
            dataKey="facturado"
            position="right"
            fill="var(--color-text-secondary)"
            fontSize={11}
            formatter={(value: unknown) => formatearCompacto(Number(value))}
          />
          {data.map((d, i) => {
            const esMax = d.facturado === max;
            const idxColor = esMax ? colores.length - 1 : i % TONOS.length;
            return <Cell key={d.label} fill={`url(#${idBase}-${idxColor})`} />;
          })}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
