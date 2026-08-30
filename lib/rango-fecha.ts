// Rango de fechas por defecto para los reportes cuando el usuario todavía
// no eligió uno explícito en los filtros: el mes en curso (mismo criterio
// que ya usaba exportar-costos-dialog.tsx para su propio rango default).
export function rangoFechaPorDefecto(desdeStr?: string, hastaStr?: string) {
  const hoy = new Date();
  const desde = desdeStr
    ? new Date(`${desdeStr}T00:00:00.000Z`)
    : new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), 1));
  const hasta = hastaStr
    ? new Date(`${hastaStr}T23:59:59.999Z`)
    : new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999));
  return { desde, hasta };
}
