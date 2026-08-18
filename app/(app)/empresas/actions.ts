"use server";

import { revalidatePath } from "next/cache";
import { assertAccesoEmpresa, assertSuperusuario } from "@/lib/auth";
import { getUsuarioActual } from "@/lib/current-usuario";
import { db } from "@/lib/db";
import { diffCampos } from "@/lib/auditoria";
import { empresaSchema } from "@/lib/validations/empresa";

const ETIQUETAS_EMPRESA = {
  nombre: "Nombre",
  nit: "NIT",
  direccion: "Dirección",
  contacto: "Contacto",
  telefono: "Teléfono",
  email: "Correo",
  codigoPais: "Código de país",
  moneda: "Moneda",
};

export async function actualizarEmpresa(id: string, input: unknown) {
  const datos = empresaSchema.parse(input);

  await assertSuperusuario();
  await assertAccesoEmpresa(id);

  const antes = await db.empresa.findUnique({ where: { id } });
  if (!antes) throw new Error("Empresa no encontrada");

  const nuevo = {
    nombre: datos.nombre,
    nit: datos.nit || null,
    direccion: datos.direccion || null,
    contacto: datos.contacto || null,
    telefono: datos.telefono || null,
    email: datos.email || null,
    codigoPais: datos.codigoPais,
    moneda: datos.moneda,
  };

  await db.empresa.update({ where: { id }, data: nuevo });

  try {
    const actor = await getUsuarioActual();
    await db.empresaAuditoria.create({
      data: {
        empresaId: id,
        detalle: diffCampos(antes, nuevo, ETIQUETAS_EMPRESA),
        usuarioId: actor?.id ?? null,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar auditoría de empresa:", error);
  }

  revalidatePath("/empresas");
}
