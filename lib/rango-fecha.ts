// Rango de fechas por defecto para los reportes cuando el usuario todavía
// no eligió uno explícito en los filtros: el mes en curso (mismo criterio
// que ya usaba exportar-costos-dialog.tsx para su propio rango default).
//
// new Date(...) local, NUNCA Date.UTC(...), acá: hoy.getFullYear()/getMonth()/
// getDate() son getters LOCALES (zona horaria del proceso), así que
// construirlos de vuelta con Date.UTC() los trata como si ya fueran UTC —
// un bug real detectado en desarrollo (proceso en America/Guatemala,
// UTC-6): pasadas las ~6pm hora local, UTC ya cambió de día, y el rango
// "hasta hoy 23:59:59 [mal interpretado como UTC]" quedaba en el pasado
// respecto al momento real, excluyendo actividad de "hoy" del reporte. Con
// el constructor local (sin Date.UTC), el resultado es correcto sin
// importar la zona horaria del proceso — y no cambia nada en producción
// (Vercel corre en UTC, donde local y UTC ya coinciden).
export function rangoFechaPorDefecto(desdeStr?: string, hastaStr?: string) {
  const hoy = new Date();
  const desde = desdeStr
    ? new Date(`${desdeStr}T00:00:00.000Z`)
    : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const hasta = hastaStr
    ? new Date(`${hastaStr}T23:59:59.999Z`)
    : new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);
  return { desde, hasta };
}
