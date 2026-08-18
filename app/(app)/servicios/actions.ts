"use server";

import { revalidatePath } from "next/cache";
import { assertAccesoEmpresa } from "@/lib/auth";
import { diffCampos } from "@/lib/auditoria";
import { getUsuarioActual } from "@/lib/current-usuario";
import { db } from "@/lib/db";
import { type ServicioInput, servicioSchema } from "@/lib/validations/servicio";

const ETIQUETAS_SERVICIO = {
  empresaId: "Empresa",
  nombre: "Nombre",
  precioFijo: "Precio fijo",
  activo: "Activo",
};

function normalizar(datos: ServicioInput) {
  return {
    empresaId: datos.empresaId,
    nombre: datos.nombre,
    precioFijo: datos.precioFijo,
    activo: datos.activo,
  };
}

async function registrarAuditoriaServicio(datos: {
  servicioId: string | null;
  empresaId: string;
  accion: "CREADO" | "EDITADO";
  servicioNombre: string;
  detalle: string;
}) {
  try {
    const actor = await getUsuarioActual();
    await db.servicioAuditoria.create({
      data: {
        servicioId: datos.servicioId,
        empresaId: datos.empresaId,
        accion: datos.accion,
        servicioNombre: datos.servicioNombre,
        detalle: datos.detalle,
        usuarioId: actor?.id ?? null,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar auditoría de servicio:", error);
  }
}

export async function crearServicio(input: unknown) {
  const datos = servicioSchema.parse(input);
  await assertAccesoEmpresa(datos.empresaId);

  const servicio = await db.servicio.create({ data: normalizar(datos) });
  await registrarAuditoriaServicio({
    servicioId: servicio.id,
    empresaId: servicio.empresaId,
    accion: "CREADO",
    servicioNombre: servicio.nombre,
    detalle: "Servicio creado",
  });
  revalidatePath("/servicios");
}

export async function actualizarServicio(id: string, input: unknown) {
  const datos = servicioSchema.parse(input);

  const existente = await db.servicio.findUnique({ where: { id } });
  if (!existente) throw new Error("Servicio no encontrado");

  await assertAccesoEmpresa(existente.empresaId);
  await assertAccesoEmpresa(datos.empresaId);

  const nuevo = normalizar(datos);
  await db.servicio.update({ where: { id }, data: nuevo });
  await registrarAuditoriaServicio({
    servicioId: id,
    empresaId: nuevo.empresaId,
    accion: "EDITADO",
    servicioNombre: nuevo.nombre,
    detalle: diffCampos(
      { ...existente, precioFijo: Number(existente.precioFijo) },
      nuevo,
      ETIQUETAS_SERVICIO,
    ),
  });
  revalidatePath("/servicios");
}

export async function alternarActivoServicio(id: string) {
  const existente = await db.servicio.findUnique({ where: { id } });
  if (!existente) throw new Error("Servicio no encontrado");

  await assertAccesoEmpresa(existente.empresaId);

  const nuevoActivo = !existente.activo;
  await db.servicio.update({
    where: { id },
    data: { activo: nuevoActivo },
  });
  await registrarAuditoriaServicio({
    servicioId: id,
    empresaId: existente.empresaId,
    accion: "EDITADO",
    servicioNombre: existente.nombre,
    detalle: `Activo: ${existente.activo ? "Sí" : "No"} → ${nuevoActivo ? "Sí" : "No"}`,
  });
  revalidatePath("/servicios");
}
