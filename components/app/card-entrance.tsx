"use client";

import { motion } from "motion/react";

// Wrapper compartido para la entrada sutil de las tarjetas de gráfica del
// panel — deliberadamente corto (150ms, 6px, delay de 30ms por índice):
// "movimiento funcional y discreto, nunca de landing page" (design-system.md)
// y esto se repite cada vez que se visita /panel, no solo la primera vez.
// Hereda gratis el respeto a "reducir movimiento" del sistema operativo
// porque PageTransition ya envuelve toda la app en un MotionConfig
// reducedMotion="user".
const TRANSICION_ENTRADA = { duration: 0.15, ease: [0.2, 0, 0, 1] as const };
const TRANSICION_HOVER = { duration: 0.12, ease: [0.2, 0, 0, 1] as const };

export function CardEntrance({
  index = 0,
  interactive = false,
  className,
  children,
}: {
  index?: number;
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...TRANSICION_ENTRADA, delay: index * 0.03 }}
      whileHover={interactive ? { y: -2, transition: TRANSICION_HOVER } : undefined}
    >
      {children}
    </motion.div>
  );
}
