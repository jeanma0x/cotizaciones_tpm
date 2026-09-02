"use server";

import { revalidatePath } from "next/cache";
import { assertAccesoEmpresa } from "@/lib/auth";
import { diffCampos } from "@/lib/auditoria";
import { getUsuarioActual } from "@/lib/current-usuario";
import { db } from "@/lib/db";
import { type ActivoInput, activoSchema, TIPO_ACTIVO_LABELS } from "@/lib/validations/activo";

const ETIQUETAS_ACTIVO = {
  empresaId: "Empresa",
  tipo: "Tipo",
  tipoOtroDetalle: "Detalle",
  placa: "Placa",
  modelo: "Modelo",
  marca: "Marca",
  descripcion: "Descripción",
  costo: "Costo",
  valor: "Valor",
  activo: "Activo",
};

function normalizar(datos: ActivoInput) {
  return {
    empresaId: datos.empresaId,
    tipo: datos.tipo,
    // Nunca guardar el detalle si el tipo no es OTRO — evita que quede un
    // residuo de texto huérfano si se cambia de OTRO a otro tipo. Mismo
    // criterio que CostoOperativo.categoriaOtroDetalle.
    tipoOtroDetalle: datos.tipo === "OTRO" ? datos.tipoOtroDetalle || null : null,
    placa: datos.placa || null,
    modelo: datos.modelo || null,
    marca: datos.marca || null,
    descripcion: datos.descripcion || null,
    costo: datos.costo,
    valor: datos.valor,
    activo: datos.activo,
  };
}

// Identificador legible del activo en la bitácora — Activo no tiene un campo
// "nombre" propio (ver activos-table.tsx, mismo criterio ahí).
function nombreActivo(tipo: ActivoInput["tipo"], placa: string | null) {
  return `${TIPO_ACTIVO_LABELS[tipo]}${placa ? ` (${placa})` : ""}`;
}

// Tanda 3 del audit crítico: Activo era, junto con Proyecto, el único modelo
// sin bitácora — mismo patrón try/catch-y-loguear que Cliente/Servicio/Costo
// (un fallo de auditoría nunca debe tumbar la operación principal).
async function registrarAuditoriaActivo(datos: {
  activoId: string | null;
  empresaId: string;
  accion: "CREADO" | "EDITADO";
  activoNombre: string;
  detalle: string;
}) {
  try {
    const actor = await getUsuarioActual();
    await db.activoAuditoria.create({
      data: {
        activoId: datos.activoId,
        empresaId: datos.empresaId,
        accion: datos.accion,
        activoNombre: datos.activoNombre,
        detalle: datos.detalle,
        usuarioId: actor?.id ?? null,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar auditoría de activo:", error);
  }
}

export async function crearActivo(input: unknown) {
  const datos = activoSchema.parse(input);
  await assertAccesoEmpresa(datos.empresaId);

  const normalizado = normalizar(datos);
  const activo = await db.activo.create({ data: normalizado });
  await registrarAuditoriaActivo({
    activoId: activo.id,
    empresaId: activo.empresaId,
    accion: "CREADO",
    activoNombre: nombreActivo(normalizado.tipo, normalizado.placa),
    detalle: "Activo creado",
  });
  revalidatePath("/activos");
}

export async function actualizarActivo(id: string, input: unknown) {
  const datos = activoSchema.parse(input);

  const existente = await db.activo.findUnique({ where: { id } });
  if (!existente) throw new Error("Activo no encontrado");

  await assertAccesoEmpresa(existente.empresaId);
  await assertAccesoEmpresa(datos.empresaId);

  const nuevo = normalizar(datos);
  await db.activo.update({ where: { id }, data: nuevo });
  await registrarAuditoriaActivo({
    activoId: id,
    empresaId: nuevo.empresaId,
    accion: "EDITADO",
    activoNombre: nombreActivo(nuevo.tipo, nuevo.placa),
    detalle: diffCampos(
      { ...existente, costo: Number(existente.costo), valor: Number(existente.valor) },
      nuevo,
      ETIQUETAS_ACTIVO,
    ),
  });
  revalidatePath("/activos");
}

export async function alternarActivoRegistroActivo(id: string) {
  const existente = await db.activo.findUnique({ where: { id } });
  if (!existente) throw new Error("Activo no encontrado");

  await assertAccesoEmpresa(existente.empresaId);

  const nuevoActivo = !existente.activo;
  await db.activo.update({
    where: { id },
    data: { activo: nuevoActivo },
  });
  await registrarAuditoriaActivo({
    activoId: id,
    empresaId: existente.empresaId,
    accion: "EDITADO",
    activoNombre: nombreActivo(existente.tipo, existente.placa),
    detalle: `Activo: ${existente.activo ? "Sí" : "No"} → ${nuevoActivo ? "Sí" : "No"}`,
  });
  revalidatePath("/activos");
}
