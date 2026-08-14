"use server";

import { revalidatePath } from "next/cache";
import { assertAccesoEmpresa } from "@/lib/auth";
import { db } from "@/lib/db";
import { type ClienteInput, clienteSchema } from "@/lib/validations/cliente";

function normalizar(datos: ClienteInput) {
  return {
    empresaId: datos.empresaId,
    tipo: datos.tipo,
    nombre: datos.nombre,
    nit: datos.nit || null,
    direccion: datos.direccion || null,
    contacto: datos.contacto || null,
    telefono: datos.telefono || null,
    email: datos.email || null,
    codigoPais: datos.codigoPais || null,
    activo: datos.activo,
  };
}

// Los contactos solo aplican a tipo EMPRESA — si el formulario se guarda
// como INDIVIDUAL, cualquier contacto que hubiera quedado cargado se
// descarta (evita contactos huérfanos de un cambio de tipo).
function contactosParaGuardar(datos: ClienteInput) {
  if (datos.tipo !== "EMPRESA") return [];
  return datos.contactos;
}

export async function crearCliente(input: unknown) {
  const datos = clienteSchema.parse(input);
  await assertAccesoEmpresa(datos.empresaId);

  await db.cliente.create({
    data: {
      ...normalizar(datos),
      contactos: { create: contactosParaGuardar(datos) },
    },
  });
  revalidatePath("/clientes");
}

export async function actualizarCliente(id: string, input: unknown) {
  const datos = clienteSchema.parse(input);

  const existente = await db.cliente.findUnique({ where: { id } });
  if (!existente) throw new Error("Cliente no encontrado");

  // El cliente debe pertenecer a una empresa permitida, y la empresa destino
  // (por si el formulario intentara cambiarla) también.
  await assertAccesoEmpresa(existente.empresaId);
  await assertAccesoEmpresa(datos.empresaId);

  await db.$transaction([
    db.contactoCliente.deleteMany({ where: { clienteId: id } }),
    db.cliente.update({
      where: { id },
      data: {
        ...normalizar(datos),
        contactos: { create: contactosParaGuardar(datos) },
      },
    }),
  ]);
  revalidatePath("/clientes");
}

export async function alternarActivoCliente(id: string) {
  const existente = await db.cliente.findUnique({ where: { id } });
  if (!existente) throw new Error("Cliente no encontrado");

  await assertAccesoEmpresa(existente.empresaId);

  await db.cliente.update({
    where: { id },
    data: { activo: !existente.activo },
  });
  revalidatePath("/clientes");
}
