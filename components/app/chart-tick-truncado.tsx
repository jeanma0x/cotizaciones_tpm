"use client";

import type { YAxisTickContentProps } from "recharts";

const FONT_TICK = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

let contextoMedicion: CanvasRenderingContext2D | null | undefined;

// Truncado por caracteres fijos ("cortar a N caracteres") era una
// suposición nunca medida en píxeles reales — con un nombre real largo
// (hallado en la auditoría móvil, 08/09/26: "QA_PLAYWRIGHT_Empresa..." en
// la gráfica "Desglose por empresa") el texto truncado igual se salía del
// ancho del eje, porque 19 caracteres no siempre miden lo mismo en píxeles
// (depende de qué letras son). Medir el ancho real con Canvas 2D
// (`measureText`) y recortar hasta que quepa es la única forma de
// garantizarlo para cualquier nombre, en cualquier ancho de pantalla.
function medirAncho(texto: string): number {
  if (typeof document === "undefined") return texto.length * 6.5; // SSR: nunca se usa en render real, solo por si acaso
  if (contextoMedicion === undefined) {
    contextoMedicion = document.createElement("canvas").getContext("2d");
  }
  if (!contextoMedicion) return texto.length * 6.5;
  contextoMedicion.font = FONT_TICK;
  return contextoMedicion.measureText(texto).width;
}

function truncarAAncho(texto: string, anchoDisponiblePx: number): string {
  if (medirAncho(texto) <= anchoDisponiblePx) return texto;
  let lo = 0;
  let hi = texto.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidato = `${texto.slice(0, mid)}…`;
    if (medirAncho(candidato) <= anchoDisponiblePx) lo = mid;
    else hi = mid - 1;
  }
  return lo > 0 ? `${texto.slice(0, lo)}…` : "…";
}

// Recharts (v3) no trunca texto de categoría por su cuenta — con un nombre
// real largo (empresa, cliente/proyecto, categoría "Otro: <detalle>") el
// tick por defecto se sale del ancho asignado y se superpone con las filas
// vecinas del BarChart horizontal (ilegible). El nombre completo sigue
// disponible al pasar el mouse, vía ChartTooltip — truncar acá no pierde
// información, solo la saca del eje.
//
// `anchoDisponiblePx` es el espacio real en píxeles para el texto (el
// `width` del YAxis, menos un margen chico de respiro) — no una cantidad
// de caracteres, para que el truncado sea correcto sin importar qué letras
// tenga el nombre ni en qué ancho de pantalla se vea.
//
// OJO: el tick debe pasarse como referencia de componente
// (`tick={TickTruncado}`), no como elemento (`tick={<TickTruncado />}`) —
// en recharts v3 solo la primera forma recibe x/y/payload reales; la
// segunda los deja en 0 silenciosamente (visto en producción, ver commit
// que agregó este archivo).
export function crearTickTruncado(anchoDisponiblePx: number) {
  return function TickTruncado({ x, y, payload }: YAxisTickContentProps) {
    const truncado = truncarAAncho(String(payload.value), anchoDisponiblePx);
    return (
      <text x={x} y={y} dy={4} textAnchor="end" fontSize={11} fill="var(--color-text-secondary)">
        {truncado}
      </text>
    );
  };
}
