import { z } from "zod";

export const servicioSchema = z.object({
  empresaId: z.string().min(1, "Seleccioná una empresa"),
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  precioFijo: z.coerce
    .number({ message: "Precio inválido" })
    .positive("El precio debe ser mayor a 0"),
  activo: z.boolean().default(true),
  // No viene del formulario visible — lo pone el cliente al reenviar
  // después de que el usuario confirma explícitamente crear un duplicado
  // (ver crearServicio en servicios/actions.ts).
  confirmarDuplicado: z.boolean().default(false),
});

export type ServicioInput = z.infer<typeof servicioSchema>;
// Tipo de entrada del formulario (antes de que z.coerce convierta a number).
export type ServicioFormValues = z.input<typeof servicioSchema>;
