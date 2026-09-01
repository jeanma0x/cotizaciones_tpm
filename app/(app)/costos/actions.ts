"use server";

import { revalidatePath } from "next/cache";
import { assertAccesoEmpresa } from "@/lib/auth";
import { getUsuarioActual } from "@/lib/current-usuario";
import { db } from "@/lib/db";
import { type CostoOperativoInput, costoOperativoSchema } from "@/lib/validations/costo";

function normalizar(datos: CostoOperativoInput) {
  return {
    empresaId: datos.empresaId,
    clienteId: datos.clienteId || null,
    proyectoId: datos.proyectoId || null,
    categoria: datos.categoria,
    // Nunca guardar el detalle si la categoría no es OTRO — evita que quede
    // un residuo de texto huérfano si se cambia de OTRO a otra categoría.
    categoriaOtroDetalle: datos.categoria === "OTRO" ? datos.categoriaOtroDetalle || null : null,
    descripcion: datos.descripcion,
    monto: datos.monto,
    fechaGasto: new Date(`${datos.fechaGasto}T00:00:00.000Z`),
  };
}

// Fase 3.3 — mismo criterio que assertClienteDeEmpresa/assertProyectoDeCliente
// en documentos/actions.ts: nunca confiar en que el <select> del formulario
// ya filtró por empresa/cliente. "" (sin elegir) es válido para ambos.
async function assertClienteDeEmpresa(clienteId: string, empresaId: string) {
  if (!clienteId) return;
  const cliente = await db.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente || cliente.empresaId !== empresaId) {
    throw new Error("El cliente elegido no pertenece a la empresa seleccionada");
  }
}

async function assertProyectoDeCliente(proyectoId: string, clienteId: string) {
  if (!proyectoId) return;
  if (!clienteId) {
    throw new Error("Elegí un cliente antes de asociar un proyecto");
  }
  const proyecto = await db.proyecto.findUnique({ where: { id: proyectoId } });
  if (!proyecto || proyecto.clienteId !== clienteId) {
    throw new Error("El proyecto elegido no pertenece al cliente seleccionado");
  }
}

// Bitácora de solo-inserción (ver comentario en schema.prisma) — se llama
// después de cada create/update/delete real, nunca en su lugar. Si esto
// falla no debe tumbar la operación principal (perder el rastro de
// auditoría es preferible a que Oldemar no pueda registrar un gasto).
async function registrarAuditoria(datos: {
  costoOperativoId: string | null;
  empresaId: string;
  accion: "CREADO" | "EDITADO" | "ELIMINADO";
  categoria: string;
  categoriaOtroDetalle?: string | null;
  descripcion: string;
  monto: number | string;
  fechaGasto: Date;
}) {
  try {
    const usuario = await getUsuarioActual();
    await db.costoOperativoAuditoria.create({
      data: {
        costoOperativoId: datos.costoOperativoId,
        empresaId: datos.empresaId,
        accion: datos.accion,
        categoria: datos.categoria as never,
        categoriaOtroDetalle: datos.categoriaOtroDetalle ?? null,
        descripcion: datos.descripcion,
        monto: datos.monto,
        fechaGasto: datos.fechaGasto,
        usuarioId: usuario?.id ?? null,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar auditoría de costo:", error);
  }
}

export async function crearCostoOperativo(input: unknown) {
  const datos = costoOperativoSchema.parse(input);
  await assertAccesoEmpresa(datos.empresaId);
  await assertClienteDeEmpresa(datos.clienteId ?? "", datos.empresaId);
  await assertProyectoDeCliente(datos.proyectoId ?? "", datos.clienteId ?? "");

  const normalizado = normalizar(datos);
  const costo = await db.costoOperativo.create({ data: normalizado });
  await registrarAuditoria({
    costoOperativoId: costo.id,
    empresaId: costo.empresaId,
    accion: "CREADO",
    categoria: normalizado.categoria,
    categoriaOtroDetalle: normalizado.categoriaOtroDetalle,
    descripcion: normalizado.descripcion,
    monto: normalizado.monto,
    fechaGasto: normalizado.fechaGasto,
  });
  revalidatePath("/costos");
  revalidatePath("/dashboard");
}

// Tanda 3 del audit crítico — mismo criterio de optimistic locking que
// Documento (ver comentario en documentos/actions.ts): updatedAtOriginal es
// el valor que el formulario cargó al abrirse.
export async function actualizarCostoOperativo(
  id: string,
  updatedAtOriginal: string,
  input: unknown,
) {
  const datos = costoOperativoSchema.parse(input);

  const existente = await db.costoOperativo.findUnique({ where: { id } });
  if (!existente) throw new Error("Costo no encontrado");

  await assertAccesoEmpresa(existente.empresaId);
  // Tanda 4 del audit crítico: a diferencia de Documento (que bloquea
  // reasignar empresa porque el correlativo ya quedó asignado dentro de la
  // empresa original — ver actualizarDocumento en documentos/actions.ts),
  // un Costo sí puede moverse de empresa al editar. No tiene un identificador
  // secuencial propio ni ningún otro dato que dependa de "haber nacido" en
  // esa empresa — es un simple registro de gasto, así que corregir "lo cargué
  // en la empresa equivocada" no tiene el mismo riesgo que reescribir a qué
  // empresa pertenece un documento ya entregado/firmado por un cliente.
  await assertAccesoEmpresa(datos.empresaId);
  await assertClienteDeEmpresa(datos.clienteId ?? "", datos.empresaId);
  await assertProyectoDeCliente(datos.proyectoId ?? "", datos.clienteId ?? "");

  const mensajeConflicto =
    "Este costo cambió mientras lo editabas — recargá la página para ver la versión más reciente.";
  if (existente.updatedAt.toISOString() !== new Date(updatedAtOriginal).toISOString()) {
    throw new Error(mensajeConflicto);
  }

  const normalizado = normalizar(datos);
  const actualizados = await db.costoOperativo.updateMany({
    where: { id, updatedAt: existente.updatedAt },
    data: normalizado,
  });
  if (actualizados.count === 0) {
    throw new Error(mensajeConflicto);
  }
  await registrarAuditoria({
    costoOperativoId: id,
    empresaId: normalizado.empresaId,
    accion: "EDITADO",
    categoria: normalizado.categoria,
    categoriaOtroDetalle: normalizado.categoriaOtroDetalle,
    descripcion: normalizado.descripcion,
    monto: normalizado.monto,
    fechaGasto: normalizado.fechaGasto,
  });
  revalidatePath("/costos");
  revalidatePath("/dashboard");
}

// Tanda 3 del audit crítico: Costos era el único módulo con borrado físico,
// contradiciendo "nunca se pierde el historial" — ahora se alterna igual que
// Cliente/Servicio/Activo. La acción de auditoría queda como EDITADO (el
// registro sigue existiendo, solo cambia su estado); ELIMINADO se deja en el
// enum solo por las filas históricas ya escritas antes de este cambio.
export async function alternarActivoCostoOperativo(id: string) {
  const existente = await db.costoOperativo.findUnique({ where: { id } });
  if (!existente) throw new Error("Costo no encontrado");

  await assertAccesoEmpresa(existente.empresaId);

  const nuevoActivo = !existente.activo;
  await db.costoOperativo.update({ where: { id }, data: { activo: nuevoActivo } });
  await registrarAuditoria({
    costoOperativoId: id,
    empresaId: existente.empresaId,
    accion: "EDITADO",
    categoria: existente.categoria,
    categoriaOtroDetalle: existente.categoriaOtroDetalle,
    descripcion: existente.descripcion,
    monto: Number(existente.monto),
    fechaGasto: existente.fechaGasto,
  });
  revalidatePath("/costos");
  revalidatePath("/dashboard");
}
