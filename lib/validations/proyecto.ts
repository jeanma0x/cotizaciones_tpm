import { z } from "zod";

export const proyectoSchema = z.object({
  clienteId: z.string().min(1, "Falta el cliente"),
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  activo: z.boolean().default(true),
  // No viene del formulario visible — lo pone el cliente al reenviar
  // después de que el usuario confirma explícitamente crear un duplicado
  // (ver crearProyecto en clientes/actions.ts).
  confirmarDuplicado: z.boolean().default(false),
});

export type ProyectoInput = z.infer<typeof proyectoSchema>;
export type ProyectoFormValues = z.input<typeof proyectoSchema>;
