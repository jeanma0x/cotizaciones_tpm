"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { usePathname } from "next/navigation";

// View Transitions API nativa descartada para esto: requiere el canal
// canary de React (ViewTransition no existe en React 19 estable, que es lo
// que usa este proyecto) y Next.js App Router no trae soporte propio de
// transición de página en el canal estable — agregar eso significaría
// subir a React canary o sumar una librería no oficial solo para esto.
// Ver docs/design-system.md "Transiciones de página nativas": ante soporte
// parcial/experimental, usar motion (AnimatePresence + layout) como
// alternativa robusta, que es lo que hace este componente.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
