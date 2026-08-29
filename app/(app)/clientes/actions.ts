"use server";

import { revalidatePath } from "next/cache";
import { assertAccesoEmpresa } from "@/lib/auth";
import { diffCampos } from "@/lib/auditoria";
import { getUsuarioActual } from "@/lib/current-usuario";
import { db } from "@/lib/db";
import { type ClienteInput, clienteSchema } from "@/lib/validations/cliente";
import { type ProyectoInput, proyectoSchema } from "@/lib/validations/proyecto";

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

// Fase 3.3 — catálogo de Proyectos por cliente. Proyecto no tiene empresaId
// propio (ver schema.prisma): el aislamiento por empresa se valida siempre a
// través del Cliente dueño del proyecto, nunca asumiendo el empresaId de
// quien llama la acción.
export async function crearProyecto(input: unknown) {
  const datos: ProyectoInput = proyectoSchema.parse(input);

  const cliente = await db.cliente.findUnique({ where: { id: datos.clienteId } });
  if (!cliente) throw new Error("Cliente no encontrado");
  await assertAccesoEmpresa(cliente.empresaId);

  await db.proyecto.create({
    data: { clienteId: datos.clienteId, nombre: datos.nombre, activo: datos.activo },
  });
  revalidatePath("/clientes");
}

export async function actualizarProyecto(id: string, input: unknown) {
  const datos: ProyectoInput = proyectoSchema.parse(input);

  const existente = await db.proyecto.findUnique({
    where: { id },
    include: { cliente: true },
  });
  if (!existente) throw new Error("Proyecto no encontrado");
  // El proyecto no puede "moverse" a un cliente de otra empresa por esta vía
  // — clienteId de un proyecto ya creado no es editable en el formulario,
  // pero igual se revalida por si el input viniera manipulado.
  await assertAccesoEmpresa(existente.cliente.empresaId);
  if (datos.clienteId !== existente.clienteId) {
    throw new Error("El proyecto no puede reasignarse a otro cliente");
  }

  await db.proyecto.update({
    where: { id },
    data: { nombre: datos.nombre, activo: datos.activo },
  });
  revalidatePath("/clientes");
}

export async function alternarActivoProyecto(id: string) {
  const existente = await db.proyecto.findUnique({
    where: { id },
    include: { cliente: true },
  });
  if (!existente) throw new Error("Proyecto no encontrado");
  await assertAccesoEmpresa(existente.cliente.empresaId);

  await db.proyecto.update({
    where: { id },
    data: { activo: !existente.activo },
  });
  revalidatePath("/clientes");
}
