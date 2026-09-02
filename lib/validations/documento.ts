import { z } from "zod";

export const ESTADOS_DOCUMENTO_LABELS: Record<string, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  EN_NEGOCIACION: "En negociación",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
  VENCIDA: "Vencida",
  FACTURADA: "Facturada",
};

// Máquina de estados de Documento — estricta y lineal (confirmado con el
// usuario en el audit crítico): un documento no puede saltar de BORRADOR
// directo a FACTURADA, ni volver atrás desde un estado ya cerrado.
// FACTURADA y RECHAZADA son terminales (no aparecen como llave acá, o sea
// su lista de destinos válidos es vacía). VENCIDA → ENVIADA es la única
// forma de "reactivar" un documento (ej. el cliente responde tarde).
// Compartido entre el servidor (cambiarEstadoDocumento, la fuente de
// verdad) y el cliente (documento-estado-form.tsx, que filtra el <Select>
// para nunca ofrecer una transición que el servidor va a rechazar).
export const TRANSICIONES_ESTADO_VALIDAS: Record<string, string[]> = {
  BORRADOR: ["ENVIADA"],
  ENVIADA: ["EN_NEGOCIACION", "ACEPTADA", "RECHAZADA", "VENCIDA"],
  EN_NEGOCIACION: ["ACEPTADA", "RECHAZADA", "VENCIDA"],
  ACEPTADA: ["FACTURADA"],
  VENCIDA: ["ENVIADA"],
  RECHAZADA: [],
  FACTURADA: [],
};

export const itemDocumentoSchema = z.object({
  cantidad: z.coerce
    .number({ message: "Cantidad inválida" })
    .int("La cantidad debe ser un número entero")
    .positive("La cantidad debe ser mayor a 0"),
  descripcion: z.string().trim().min(1, "La descripción es obligatoria"),
  precioUnitario: z.coerce
    .number({ message: "Precio inválido" })
    .nonnegative("El precio no puede ser negativo"),
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
  // Pedido de Oldemar (WhatsApp, 02/09/26): fecha de calendario directa en
  // vez de un número de días, y realmente opcional — a veces se cotiza un
  // servicio que ya se prestó y no hay nada que "vencer" hacia el futuro.
  validoHasta: z.string().optional().or(z.literal("")),
  condicionesPago: z.string().trim().optional().or(z.literal("")),
  descripcionGeneral: z.string().trim().optional().or(z.literal("")),
  descuento: z.coerce.number().nonnegative("El descuento no puede ser negativo").default(0),
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
