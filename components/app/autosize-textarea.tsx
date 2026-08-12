"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Crece con el contenido en vez de scrollear — pedido explícito del cliente
// para las celdas de descripción (ver docs/document-export.md).
export const AutosizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<typeof Textarea>
>(function AutosizeTextarea({ className, onInput, ...props }, forwardedRef) {
  const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

  const ajustarAltura = React.useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  React.useEffect(() => {
    ajustarAltura(internalRef.current);
  }, [ajustarAltura]);

  return (
    <Textarea
      ref={(el) => {
        internalRef.current = el;
        if (typeof forwardedRef === "function") forwardedRef(el);
        else if (forwardedRef) forwardedRef.current = el;
        ajustarAltura(el);
      }}
      onInput={(e) => {
        ajustarAltura(e.currentTarget);
        onInput?.(e);
      }}
      className={cn("resize-none overflow-hidden", className)}
      rows={1}
      {...props}
    />
  );
});
