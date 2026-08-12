import { z } from "zod";

export const clienteSchema = z.object({
  empresaId: z.string().min(1, "Seleccioná una empresa"),
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
  activo: z.boolean().default(true),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
// Tipo de entrada del formulario (antes de aplicar el default de `activo`).
export type ClienteFormValues = z.input<typeof clienteSchema>;
