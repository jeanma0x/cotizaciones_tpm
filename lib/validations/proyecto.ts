import { z } from "zod";

export const proyectoSchema = z.object({
  clienteId: z.string().min(1, "Falta el cliente"),
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  activo: z.boolean().default(true),
});

export type ProyectoInput = z.infer<typeof proyectoSchema>;
export type ProyectoFormValues = z.input<typeof proyectoSchema>;
