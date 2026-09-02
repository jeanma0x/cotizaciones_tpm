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

// IVA — pedido explícito de Oldemar (audio, 02/09/26), y un cambio
// deliberado de criterio respecto a la versión anterior de este archivo
// (que a propósito NO restaba IVA, por ser un impuesto de traslado con
// crédito fiscal real). Oldemar conoce ese matiz — sabe que el IVA pagado
// en compras se acredita contra el IVA cobrado, y que este sistema no
// rastrea ese crédito fiscal — y aun así prefiere tratar el 12% como un
// costo fijo en un escenario PESIMISTA: así, cualquier crédito fiscal real
// que termine aplicando se ve reflejado como una ganancia extra sobre lo ya
// mostrado, nunca como una utilidad que resultó ser menor de lo esperado.
// Mismo criterio de gate por país que ISR (solo Guatemala) y misma base
// (facturado del mes) — plano, sin tramos.
export const IVA_TASA_GUATEMALA = 0.12;

export function calcularIvaPesimista(ingresoMensual: number) {
  if (ingresoMensual <= 0) return 0;
  return ingresoMensual * IVA_TASA_GUATEMALA;
}
