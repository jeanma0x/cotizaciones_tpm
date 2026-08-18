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

// Tamaño máximo del archivo ORIGINAL (no del data URI en base64, que pesa
// ~37% más) — 300KB de sobra para una foto/escaneo de una firma real.
export const FIRMA_MAX_BYTES = 300 * 1024;

export const firmaUsuarioSchema = z.object({
  // null = quitar la firma existente. String = nuevo data URI a guardar.
  firma: z
    .string()
    .regex(
      /^data:image\/(png|jpeg);base64,/,
      "La firma debe ser una imagen PNG o JPEG",
    )
    .nullable(),
});

export type FirmaUsuarioInput = z.infer<typeof firmaUsuarioSchema>;
