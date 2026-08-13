"use client";

import { animate } from "motion/react";
import { useEffect, useRef } from "react";

export function AnimatedNumber({
  value,
  formato,
}: {
  value: number;
  formato?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    const controles = animate(0, value, {
      duration: 0.6,
      ease: [0.2, 0, 0, 1],
      onUpdate(latest) {
        nodo.textContent = formato ? formato(latest) : Math.round(latest).toString();
      },
    });
    return () => controles.stop();
  }, [value, formato]);

  return <span ref={ref}>{formato ? formato(0) : "0"}</span>;
}
