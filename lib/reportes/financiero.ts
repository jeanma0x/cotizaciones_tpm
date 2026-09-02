import { db } from "@/lib/db";
import {
  GUATEMALA_CODIGO_PAIS,
  calcularIsrSimplificado,
  calcularIvaPesimista,
} from "@/lib/impuestos";

export type FilaReporteFinanciero = {
  empresaId: string;
  empresaNombre: string;
  moneda: string;
  mesClave: string; // "2026-3" — para ordenar
  mesLabel: string; // "mar 26" — para mostrar
  cotizado: number;
  facturado: number;
  costos: number;
  isr: number;
  iva: number;
  utilidadNeta: number;
};

function claveYLabelMes(fecha: Date) {
  const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
  const label = fecha.toLocaleDateString("es-GT", { month: "short", year: "2-digit" });
  return { clave, label };
}

// Reporte financiero por período — generaliza la lógica de "Tendencia"
// (cotizado, por tipo de documento) y "Utilidad neta (mes)" (facturado real
// vía estado FACTURADA, menos costos, menos ISR) del panel, pero sobre
// cualquier rango de fechas elegido en vez de fijo a 12 meses/mes actual.
// Ver lib/isr.ts para la fórmula de ISR.
export async function obtenerReporteFinanciero({
  empresaIds,
  desde,
  hasta,
}: {
  empresaIds: string[];
  desde: Date;
  hasta: Date;
}): Promise<FilaReporteFinanciero[]> {
  const [empresas, cotizados, facturados, costos] = await Promise.all([
    db.empresa.findMany({
      where: { id: { in: empresaIds } },
      select: { id: true, nombre: true, moneda: true, codigoPais: true },
    }),
    // "Cotizado": mismo criterio que Tendencia del panel — por tipo de
    // documento (no FACTURA), excluyendo rechazadas, sin importar su estado
    // final. Representa el pipeline generado ese mes, no lo realmente
    // cobrado (eso es "Facturado" abajo).
    db.documento.findMany({
      where: {
        empresaId: { in: empresaIds },
        fecha: { gte: desde, lte: hasta },
        tipo: { not: "FACTURA" },
        estado: { not: "RECHAZADA" },
        anulado: false,
      },
      select: { empresaId: true, fecha: true, total: true },
    }),
    // "Facturado": estado FACTURADA (no tipo FACTURA) — una cotización
    // convertida a factura sigue con tipo COTIZACION pero cuenta como
    // facturado real. Mismo criterio que "Facturado (histórico)" y
    // "Utilidad neta (mes)" del panel.
    db.documento.findMany({
      where: {
        empresaId: { in: empresaIds },
        fecha: { gte: desde, lte: hasta },
        estado: "FACTURADA",
        anulado: false,
      },
      select: { empresaId: true, fecha: true, total: true },
    }),
    db.costoOperativo.findMany({
      where: { empresaId: { in: empresaIds }, activo: true, fechaGasto: { gte: desde, lte: hasta } },
      select: { empresaId: true, fechaGasto: true, monto: true },
    }),
  ]);

  const filaPorEmpresaYMes = new Map<string, FilaReporteFinanciero>();

  function obtenerFila(empresaId: string, fecha: Date) {
    const empresa = empresas.find((e) => e.id === empresaId);
    if (!empresa) return null;
    const { clave, label } = claveYLabelMes(fecha);
    const llave = `${empresaId}-${clave}`;
    let fila = filaPorEmpresaYMes.get(llave);
    if (!fila) {
      fila = {
        empresaId,
        empresaNombre: empresa.nombre,
        moneda: empresa.moneda,
        mesClave: clave,
        mesLabel: label,
        cotizado: 0,
        facturado: 0,
        costos: 0,
        isr: 0,
        iva: 0,
        utilidadNeta: 0,
      };
      filaPorEmpresaYMes.set(llave, fila);
    }
    return fila;
  }

  for (const doc of cotizados) {
    const fila = obtenerFila(doc.empresaId, doc.fecha);
    if (fila) fila.cotizado += Number(doc.total);
  }
  for (const doc of facturados) {
    const fila = obtenerFila(doc.empresaId, doc.fecha);
    if (fila) fila.facturado += Number(doc.total);
  }
  for (const costo of costos) {
    const fila = obtenerFila(costo.empresaId, costo.fechaGasto);
    if (fila) fila.costos += Number(costo.monto);
  }

  for (const fila of filaPorEmpresaYMes.values()) {
    const empresa = empresas.find((e) => e.id === fila.empresaId)!;
    if (empresa.codigoPais === GUATEMALA_CODIGO_PAIS) {
      fila.isr = calcularIsrSimplificado(fila.facturado);
      fila.iva = calcularIvaPesimista(fila.facturado);
    }
    fila.utilidadNeta = fila.facturado - fila.costos - fila.isr - fila.iva;
  }

  return Array.from(filaPorEmpresaYMes.values()).sort((a, b) => {
    if (a.empresaNombre !== b.empresaNombre) return a.empresaNombre.localeCompare(b.empresaNombre);
    return a.mesClave.localeCompare(b.mesClave);
  });
}
