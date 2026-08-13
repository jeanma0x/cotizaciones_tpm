"use client";

import { animate } from "motion/react";
import { useEffect, useRef } from "react";

// `formato` no puede ser una función: este componente se usa desde Server
// Components (dashboard/page.tsx), y una función no es serializable cruzando
// el límite RSC ("Functions cannot be passed directly to Client Components").
// Por eso el formato se arma con props primitivas (decimales/sufijo/prefijo).
export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  function formatear(n: number) {
    return `${prefix}${n.toFixed(decimals)}${suffix}`;
  }

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    const controles = animate(0, value, {
      duration: 0.6,
      ease: [0.2, 0, 0, 1],
      onUpdate(latest) {
        nodo.textContent = formatear(latest);
      },
    });
    return () => controles.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, prefix, suffix]);

  return <span ref={ref}>{formatear(0)}</span>;
}
