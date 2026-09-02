// Verificación de la fórmula de ISR/IVA en aislamiento — sin DB, sin mocks:
// son funciones puras (ver lib/impuestos.ts). El resto de la regresión
// (que el panel/reportes efectivamente los descuenten de "Utilidad neta")
// vive en e2e/documento-anulado.spec.ts y e2e/reportes.spec.ts, donde sí
// hace falta el flujo completo por UI.
import { describe, expect, it } from "vitest";
import {
  IVA_TASA_GUATEMALA,
  ISR_LIMITE_TRAMO_1,
  calcularIsrSimplificado,
  calcularIvaPesimista,
} from "@/lib/impuestos";

describe("calcularIsrSimplificado", () => {
  it("retorna 0 para ingresos en 0 o negativos", () => {
    expect(calcularIsrSimplificado(0)).toBe(0);
    expect(calcularIsrSimplificado(-100)).toBe(0);
  });

  it("aplica 5% dentro del primer tramo (Q30,000)", () => {
    expect(calcularIsrSimplificado(10000)).toBeCloseTo(500);
    expect(calcularIsrSimplificado(ISR_LIMITE_TRAMO_1)).toBeCloseTo(1500);
  });

  it("aplica 7% sobre el excedente del segundo tramo", () => {
    // Q40,000 = Q30,000 * 5% + Q10,000 * 7% = 1500 + 700 = 2200
    expect(calcularIsrSimplificado(40000)).toBeCloseTo(2200);
  });
});

describe("calcularIvaPesimista", () => {
  it("retorna 0 para ingresos en 0 o negativos", () => {
    expect(calcularIvaPesimista(0)).toBe(0);
    expect(calcularIvaPesimista(-100)).toBe(0);
  });

  it("aplica 12% plano, sin tramos", () => {
    expect(IVA_TASA_GUATEMALA).toBe(0.12);
    expect(calcularIvaPesimista(10000)).toBeCloseTo(1200);
    expect(calcularIvaPesimista(100000)).toBeCloseTo(12000);
  });
});
