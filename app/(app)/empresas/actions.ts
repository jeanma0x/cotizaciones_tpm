"use server";

import { revalidatePath } from "next/cache";
import { assertAccesoEmpresa, assertSuperusuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { empresaSchema } from "@/lib/validations/empresa";

export async function actualizarEmpresa(id: string, input: unknown) {
  const datos = empresaSchema.parse(input);

  await assertSuperusuario();
  await assertAccesoEmpresa(id);

  await db.empresa.update({
    where: { id },
    data: {
      nombre: datos.nombre,
      nit: datos.nit || null,
      direccion: datos.direccion || null,
      telefono: datos.telefono || null,
      email: datos.email || null,
      moneda: datos.moneda,
    },
  });
  revalidatePath("/empresas");
}
