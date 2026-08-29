"use server";

import { revalidatePath } from "next/cache";
import { assertAccesoEmpresa } from "@/lib/auth";
import { db } from "@/lib/db";
import { type ActivoInput, activoSchema } from "@/lib/validations/activo";

function normalizar(datos: ActivoInput) {
  return {
    empresaId: datos.empresaId,
    tipo: datos.tipo,
    // Nunca guardar una categoría "huérfana" si el tipo cambió a algo que no
    // sea furgón/plataforma — el refine del schema ya exige categoría
    // cuando corresponde, esto solo limpia el resto de los casos.
    categoria: datos.tipo === "FURGON_O_PLATAFORMA" ? datos.categoria || null : null,
    placa: datos.placa || null,
    modelo: datos.modelo || null,
    costo: datos.costo,
    valor: datos.valor,
    activo: datos.activo,
  };
}

export async function crearActivo(input: unknown) {
  const datos = activoSchema.parse(input);
  await assertAccesoEmpresa(datos.empresaId);

  await db.activo.create({ data: normalizar(datos) });
  revalidatePath("/activos");
}

export async function actualizarActivo(id: string, input: unknown) {
  const datos = activoSchema.parse(input);

  const existente = await db.activo.findUnique({ where: { id } });
  if (!existente) throw new Error("Activo no encontrado");

  await assertAccesoEmpresa(existente.empresaId);
  await assertAccesoEmpresa(datos.empresaId);

  await db.activo.update({ where: { id }, data: normalizar(datos) });
  revalidatePath("/activos");
}

export async function alternarActivoRegistroActivo(id: string) {
  const existente = await db.activo.findUnique({ where: { id } });
  if (!existente) throw new Error("Activo no encontrado");

  await assertAccesoEmpresa(existente.empresaId);

  await db.activo.update({
    where: { id },
    data: { activo: !existente.activo },
  });
  revalidatePath("/activos");
}
