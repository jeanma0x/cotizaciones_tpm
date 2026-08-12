"use server";

import { revalidatePath } from "next/cache";
import { assertAccesoEmpresa } from "@/lib/auth";
import { db } from "@/lib/db";
import { type ServicioInput, servicioSchema } from "@/lib/validations/servicio";

function normalizar(datos: ServicioInput) {
  return {
    empresaId: datos.empresaId,
    nombre: datos.nombre,
    precioFijo: datos.precioFijo,
    activo: datos.activo,
  };
}

export async function crearServicio(input: unknown) {
  const datos = servicioSchema.parse(input);
  await assertAccesoEmpresa(datos.empresaId);

  await db.servicio.create({ data: normalizar(datos) });
  revalidatePath("/servicios");
}

export async function actualizarServicio(id: string, input: unknown) {
  const datos = servicioSchema.parse(input);

  const existente = await db.servicio.findUnique({ where: { id } });
  if (!existente) throw new Error("Servicio no encontrado");

  await assertAccesoEmpresa(existente.empresaId);
  await assertAccesoEmpresa(datos.empresaId);

  await db.servicio.update({ where: { id }, data: normalizar(datos) });
  revalidatePath("/servicios");
}

export async function alternarActivoServicio(id: string) {
  const existente = await db.servicio.findUnique({ where: { id } });
  if (!existente) throw new Error("Servicio no encontrado");

  await assertAccesoEmpresa(existente.empresaId);

  await db.servicio.update({
    where: { id },
    data: { activo: !existente.activo },
  });
  revalidatePath("/servicios");
}
