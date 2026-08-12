import { z } from "zod";

export const invitacionSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  rol: z.enum(["SUPERUSUARIO", "MIEMBRO"]),
  empresaIds: z.array(z.string()).default([]),
});

export type InvitacionInput = z.infer<typeof invitacionSchema>;
export type InvitacionFormValues = z.input<typeof invitacionSchema>;

export const accesoUsuarioSchema = z.object({
  rol: z.enum(["SUPERUSUARIO", "MIEMBRO"]),
  empresaIds: z.array(z.string()).default([]),
});

export type AccesoUsuarioInput = z.infer<typeof accesoUsuarioSchema>;
export type AccesoUsuarioFormValues = z.input<typeof accesoUsuarioSchema>;
