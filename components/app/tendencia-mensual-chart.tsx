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
import { formatearCompacto } from "@/lib/formato-numero";

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
  const mesesConDatos = data.filter((d) => d.cotizado > 0 || d.facturado > 0).length;

  // Sin actividad real todavía: acá sí tiene sentido el estado vacío (un
  // gráfico de 12 meses con barras en cero se ve roto, no informativo).
  // Distinto de "poca" actividad (1-2 meses) — ahí sí se muestra el gráfico
  // real, nunca se esconde un dato que sí existe (ver nota debajo).
  if (mesesConDatos === 0) {
    return (
      <EstadoVacioGrafico
        className="h-56"
        icon={<TrendingUpIcon className="h-5 w-5" />}
        mensaje="Todavía no hay actividad registrada para graficar."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ChartContainer config={config} className="h-56 w-full">
        <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-tendencia-cotizado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--navy-500)" stopOpacity={0.95} />
              <stop offset="100%" stopColor="var(--navy-500)" stopOpacity={0.65} />
            </linearGradient>
            <linearGradient id="grad-tendencia-facturado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.95} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.65} />
            </linearGradient>
          </defs>
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
            tickFormatter={formatearCompacto}
            width={48}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="cotizado"
            fill="url(#grad-tendencia-cotizado)"
            radius={2}
            isAnimationActive
            animationDuration={400}
            activeBar={{ fillOpacity: 0.85 }}
          />
          <Bar
            dataKey="facturado"
            fill="url(#grad-tendencia-facturado)"
            radius={2}
            isAnimationActive
            animationDuration={400}
            activeBar={{ fillOpacity: 0.85 }}
          />
        </BarChart>
      </ChartContainer>
      {/* Nunca ocultar meses reales que sí existan — antes, con menos de 3
          meses con actividad, el gráfico entero desaparecía detrás de un
          estado vacío genérico aunque sí hubiera 1 o 2 meses reales. Ahora
          siempre se ve lo real, con esta nota de contexto mientras el
          historial todavía es corto. */}
      {mesesConDatos < 3 && (
        <p className="text-xs text-muted-foreground">
          Vas a ver más tendencia acá conforme pasen los meses.
        </p>
      )}
    </div>
  );
}
