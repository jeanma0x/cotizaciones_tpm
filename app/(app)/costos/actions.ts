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
    descripcion: normalizado.descripcion,
    monto: normalizado.monto,
    fechaGasto: normalizado.fechaGasto,
  });
  revalidatePath("/costos");
  revalidatePath("/dashboard");
}

export async function actualizarCostoOperativo(id: string, input: unknown) {
  const datos = costoOperativoSchema.parse(input);

  const existente = await db.costoOperativo.findUnique({ where: { id } });
  if (!existente) throw new Error("Costo no encontrado");

  await assertAccesoEmpresa(existente.empresaId);
  await assertAccesoEmpresa(datos.empresaId);
  await assertClienteDeEmpresa(datos.clienteId ?? "", datos.empresaId);
  await assertProyectoDeCliente(datos.proyectoId ?? "", datos.clienteId ?? "");

  const normalizado = normalizar(datos);
  await db.costoOperativo.update({ where: { id }, data: normalizado });
  await registrarAuditoria({
    costoOperativoId: id,
    empresaId: normalizado.empresaId,
    accion: "EDITADO",
    categoria: normalizado.categoria,
    descripcion: normalizado.descripcion,
    monto: normalizado.monto,
    fechaGasto: normalizado.fechaGasto,
  });
  revalidatePath("/costos");
  revalidatePath("/dashboard");
}

export async function eliminarCostoOperativo(id: string) {
  const existente = await db.costoOperativo.findUnique({ where: { id } });
  if (!existente) throw new Error("Costo no encontrado");

  await assertAccesoEmpresa(existente.empresaId);

  await db.costoOperativo.delete({ where: { id } });
  // costoOperativoId: null a propósito — la fila que se acaba de borrar ya
  // no existe, onDelete: SetNull la dejaría en null de todas formas; se
  // pasa explícito para no depender de ese efecto secundario.
  await registrarAuditoria({
    costoOperativoId: null,
    empresaId: existente.empresaId,
    accion: "ELIMINADO",
    categoria: existente.categoria,
    descripcion: existente.descripcion,
    monto: Number(existente.monto),
    fechaGasto: existente.fechaGasto,
  });
  revalidatePath("/costos");
  revalidatePath("/dashboard");
}
