"use server";

import { revalidatePath } from "next/cache";
import { assertAccesoEmpresa } from "@/lib/auth";
import { diffCampos } from "@/lib/auditoria";
import { getUsuarioActual } from "@/lib/current-usuario";
import { db } from "@/lib/db";
import { type ClienteInput, clienteSchema } from "@/lib/validations/cliente";

const ETIQUETAS_CLIENTE = {
  empresaId: "Empresa",
  tipo: "Tipo",
  nombre: "Nombre",
  nit: "NIT",
  direccion: "Dirección",
  contacto: "Contacto",
  telefono: "Teléfono",
  email: "Correo",
  codigoPais: "Código de país",
  activo: "Activo",
};

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

async function registrarAuditoriaCliente(datos: {
  clienteId: string | null;
  empresaId: string;
  accion: "CREADO" | "EDITADO";
  clienteNombre: string;
  detalle: string;
}) {
  try {
    const actor = await getUsuarioActual();
    await db.clienteAuditoria.create({
      data: {
        clienteId: datos.clienteId,
        empresaId: datos.empresaId,
        accion: datos.accion,
        clienteNombre: datos.clienteNombre,
        detalle: datos.detalle,
        usuarioId: actor?.id ?? null,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar auditoría de cliente:", error);
  }
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

  const cliente = await db.cliente.create({
    data: {
      ...normalizar(datos),
      contactos: { create: contactosParaGuardar(datos) },
    },
  });
  await registrarAuditoriaCliente({
    clienteId: cliente.id,
    empresaId: cliente.empresaId,
    accion: "CREADO",
    clienteNombre: cliente.nombre,
    detalle: "Cliente creado",
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

  const nuevo = normalizar(datos);
  await db.$transaction([
    db.contactoCliente.deleteMany({ where: { clienteId: id } }),
    db.cliente.update({
      where: { id },
      data: {
        ...nuevo,
        contactos: { create: contactosParaGuardar(datos) },
      },
    }),
  ]);
  await registrarAuditoriaCliente({
    clienteId: id,
    empresaId: nuevo.empresaId,
    accion: "EDITADO",
    clienteNombre: nuevo.nombre,
    detalle: diffCampos(existente, nuevo, ETIQUETAS_CLIENTE),
  });
  revalidatePath("/clientes");
}

export async function alternarActivoCliente(id: string) {
  const existente = await db.cliente.findUnique({ where: { id } });
  if (!existente) throw new Error("Cliente no encontrado");

  await assertAccesoEmpresa(existente.empresaId);

  const nuevoActivo = !existente.activo;
  await db.cliente.update({
    where: { id },
    data: { activo: nuevoActivo },
  });
  await registrarAuditoriaCliente({
    clienteId: id,
    empresaId: existente.empresaId,
    accion: "EDITADO",
    clienteNombre: existente.nombre,
    detalle: `Activo: ${existente.activo ? "Sí" : "No"} → ${nuevoActivo ? "Sí" : "No"}`,
  });
  revalidatePath("/clientes");
}
