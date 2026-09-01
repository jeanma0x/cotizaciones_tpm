"use server";

import { revalidatePath } from "next/cache";
import { assertAccesoEmpresa } from "@/lib/auth";
import { diffCampos } from "@/lib/auditoria";
import { getUsuarioActual } from "@/lib/current-usuario";
import { db } from "@/lib/db";
import { PREFIJO_ERROR_DUPLICADO } from "@/lib/duplicado";
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

// Doble confirmación (no un bloqueo duro): el usuario trabaja desde Excel/
// WhatsApp y puede repetir nombres fácilmente (dos personas cargando al
// mismo cliente el mismo día) — homónimos legítimos también existen, así
// que esto solo avisa antes de crear, nunca lo impide. Ver confirmarDuplicado
// en lib/validations/cliente.ts.
async function buscarClienteDuplicado(empresaId: string, nombre: string, nit: string) {
  const porNombre = await db.cliente.findFirst({
    where: { empresaId, nombre: { equals: nombre, mode: "insensitive" } },
  });
  if (porNombre) return { campo: "nombre" as const, nombre: porNombre.nombre };

  if (nit) {
    const porNit = await db.cliente.findFirst({
      where: { empresaId, nit: { equals: nit, mode: "insensitive" } },
    });
    if (porNit) return { campo: "NIT" as const, nombre: porNit.nombre };
  }
  return null;
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

  if (!datos.confirmarDuplicado) {
    const duplicado = await buscarClienteDuplicado(datos.empresaId, datos.nombre, datos.nit ?? "");
    if (duplicado) {
      throw new Error(
        `${PREFIJO_ERROR_DUPLICADO}Ya existe un cliente con este ${duplicado.campo} ("${duplicado.nombre}"). ¿Creás este de todas formas?`,
      );
    }
  }

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

// Tanda 3 del audit crítico: antes de esto, desactivar un Cliente no
// avisaba si tenía proyectos o documentos en curso — informativo, no
// bloquea (el usuario decide con el dato a la vista, no se le impide nada).
export async function contarDependientesCliente(clienteId: string) {
  const cliente = await db.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) throw new Error("Cliente no encontrado");
  await assertAccesoEmpresa(cliente.empresaId);

  const [documentosActivos, proyectosActivos] = await Promise.all([
    db.documento.count({
      where: { clienteId, estado: { notIn: ["FACTURADA", "RECHAZADA", "VENCIDA"] } },
    }),
    db.proyecto.count({ where: { clienteId, activo: true } }),
  ]);

  return { documentosActivos, proyectosActivos };
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

// Tanda 3 del audit crítico: Proyecto era, junto con Activo, el único modelo
// sin bitácora — mismo patrón try/catch-y-loguear que el resto (un fallo de
// auditoría nunca debe tumbar la operación principal).
async function registrarAuditoriaProyecto(datos: {
  proyectoId: string | null;
  clienteId: string;
  empresaId: string;
  accion: "CREADO" | "EDITADO";
  proyectoNombre: string;
  detalle: string;
}) {
  try {
    const actor = await getUsuarioActual();
    await db.proyectoAuditoria.create({
      data: {
        proyectoId: datos.proyectoId,
        clienteId: datos.clienteId,
        empresaId: datos.empresaId,
        accion: datos.accion,
        proyectoNombre: datos.proyectoNombre,
        detalle: datos.detalle,
        usuarioId: actor?.id ?? null,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar auditoría de proyecto:", error);
  }
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

  if (!datos.confirmarDuplicado) {
    const duplicado = await db.proyecto.findFirst({
      where: { clienteId: datos.clienteId, nombre: { equals: datos.nombre, mode: "insensitive" } },
    });
    if (duplicado) {
      throw new Error(
        `${PREFIJO_ERROR_DUPLICADO}${cliente.nombre} ya tiene un proyecto llamado "${duplicado.nombre}". ¿Creás este de todas formas?`,
      );
    }
  }

  const proyecto = await db.proyecto.create({
    data: { clienteId: datos.clienteId, nombre: datos.nombre, activo: datos.activo },
  });
  await registrarAuditoriaProyecto({
    proyectoId: proyecto.id,
    clienteId: cliente.id,
    empresaId: cliente.empresaId,
    accion: "CREADO",
    proyectoNombre: proyecto.nombre,
    detalle: `Proyecto creado para ${cliente.nombre}`,
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
  await registrarAuditoriaProyecto({
    proyectoId: id,
    clienteId: existente.clienteId,
    empresaId: existente.cliente.empresaId,
    accion: "EDITADO",
    proyectoNombre: datos.nombre,
    detalle: diffCampos(existente, { nombre: datos.nombre, activo: datos.activo }, {
      nombre: "Nombre",
      activo: "Activo",
    }),
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

  const nuevoActivo = !existente.activo;
  await db.proyecto.update({
    where: { id },
    data: { activo: nuevoActivo },
  });
  await registrarAuditoriaProyecto({
    proyectoId: id,
    clienteId: existente.clienteId,
    empresaId: existente.cliente.empresaId,
    accion: "EDITADO",
    proyectoNombre: existente.nombre,
    detalle: `Activo: ${existente.activo ? "Sí" : "No"} → ${nuevoActivo ? "Sí" : "No"}`,
  });
  revalidatePath("/clientes");
}
