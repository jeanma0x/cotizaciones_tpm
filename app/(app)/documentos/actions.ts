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

export async function crearDocumento(input: unknown) {
  const datos = documentoSchema.parse(input);
  await assertAccesoEmpresa(datos.empresaId);
  await assertClienteDeEmpresa(datos.clienteId, datos.empresaId);

  const { subtotal, total } = calcularTotales(datos.items, datos.descuento);

  const documento = await db.$transaction(async (tx) => {
    const correlativo = await asignarCorrelativo(tx, datos.empresaId);

    return tx.documento.create({
      data: {
        empresaId: datos.empresaId,
        tipo: datos.tipo,
        correlativo,
        clienteId: datos.clienteId,
        fecha: new Date(datos.fecha),
        vigenciaDias: datos.vigenciaDias,
        condicionesPago: datos.condicionesPago || null,
        descripcionGeneral: datos.descripcionGeneral || null,
        subtotal,
        descuento: datos.descuento,
        total,
        notas: datos.notas,
        anexos: datos.tipo === "PROPUESTA" ? datos.anexos : undefined,
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
  // La empresa de un documento no cambia después de creado: el correlativo
  // ya quedó asignado dentro de esa empresa.
  await assertClienteDeEmpresa(datos.clienteId, existente.empresaId);

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
        fecha: new Date(datos.fecha),
        vigenciaDias: datos.vigenciaDias,
        condicionesPago: datos.condicionesPago || null,
        descripcionGeneral: datos.descripcionGeneral || null,
        subtotal,
        descuento: datos.descuento,
        total,
        notas: datos.notas,
        anexos: datos.tipo === "PROPUESTA" ? datos.anexos : undefined,
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
