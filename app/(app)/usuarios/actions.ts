"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { assertSuperusuario } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  type AccesoUsuarioInput,
  accesoUsuarioSchema,
  FIRMA_MAX_BYTES,
  type FirmaUsuarioInput,
  firmaUsuarioSchema,
  type InvitacionInput,
  invitacionSchema,
} from "@/lib/validations/usuario";

export async function invitarUsuario(input: unknown) {
  const datos: InvitacionInput = invitacionSchema.parse(input);
  await assertSuperusuario();

  // Sin redirectUrl, Clerk manda al usuario invitado a su "Account Portal"
  // genérico en vez de a nuestras propias páginas de sign-up/sign-in.
  const headersList = await headers();
  const host = headersList.get("host");
  const protocolo = host?.includes("localhost") ? "http" : "https";

  const client = await clerkClient();
  try {
    await client.invitations.createInvitation({
      emailAddress: datos.email,
      publicMetadata: { rol: datos.rol, empresaIds: datos.empresaIds },
      redirectUrl: `${protocolo}://${host}/sign-up`,
    });
  } catch (error) {
    const yaExiste =
      error instanceof Error &&
      "errors" in error &&
      Array.isArray((error as { errors?: unknown[] }).errors) &&
      (error as { errors: unknown[] }).errors.some(
        (e) =>
          typeof e === "object" &&
          e !== null &&
          "code" in e &&
          ((e as { code?: string }).code === "duplicate_record" ||
            (e as { code?: string }).code === "form_identifier_exists"),
      );
    if (yaExiste) {
      throw new Error(
        "Ese correo ya tiene una cuenta en el sistema. Usá \"Editar acceso\" en su fila de la tabla en vez de invitarlo de nuevo.",
      );
    }
    throw new Error("No se pudo enviar la invitación. Intentá de nuevo.");
  }

  revalidatePath("/usuarios");
}

export async function eliminarUsuario(usuarioId: string) {
  await assertSuperusuario();

  const usuario = await db.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) throw new Error("Usuario no encontrado");

  const { userId } = await auth();
  if (usuario.clerkId === userId) {
    throw new Error("No podés eliminar tu propia cuenta");
  }

  const client = await clerkClient();
  try {
    await client.users.deleteUser(usuario.clerkId);
  } catch {
    // Si ya no existe en Clerk (por ejemplo, borrado a mano), igual limpiamos
    // nuestra tabla — no bloquear la eliminación por esto.
  }

  await db.usuario.delete({ where: { id: usuarioId } });
  revalidatePath("/usuarios");
}

export async function actualizarFirmaUsuario(usuarioId: string, input: unknown) {
  const datos: FirmaUsuarioInput = firmaUsuarioSchema.parse(input);
  await assertSuperusuario();

  if (datos.firma) {
    // El regex del schema ya garantiza el prefijo data:image/...;base64, —
    // acá solo queda medir el tamaño real decodificado (nunca confiar en el
    // tamaño que reporta el cliente). base64 pesa ~4/3 del binario original,
    // así que se decodifica para comparar contra el límite real en bytes.
    const base64 = datos.firma.split(",")[1] ?? "";
    const bytes = Math.floor((base64.length * 3) / 4);
    if (bytes > FIRMA_MAX_BYTES) {
      throw new Error(
        `La imagen pesa demasiado (máximo ${Math.round(FIRMA_MAX_BYTES / 1024)}KB) — subí una versión más liviana.`,
      );
    }
  }

  await db.usuario.update({ where: { id: usuarioId }, data: { firma: datos.firma } });
  revalidatePath("/usuarios");
}

export async function actualizarAccesoUsuario(usuarioId: string, input: unknown) {
  const datos: AccesoUsuarioInput = accesoUsuarioSchema.parse(input);
  await assertSuperusuario();

  await db.$transaction([
    db.usuario.update({ where: { id: usuarioId }, data: { rol: datos.rol } }),
    db.usuarioEmpresa.deleteMany({ where: { usuarioId } }),
    db.usuarioEmpresa.createMany({
      data: datos.empresaIds.map((empresaId) => ({ usuarioId, empresaId })),
    }),
  ]);

  revalidatePath("/usuarios");
}
