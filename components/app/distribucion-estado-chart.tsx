"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Gráfico restringido a variaciones de navy + un solo acento ámbar para lo
// que requiere atención — nunca la paleta de colores semánticos completa
// (success/danger/status-*), que se reserva para badges de estado en texto,
// no para series de un gráfico. Ver design-system.md "Panel — gráficos".
const COLORES_ESTADO: Record<string, string> = {
  BORRADOR: "var(--navy-100)",
  ENVIADA: "var(--navy-300)",
  EN_NEGOCIACION: "var(--navy-500)",
  ACEPTADA: "var(--navy-700)",
  FACTURADA: "var(--navy-900)",
  RECHAZADA: "var(--color-accent-hover)",
  VENCIDA: "var(--color-accent)",
};

export function DistribucionEstadoChart({
  data,
}: {
  data: { estado: string; label: string; cantidad: number }[];
}) {
  const config: ChartConfig = Object.fromEntries(
    data.map((d) => [d.estado, { label: d.label, color: COLORES_ESTADO[d.estado] }]),
  );

  if (data.every((d) => d.cantidad === 0)) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Todavía no hay documentos para graficar.
      </p>
    );
  }

  return (
    <ChartContainer config={config} className="mx-auto aspect-square max-h-52">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="estado" hideLabel />} />
        <Pie data={data} dataKey="cantidad" nameKey="estado" innerRadius={50} strokeWidth={2}>
          {data.map((d) => (
            <Cell key={d.estado} fill={COLORES_ESTADO[d.estado] ?? "var(--color-text-secondary)"} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
