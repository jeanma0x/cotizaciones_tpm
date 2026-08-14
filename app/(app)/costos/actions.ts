"use server";

import { revalidatePath } from "next/cache";
import { assertAccesoEmpresa } from "@/lib/auth";
import { db } from "@/lib/db";
import { type CostoOperativoInput, costoOperativoSchema } from "@/lib/validations/costo";

function normalizar(datos: CostoOperativoInput) {
  return {
    empresaId: datos.empresaId,
    categoria: datos.categoria,
    descripcion: datos.descripcion,
    monto: datos.monto,
    fechaGasto: new Date(`${datos.fechaGasto}T00:00:00.000Z`),
  };
}

export async function crearCostoOperativo(input: unknown) {
  const datos = costoOperativoSchema.parse(input);
  await assertAccesoEmpresa(datos.empresaId);

  await db.costoOperativo.create({ data: normalizar(datos) });
  revalidatePath("/costos");
  revalidatePath("/dashboard");
}

export async function actualizarCostoOperativo(id: string, input: unknown) {
  const datos = costoOperativoSchema.parse(input);

  const existente = await db.costoOperativo.findUnique({ where: { id } });
  if (!existente) throw new Error("Costo no encontrado");

  await assertAccesoEmpresa(existente.empresaId);
  await assertAccesoEmpresa(datos.empresaId);

  await db.costoOperativo.update({ where: { id }, data: normalizar(datos) });
  revalidatePath("/costos");
  revalidatePath("/dashboard");
}

export async function eliminarCostoOperativo(id: string) {
  const existente = await db.costoOperativo.findUnique({ where: { id } });
  if (!existente) throw new Error("Costo no encontrado");

  await assertAccesoEmpresa(existente.empresaId);

  await db.costoOperativo.delete({ where: { id } });
  revalidatePath("/costos");
  revalidatePath("/dashboard");
}
