import { z } from "zod";

// Un contacto de un cliente EMPRESA (ver TipoCliente en schema.prisma) — a
// quién se le manda la cotización ese mes, no necesariamente siempre la
// misma persona bajo el mismo NIT (caso CMI, reunión con Oldemar 14/08).
export const contactoClienteSchema = z.object({
  id: z.string().optional(), // presente al editar un contacto ya guardado
  nombre: z.string().trim().min(1, "El nombre del contacto es obligatorio"),
  email: z.string().trim().email("Correo inválido"),
});

export const clienteSchema = z.object({
  empresaId: z.string().min(1, "Seleccioná una empresa"),
  tipo: z.enum(["INDIVIDUAL", "EMPRESA"]).default("INDIVIDUAL"),
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  nit: z.string().trim().optional().or(z.literal("")),
  direccion: z.string().trim().optional().or(z.literal("")),
  contacto: z.string().trim().optional().or(z.literal("")),
  telefono: z.string().trim().optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Correo inválido")
    .optional()
    .or(z.literal("")),
  // Solo se llena si el WhatsApp real de este cliente es de un país
  // distinto al de su empresa — vacío usa el código de la empresa.
  codigoPais: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, "Solo dígitos, sin '+' (ej. 502)")
    .optional()
    .or(z.literal("")),
  activo: z.boolean().default(true),
  // Solo se usa/guarda cuando tipo === "EMPRESA".
  contactos: z.array(contactoClienteSchema).default([]),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
// Tipo de entrada del formulario (antes de aplicar los defaults).
export type ClienteFormValues = z.input<typeof clienteSchema>;
export type ContactoClienteInput = z.infer<typeof contactoClienteSchema>;
