"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// Estado vacío compartido por los gráficos del panel (tendencia, desgloses,
// ranking de servicios) — mismo criterio visual que StatCard (ícono en
// círculo con tinte) en vez de un <p> de texto plano flotando en el centro
// de la tarjeta, que se leía como un placeholder sin terminar. Entrada sutil
// (fade + scale chico del círculo) en vez de aparecer de golpe — mismo tono
// que CardEntrance (150ms), nunca algo vistoso.
export function EstadoVacioGrafico({
  icon,
  mensaje,
  className,
}: {
  icon: React.ReactNode;
  mensaje: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 text-center",
        className,
      )}
    >
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        {icon}
      </motion.span>
      <p className="max-w-64 text-sm text-muted-foreground">{mensaje}</p>
    </div>
  );
}
