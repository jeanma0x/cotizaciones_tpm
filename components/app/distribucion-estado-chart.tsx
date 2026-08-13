"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const COLORES_ESTADO: Record<string, string> = {
  BORRADOR: "var(--color-text-secondary)",
  ENVIADA: "var(--color-status-enviada)",
  EN_NEGOCIACION: "var(--color-accent-hover)",
  ACEPTADA: "var(--color-success)",
  RECHAZADA: "var(--color-danger)",
  VENCIDA: "var(--color-status-vencida)",
  FACTURADA: "var(--color-brand)",
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
