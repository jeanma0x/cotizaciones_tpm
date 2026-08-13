function iniciales(nombre: string) {
  // Ignora paréntesis/corchetes y demás puntuación — solo letras/números
  // cuentan como el inicio real de una palabra (ej. "[DEMO] Cliente" -> "DC").
  const partes = nombre
    .trim()
    .split(/\s+/)
    .map((p) => p.replace(/^[^\p{L}\p{N}]+/u, ""))
    .filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// Directorio, no grilla de datos — ver diagnóstico de pantalla Clientes.
export function AvatarIniciales({ nombre }: { nombre: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-surface">
      {iniciales(nombre)}
    </span>
  );
}
