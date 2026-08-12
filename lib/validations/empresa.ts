import { z } from "zod";

export const empresaSchema = z.object({
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
  moneda: z.enum(["GTQ", "USD"]),
});

export type EmpresaInput = z.infer<typeof empresaSchema>;
