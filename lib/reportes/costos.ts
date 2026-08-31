import { db } from "@/lib/db";
import { CATEGORIA_COSTO_LABELS } from "@/lib/validations/costo";
import type { CategoriaCosto } from "@prisma/client";

export type FilaReporteCosto = {
  empresaId: string;
  empresaNombre: string;
  moneda: string;
  categoria: CategoriaCosto;
  categoriaLabel: string;
  total: number;
  cantidad: number;
};

// Reporte de costos operativos — generaliza la agregación que hoy alimenta
// "Costos por categoría" del panel (fija a "este mes") a cualquier rango,
// con filtro opcional de categoría/cliente/proyecto.
export async function obtenerReporteCostos({
  empresaIds,
  desde,
  hasta,
  categoria,
  clienteId,
  proyectoId,
}: {
  empresaIds: string[];
  desde?: Date;
  hasta?: Date;
  categoria?: CategoriaCosto;
  clienteId?: string;
  proyectoId?: string;
}): Promise<FilaReporteCosto[]> {
  const rangoFecha =
    desde || hasta ? { ...(desde ? { gte: desde } : {}), ...(hasta ? { lte: hasta } : {}) } : undefined;

  // "categoriaOtroDetalle" en el group by: sin esto, todos los "Otro"
  // (Seguros, Multas, etc.) colapsan en una sola fila genérica "Otro" —
  // justo lo que Oldemar pidió poder distinguir.
  const grupos = await db.costoOperativo.groupBy({
    by: ["empresaId", "categoria", "categoriaOtroDetalle"],
    where: {
      empresaId: { in: empresaIds },
      ...(rangoFecha ? { fechaGasto: rangoFecha } : {}),
      ...(categoria ? { categoria } : {}),
      ...(clienteId ? { clienteId } : {}),
      ...(proyectoId ? { proyectoId } : {}),
    },
    _sum: { monto: true },
    _count: true,
  });

  const empresas = await db.empresa.findMany({
    where: { id: { in: empresaIds } },
    select: { id: true, nombre: true, moneda: true },
  });

  return grupos
    .map((g) => {
      const empresa = empresas.find((e) => e.id === g.empresaId)!;
      return {
        empresaId: g.empresaId,
        empresaNombre: empresa.nombre,
        moneda: empresa.moneda,
        categoria: g.categoria,
        categoriaLabel:
          g.categoria === "OTRO" && g.categoriaOtroDetalle
            ? `Otro: ${g.categoriaOtroDetalle}`
            : CATEGORIA_COSTO_LABELS[g.categoria],
        total: Number(g._sum.monto ?? 0),
        cantidad: g._count,
      };
    })
    .sort((a, b) => {
      if (a.empresaNombre !== b.empresaNombre) return a.empresaNombre.localeCompare(b.empresaNombre);
      return b.total - a.total;
    });
}
