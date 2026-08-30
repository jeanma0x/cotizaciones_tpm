// ISR: Régimen Opcional Simplificado sobre Ingresos de Actividades
// Lucrativas (Decreto 10-2012, Libro I, art. 44 y siguientes) — 5% sobre
// los primeros Q30,000 de ingresos MENSUALES por contribuyente, 7% sobre
// el excedente. Es el régimen más común para una PYME de servicios (bajo
// costo fijo, alta relación margen/ingreso) y el que se eligió acá a falta
// de que Oldemar confirme cuál tiene inscrito cada empresa en su RTU — si
// alguna empresa está en Régimen sobre las Utilidades (25% sobre la
// ganancia neta, no sobre el ingreso), este cálculo quedaría distinto y
// hay que ajustarlo.
//
// Solo aplica a empresas de Guatemala (codigoPais "502" — Corporación SIAP
// y Servicios Generales TPM): Panamá y Estados Unidos tributan bajo sus
// propias leyes, no la guatemalteca, y no se les aplica este descuento.
//
// IVA NO se descuenta acá a propósito: es un impuesto de traslado (se
// cobra al cliente y se acredita contra el IVA pagado en compras), no un
// costo del negocio — reducir "Facturado" por el 12% de IVA solo sería
// correcto si supiéramos cuánto IVA se pagó en compras (crédito fiscal),
// que este sistema no registra. Restarlo sin eso sobreestimaría el
// impuesto real y subestimaría la utilidad.
//
// Extraído de app/(app)/dashboard/page.tsx para reusarlo también en los
// reportes financieros — antes solo vivía inline ahí, con riesgo de que
// una futura corrección de tasa se aplicara en un solo lugar y no en el
// otro.
export const ISR_LIMITE_TRAMO_1 = 30000; // Q30,000 mensuales
export const ISR_TASA_TRAMO_1 = 0.05;
export const ISR_TASA_TRAMO_2 = 0.07;
export const GUATEMALA_CODIGO_PAIS = "502";

export function calcularIsrSimplificado(ingresoMensual: number) {
  if (ingresoMensual <= 0) return 0;
  if (ingresoMensual <= ISR_LIMITE_TRAMO_1) return ingresoMensual * ISR_TASA_TRAMO_1;
  return (
    ISR_LIMITE_TRAMO_1 * ISR_TASA_TRAMO_1 +
    (ingresoMensual - ISR_LIMITE_TRAMO_1) * ISR_TASA_TRAMO_2
  );
}
