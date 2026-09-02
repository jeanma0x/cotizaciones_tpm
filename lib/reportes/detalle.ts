import { db } from "@/lib/db";
import { CATEGORIA_COSTO_LABELS } from "@/lib/validations/costo";

export type FilaDetalleDocumento = {
  id: string;
  fecha: Date;
  empresaNombre: string;
  clienteNombre: string;
  proyectoNombre: string | null;
  tipoLabel: string;
  moneda: string;
  total: number;
};

export type FilaDetalleCosto = {
  id: string;
  fecha: Date;
  empresaNombre: string;
  clienteNombre: string | null;
  proyectoNombre: string | null;
  categoriaLabel: string;
  descripcion: string;
  moneda: string;
  monto: number;
};

const TIPO_LABELS: Record<string, string> = {
  COTIZACION: "Cotización",
  PROPUESTA: "Propuesta",
  FACTURA: "Factura",
};

// "Detalle opcional" del reporte (docs/fase3-clientes-proyectos-costos-activos.md,
// sección "Módulo de Reportes"): los documentos y costos individuales que
// componen los totales del período, para que el contador pueda auditar de
// dónde sale cada cifra, no solo confiar en el total agregado.
export async function obtenerDetalleReporte({
  empresaIds,
  desde,
  hasta,
  clienteId,
  proyectoId,
}: {
  empresaIds: string[];
  desde: Date;
  hasta: Date;
  clienteId?: string;
  proyectoId?: string;
}): Promise<{ documentos: FilaDetalleDocumento[]; costos: FilaDetalleCosto[] }> {
  const [documentos, costos] = await Promise.all([
    db.documento.findMany({
      where: {
        empresaId: { in: empresaIds },
        fecha: { gte: desde, lte: hasta },
        estado: "FACTURADA",
        anulado: false,
        ...(clienteId ? { clienteId } : {}),
        ...(proyectoId ? { proyectoId } : {}),
      },
      include: { empresa: true, cliente: true, proyecto: true },
      orderBy: { fecha: "asc" },
    }),
    db.costoOperativo.findMany({
      where: {
        empresaId: { in: empresaIds },
        activo: true,
        fechaGasto: { gte: desde, lte: hasta },
        ...(clienteId ? { clienteId } : {}),
        ...(proyectoId ? { proyectoId } : {}),
      },
      include: { empresa: true, cliente: true, proyecto: true },
      orderBy: { fechaGasto: "asc" },
    }),
  ]);

  return {
    documentos: documentos.map((d) => ({
      id: d.id,
      fecha: d.fecha,
      empresaNombre: d.empresa.nombre,
      clienteNombre: d.cliente?.nombre ?? "—",
      proyectoNombre: d.proyecto?.nombre ?? null,
      tipoLabel: TIPO_LABELS[d.tipo] ?? d.tipo,
      moneda: d.empresa.moneda,
      total: Number(d.total),
    })),
    costos: costos.map((c) => ({
      id: c.id,
      fecha: c.fechaGasto,
      empresaNombre: c.empresa.nombre,
      clienteNombre: c.cliente?.nombre ?? null,
      proyectoNombre: c.proyecto?.nombre ?? null,
      categoriaLabel: CATEGORIA_COSTO_LABELS[c.categoria],
      descripcion: c.descripcion,
      moneda: c.empresa.moneda,
      monto: Number(c.monto),
    })),
  };
}
