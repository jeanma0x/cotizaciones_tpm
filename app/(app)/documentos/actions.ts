"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAccesoEmpresa } from "@/lib/auth";
import { asignarCorrelativo } from "@/lib/correlativo";
import { getUsuarioActual } from "@/lib/current-usuario";
import { db } from "@/lib/db";
import {
  type DocumentoInput,
  documentoSchema,
  ESTADOS_DOCUMENTO_LABELS,
  TRANSICIONES_ESTADO_VALIDAS,
} from "@/lib/validations/documento";

function calcularTotales(items: DocumentoInput["items"], descuento: number) {
  const subtotal = items.reduce(
    (acc, item) => acc + item.cantidad * item.precioUnitario,
    0,
  );
  return { subtotal, total: subtotal - descuento };
}

async function assertClienteDeEmpresa(clienteId: string, empresaId: string) {
  const cliente = await db.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente || cliente.empresaId !== empresaId) {
    throw new Error("El cliente no pertenece a la empresa seleccionada");
  }
}

// Fase 3.3 — "" (sin proyecto elegido) es válido y no se valida acá. Un
// documento no puede asociarse a un proyecto de un cliente distinto al
// suyo — regla explícita del alcance de la Fase 3, nunca confiar en que el
// <select> del formulario ya lo filtró por cliente.
async function assertProyectoDeCliente(proyectoId: string, clienteId: string) {
  if (!proyectoId) return;
  const proyecto = await db.proyecto.findUnique({ where: { id: proyectoId } });
  if (!proyecto || proyecto.clienteId !== clienteId) {
    throw new Error("El proyecto elegido no pertenece al cliente de este documento");
  }
}

// "" (sin firmante elegido) es válido y no se valida acá — nunca confiar
// solo en que el <select> del formulario ya lo filtró por empresa.
async function assertFirmanteDeEmpresa(firmanteUsuarioId: string, empresaId: string) {
  if (!firmanteUsuarioId) return;
  const acceso = await db.usuarioEmpresa.findFirst({
    where: { usuarioId: firmanteUsuarioId, empresaId },
  });
  if (!acceso) {
    throw new Error("El firmante elegido no tiene acceso a esta empresa");
  }
}

function datosFirma(datos: DocumentoInput) {
  return {
    firmanteUsuarioId: datos.firmanteUsuarioId || null,
    nombreResponsable: datos.nombreResponsable || null,
    fechaAceptacion: datos.fechaAceptacion ? new Date(datos.fechaAceptacion) : null,
  };
}

export async function crearDocumento(input: unknown) {
  const datos = documentoSchema.parse(input);
  await assertAccesoEmpresa(datos.empresaId);
  await assertClienteDeEmpresa(datos.clienteId, datos.empresaId);
  await assertProyectoDeCliente(datos.proyectoId ?? "", datos.clienteId);
  await assertFirmanteDeEmpresa(datos.firmanteUsuarioId ?? "", datos.empresaId);

  const { subtotal, total } = calcularTotales(datos.items, datos.descuento);

  const documento = await db.$transaction(async (tx) => {
    const correlativo = await asignarCorrelativo(tx, datos.empresaId);

    return tx.documento.create({
      data: {
        empresaId: datos.empresaId,
        tipo: datos.tipo,
        correlativo,
        clienteId: datos.clienteId,
        proyectoId: datos.proyectoId || null,
        fecha: new Date(datos.fecha),
        vigenciaDias: datos.vigenciaDias,
        condicionesPago: datos.condicionesPago || null,
        descripcionGeneral: datos.descripcionGeneral || null,
        subtotal,
        descuento: datos.descuento,
        total,
        notas: datos.notas,
        anexos: datos.tipo === "PROPUESTA" ? datos.anexos : undefined,
        ...datosFirma(datos),
        items: {
          create: datos.items.map((item, i) => ({ ...item, orden: i })),
        },
        historial: {
          create: { estado: "BORRADOR" },
        },
      },
    });
  });

  revalidatePath("/documentos");
  redirect(`/documentos/${documento.id}`);
}

export async function actualizarDocumento(id: string, input: unknown) {
  const datos = documentoSchema.parse(input);

  const existente = await db.documento.findUnique({ where: { id } });
  if (!existente) throw new Error("Documento no encontrado");
  await assertAccesoEmpresa(existente.empresaId);
  // Un documento ya facturado es un hecho consumado (ver docs/security.md,
  // "nunca se pierde el historial") — editarlo reescribiría lo que el
  // cliente ya recibió como cobro real. Duplicar (DuplicarDocumentoButton)
  // es la vía correcta si hace falta una versión nueva.
  if (existente.estado === "FACTURADA") {
    throw new Error(
      "Este documento ya fue facturado y no se puede editar — duplicalo si necesitás una versión nueva.",
    );
  }
  // La empresa de un documento no cambia después de creado: el correlativo
  // ya quedó asignado dentro de esa empresa.
  await assertClienteDeEmpresa(datos.clienteId, existente.empresaId);
  await assertProyectoDeCliente(datos.proyectoId ?? "", datos.clienteId);
  await assertFirmanteDeEmpresa(datos.firmanteUsuarioId ?? "", existente.empresaId);

  const { subtotal, total } = calcularTotales(datos.items, datos.descuento);

  // Punto 4, ronda de cierre de huecos: con dos usuarios operando el mismo
  // documento, editar cantidad/precio/descripción de un ítem ya guardado no
  // dejaba ningún rastro — un hueco de confianza real, no solo un detalle.
  // Entrada genérica (no diff campo por campo todavía): basta con que quede
  // registrado que pasó, cuándo y quién. Reutiliza el estado actual porque
  // esta acción no cambia el estado del documento, solo su contenido.
  const usuarioActual = await getUsuarioActual();

  await db.$transaction(async (tx) => {
    await tx.itemDocumento.deleteMany({ where: { documentoId: id } });
    await tx.documento.update({
      where: { id },
      data: {
        tipo: datos.tipo,
        clienteId: datos.clienteId,
        proyectoId: datos.proyectoId || null,
        fecha: new Date(datos.fecha),
        vigenciaDias: datos.vigenciaDias,
        condicionesPago: datos.condicionesPago || null,
        descripcionGeneral: datos.descripcionGeneral || null,
        subtotal,
        descuento: datos.descuento,
        total,
        notas: datos.notas,
        anexos: datos.tipo === "PROPUESTA" ? datos.anexos : undefined,
        ...datosFirma(datos),
        items: {
          create: datos.items.map((item, i) => ({ ...item, orden: i })),
        },
      },
    });
    await tx.historialEstado.create({
      data: {
        documentoId: id,
        estado: existente.estado,
        nota: `Documento editado por ${usuarioActual?.nombre ?? "un usuario"}`,
      },
    });
  });

  revalidatePath("/documentos");
  revalidatePath(`/documentos/${id}`);
  redirect(`/documentos/${id}`);
}

export async function cambiarEstadoDocumento(
  id: string,
  nuevoEstado: string,
  nota?: string,
) {
  const existente = await db.documento.findUnique({ where: { id } });
  if (!existente) throw new Error("Documento no encontrado");
  await assertAccesoEmpresa(existente.empresaId);

  const estado = nuevoEstado as
    | "BORRADOR"
    | "ENVIADA"
    | "EN_NEGOCIACION"
    | "ACEPTADA"
    | "RECHAZADA"
    | "VENCIDA"
    | "FACTURADA";

  // Máquina de estados (ver lib/validations/documento.ts): nunca confiar en
  // que el <Select> del cliente ya filtró las opciones válidas — si
  // llegara un estado manipulado a mano (o un cliente desactualizado), el
  // servidor es la fuente de verdad final.
  const transicionesValidas = TRANSICIONES_ESTADO_VALIDAS[existente.estado] ?? [];
  if (!transicionesValidas.includes(estado)) {
    throw new Error(
      `No se puede pasar de "${ESTADOS_DOCUMENTO_LABELS[existente.estado] ?? existente.estado}" a "${ESTADOS_DOCUMENTO_LABELS[estado] ?? estado}".`,
    );
  }

  await db.$transaction([
    db.documento.update({ where: { id }, data: { estado } }),
    db.historialEstado.create({
      data: { documentoId: id, estado, nota: nota || null },
    }),
  ]);

  revalidatePath(`/documentos/${id}`);
  revalidatePath("/documentos");
}

export async function duplicarDocumento(id: string) {
  const original = await db.documento.findUnique({
    where: { id },
    include: { items: { orderBy: { orden: "asc" } } },
  });
  if (!original) throw new Error("Documento no encontrado");
  await assertAccesoEmpresa(original.empresaId);

  const nuevo = await db.$transaction(async (tx) => {
    const correlativo = await asignarCorrelativo(tx, original.empresaId);

    return tx.documento.create({
      data: {
        empresaId: original.empresaId,
        tipo: original.tipo,
        correlativo,
        clienteId: original.clienteId,
        fecha: new Date(),
        vigenciaDias: original.vigenciaDias,
        condicionesPago: original.condicionesPago,
        descripcionGeneral: original.descripcionGeneral,
        subtotal: original.subtotal,
        descuento: original.descuento,
        total: original.total,
        notas: original.notas ?? [],
        anexos: original.anexos ?? undefined,
        duplicadoDeId: original.id,
        items: {
          create: original.items.map((item, i) => ({
            cantidad: item.cantidad,
            descripcion: item.descripcion,
            precioUnitario: item.precioUnitario,
            orden: i,
          })),
        },
        historial: {
          create: { estado: "BORRADOR", nota: `Duplicado de ${original.correlativo}` },
        },
      },
    });
  });

  revalidatePath("/documentos");
  redirect(`/documentos/${nuevo.id}`);
}

// Punto 2, ronda de cierre de huecos: convertir una cotización/propuesta ya
// aceptada en factura sin retipear nada. Mismo patrón que duplicarDocumento
// (correlativo nuevo, mismos ítems/totales) pero además: cambia el tipo a
// FACTURA, y deja un registro cruzado en el historial de AMBOS documentos —
// no solo en el nuevo — para que quede trazable cuál factura salió de cuál
// cotización y viceversa (ver docs/data-model.md, "nunca se pierde el
// historial").
export async function convertirAFactura(id: string) {
  const original = await db.documento.findUnique({
    where: { id },
    include: { items: { orderBy: { orden: "asc" } } },
  });
  if (!original) throw new Error("Documento no encontrado");
  await assertAccesoEmpresa(original.empresaId);

  if (original.tipo === "FACTURA") {
    throw new Error("Este documento ya es una factura");
  }
  if (original.estado !== "ACEPTADA") {
    throw new Error("Solo se puede convertir a factura una cotización o propuesta aceptada");
  }

  const nuevo = await db.$transaction(async (tx) => {
    const correlativo = await asignarCorrelativo(tx, original.empresaId);

    const factura = await tx.documento.create({
      data: {
        empresaId: original.empresaId,
        tipo: "FACTURA",
        correlativo,
        clienteId: original.clienteId,
        fecha: new Date(),
        vigenciaDias: original.vigenciaDias,
        condicionesPago: original.condicionesPago,
        descripcionGeneral: original.descripcionGeneral,
        subtotal: original.subtotal,
        descuento: original.descuento,
        total: original.total,
        notas: original.notas ?? [],
        // anexos solo aplica a propuestas (ver schema.prisma) — una factura
        // nunca los lleva, aunque el documento original fuera una propuesta.
        duplicadoDeId: original.id,
        items: {
          create: original.items.map((item, i) => ({
            cantidad: item.cantidad,
            descripcion: item.descripcion,
            precioUnitario: item.precioUnitario,
            orden: i,
          })),
        },
        historial: {
          create: {
            estado: "BORRADOR",
            nota: `Generada a partir de la cotización TPM-${original.correlativo}`,
          },
        },
      },
    });

    await tx.documento.update({
      where: { id: original.id },
      data: { estado: "FACTURADA" },
    });
    await tx.historialEstado.create({
      data: {
        documentoId: original.id,
        estado: "FACTURADA",
        nota: `Facturada como TPM-${factura.correlativo}`,
      },
    });

    return factura;
  });

  revalidatePath("/documentos");
  revalidatePath(`/documentos/${original.id}`);
  redirect(`/documentos/${nuevo.id}`);
}
