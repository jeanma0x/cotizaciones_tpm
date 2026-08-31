import { db } from "@/lib/db";

export type FilaReporteCliente = {
  clienteId: string;
  clienteNombre: string;
  empresaNombre: string;
  proyectoId: string | null;
  proyectoNombre: string | null;
  moneda: string;
  facturado: number;
  costos: number;
  utilidad: number;
};

// Reporte por cliente/proyecto — generaliza utilidadPorProyecto del panel
// (Fase 3.4, app/(app)/dashboard/page.tsx) para cualquier rango de fechas,
// y agrega también la facturación/costos de un cliente SIN proyecto
// asociado (el panel solo cubría proyectos; un costo o documento con
// clienteId pero proyectoId null antes quedaba fuera de este tipo de
// reporte).
export async function obtenerReporteClientes({
  empresaIds,
  desde,
  hasta,
  clienteId,
  proyectoId,
}: {
  empresaIds: string[];
  desde?: Date;
  hasta?: Date;
  clienteId?: string;
  proyectoId?: string;
}): Promise<FilaReporteCliente[]> {
  const rangoFecha =
    desde || hasta ? { ...(desde ? { gte: desde } : {}), ...(hasta ? { lte: hasta } : {}) } : undefined;

  const clientes = await db.cliente.findMany({
    where: {
      empresaId: { in: empresaIds },
      ...(clienteId ? { id: clienteId } : {}),
    },
    include: {
      empresa: { select: { nombre: true, moneda: true } },
      proyectos: proyectoId ? { where: { id: proyectoId } } : true,
    },
    orderBy: { nombre: "asc" },
  });

  const proyectoIds = clientes.flatMap((c) => c.proyectos.map((p) => p.id));
  const clienteIds = clientes.map((c) => c.id);

  const [facturadoPorProyecto, costosPorProyecto, facturadoDirectoPorCliente, costosDirectoPorCliente] =
    await Promise.all([
      proyectoIds.length > 0
        ? db.documento.groupBy({
            by: ["proyectoId"],
            where: { proyectoId: { in: proyectoIds }, estado: "FACTURADA", ...(rangoFecha ? { fecha: rangoFecha } : {}) },
            _sum: { total: true },
          })
        : [],
      proyectoIds.length > 0
        ? db.costoOperativo.groupBy({
            by: ["proyectoId"],
            where: { proyectoId: { in: proyectoIds }, ...(rangoFecha ? { fechaGasto: rangoFecha } : {}) },
            _sum: { monto: true },
          })
        : [],
      // "Directo" = ligado al cliente pero sin proyecto — no debe pisar lo
      // que ya se contó por proyecto arriba.
      proyectoId
        ? []
        : db.documento.groupBy({
            by: ["clienteId"],
            where: {
              clienteId: { in: clienteIds },
              proyectoId: null,
              estado: "FACTURADA",
              ...(rangoFecha ? { fecha: rangoFecha } : {}),
            },
            _sum: { total: true },
          }),
      proyectoId
        ? []
        : db.costoOperativo.groupBy({
            by: ["clienteId"],
            where: {
              clienteId: { in: clienteIds },
              proyectoId: null,
              ...(rangoFecha ? { fechaGasto: rangoFecha } : {}),
            },
            _sum: { monto: true },
          }),
    ]);

  const facturadoProyectoMapa = new Map(facturadoPorProyecto.map((f) => [f.proyectoId, Number(f._sum.total ?? 0)]));
  const costosProyectoMapa = new Map(costosPorProyecto.map((c) => [c.proyectoId, Number(c._sum.monto ?? 0)]));
  const facturadoClienteMapa = new Map(
    facturadoDirectoPorCliente.map((f) => [f.clienteId, Number(f._sum.total ?? 0)]),
  );
  const costosClienteMapa = new Map(costosDirectoPorCliente.map((c) => [c.clienteId, Number(c._sum.monto ?? 0)]));

  const filas: FilaReporteCliente[] = [];

  for (const cliente of clientes) {
    for (const proyecto of cliente.proyectos) {
      const facturado = facturadoProyectoMapa.get(proyecto.id) ?? 0;
      const costos = costosProyectoMapa.get(proyecto.id) ?? 0;
      filas.push({
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        empresaNombre: cliente.empresa.nombre,
        proyectoId: proyecto.id,
        proyectoNombre: proyecto.nombre,
        moneda: cliente.empresa.moneda,
        facturado,
        costos,
        utilidad: facturado - costos,
      });
    }

    // Fila "sin proyecto" — solo si hay algo que mostrar, o si se filtró
    // explícitamente por este cliente (para que no desaparezca sin
    // explicación cuando se lo busca a propósito).
    const facturadoDirecto = facturadoClienteMapa.get(cliente.id) ?? 0;
    const costosDirecto = costosClienteMapa.get(cliente.id) ?? 0;
    if (!proyectoId && (facturadoDirecto > 0 || costosDirecto > 0 || clienteId === cliente.id)) {
      filas.push({
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        empresaNombre: cliente.empresa.nombre,
        proyectoId: null,
        proyectoNombre: null,
        moneda: cliente.empresa.moneda,
        facturado: facturadoDirecto,
        costos: costosDirecto,
        utilidad: facturadoDirecto - costosDirecto,
      });
    }
  }

  return filas;
}
