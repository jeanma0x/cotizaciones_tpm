"use client";

import type { YAxisTickContentProps } from "recharts";

// Recharts (v3) no trunca texto de categoría por su cuenta — con un nombre
// real largo (empresa, cliente/proyecto, categoría "Otro: <detalle>") el
// tick por defecto se sale del ancho asignado y se superpone con las filas
// vecinas del BarChart horizontal (ilegible). El nombre completo sigue
// disponible al pasar el mouse, vía ChartTooltip — truncar acá no pierde
// información, solo la saca del eje.
//
// OJO: el tick debe pasarse como referencia de componente
// (`tick={TickTruncado}`), no como elemento (`tick={<TickTruncado />}`) —
// en recharts v3 solo la primera forma recibe x/y/payload reales; la
// segunda los deja en 0 silenciosamente (visto en producción, ver commit
// que agregó este archivo).
export function crearTickTruncado(largoMaximo: number) {
  return function TickTruncado({ x, y, payload }: YAxisTickContentProps) {
    const texto = String(payload.value);
    const truncado =
      texto.length > largoMaximo ? `${texto.slice(0, largoMaximo - 1)}…` : texto;
    return (
      <text x={x} y={y} dy={4} textAnchor="end" fontSize={11} fill="var(--color-text-secondary)">
        {truncado}
      </text>
    );
  };
}
