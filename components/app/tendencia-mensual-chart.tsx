"use client";

import { TrendingUpIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EstadoVacioGrafico } from "@/components/app/estado-vacio-grafico";

// Zona 2 del panel (scope.md): monto cotizado vs. facturado por mes, últimos
// 12 meses — nunca los colores default de Recharts, solo variaciones de
// --color-brand + --color-accent (ver design-system.md "Panel — layout y
// estilo de gráficos").
const config = {
  cotizado: { label: "Cotizado", color: "var(--navy-500)" },
  facturado: { label: "Facturado", color: "var(--color-accent)" },
} satisfies ChartConfig;

function formatearEje(valor: number) {
  if (valor === 0) return "0";
  if (Math.abs(valor) >= 1000) return `${(valor / 1000).toFixed(valor % 1000 === 0 ? 0 : 1)}k`;
  return String(valor);
}

export function TendenciaMensualChart({
  data,
}: {
  data: { mes: string; cotizado: number; facturado: number }[];
}) {
  const mesesConDatos = data.filter((d) => d.cotizado > 0 || d.facturado > 0).length;

  if (mesesConDatos < 3) {
    return (
      <EstadoVacioGrafico
        className="h-56"
        icon={<TrendingUpIcon className="h-5 w-5" />}
        mensaje="Necesitás más historial para ver una tendencia — todavía hay menos de 3 meses con actividad registrada."
      />
    );
  }

  return (
    <ChartContainer config={config} className="h-56 w-full">
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
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
          tickFormatter={formatearEje}
          width={48}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="cotizado" fill="var(--navy-500)" radius={2} isAnimationActive animationDuration={400} />
        <Bar dataKey="facturado" fill="var(--color-accent)" radius={2} isAnimationActive animationDuration={400} />
      </BarChart>
    </ChartContainer>
  );
}
