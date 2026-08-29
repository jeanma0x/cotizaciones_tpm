import { z } from "zod";

export const itemDocumentoSchema = z.object({
  cantidad: z.coerce
    .number({ message: "Cantidad inválida" })
    .int("La cantidad debe ser un número entero")
    .positive(),
  descripcion: z.string().trim().min(1, "La descripción es obligatoria"),
  precioUnitario: z.coerce.number({ message: "Precio inválido" }).nonnegative(),
});

export const notaSchema = z.object({
  titulo: z.string().trim().min(1, "El título de la nota es obligatorio"),
  texto: z.string().trim().min(1, "El texto de la nota es obligatorio"),
});

export const documentoSchema = z.object({
  empresaId: z.string().min(1, "Seleccioná una empresa"),
  tipo: z.enum(["COTIZACION", "PROPUESTA", "FACTURA"]),
  clienteId: z.string().min(1, "Seleccioná un cliente"),
  // Fase 3.3 — opcional: "" = sin proyecto específico (el documento queda
  // ligado solo al cliente en general), mismo criterio que firmanteUsuarioId.
  proyectoId: z.string().optional().or(z.literal("")),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  vigenciaDias: z.coerce.number().int().positive().optional(),
  condicionesPago: z.string().trim().optional().or(z.literal("")),
  descripcionGeneral: z.string().trim().optional().or(z.literal("")),
  descuento: z.coerce.number().nonnegative().default(0),
  items: z.array(itemDocumentoSchema).min(1, "Agregá al menos un ítem"),
  notas: z.array(notaSchema).default([]),
  anexos: z.array(z.string().trim().min(1)).default([]),
  // "" = sin firma automática (imprimir y firmar a mano) — igual criterio
  // que clienteId/empresaId de más arriba, un string vacío es "sin elegir".
  firmanteUsuarioId: z.string().optional().or(z.literal("")),
  nombreResponsable: z.string().trim().optional().or(z.literal("")),
  fechaAceptacion: z.string().optional().or(z.literal("")),
});

export type DocumentoInput = z.infer<typeof documentoSchema>;
export type DocumentoFormValues = z.input<typeof documentoSchema>;
