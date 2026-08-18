// Helper compartido por las bitácoras de auditoría (clientes, servicios,
// empresas, usuarios, costos) — arma un resumen legible de qué campos
// cambiaron entre dos versiones de un registro, en vez de que cada action
// escriba su propia comparación campo por campo.
// `antes` puede tener más campos que `despues` (ej. la fila completa de
// Prisma vs. el subconjunto normalizado que se va a guardar) — solo se
// comparan las claves presentes en `despues`.
export function diffCampos<T extends Record<string, unknown>>(
  antes: Record<string, unknown>,
  despues: T,
  etiquetas: Partial<Record<keyof T, string>>,
): string {
  const cambios: string[] = [];
  for (const key of Object.keys(despues) as (keyof T)[]) {
    const valorAntes = antes[key as string];
    const valorDespues = despues[key];
    const textoAntes = formatearValor(valorAntes);
    const textoDespues = formatearValor(valorDespues);
    if (textoAntes !== textoDespues) {
      const etiqueta = etiquetas[key] ?? String(key);
      cambios.push(`${etiqueta}: ${textoAntes} → ${textoDespues}`);
    }
  }
  return cambios.length > 0 ? cambios.join(" · ") : "Sin cambios detectados";
}

function formatearValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  return String(valor);
}
