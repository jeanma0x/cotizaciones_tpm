"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { assertSuperusuario } from "@/lib/auth";
import { getUsuarioActual } from "@/lib/current-usuario";
import { db } from "@/lib/db";
import { mapearErrorPrisma } from "@/lib/prisma-error";
import {
  type AccesoUsuarioInput,
  accesoUsuarioSchema,
  FIRMA_MAX_BYTES,
  type FirmaUsuarioInput,
  firmaUsuarioSchema,
  type InvitacionInput,
  invitacionSchema,
} from "@/lib/validations/usuario";

const ROL_LABELS: Record<string, string> = { SUPERUSUARIO: "Superusuario", MIEMBRO: "Miembro" };

// Bitácora de solo-inserción (mismo criterio que CostoOperativoAuditoria) —
// usuarioId/actorUsuarioId opcionales con SetNull porque cualquiera de los
// dos (el afectado o quien hizo la acción) puede haber sido eliminado más
// adelante; nunca debe tumbar la operación principal si falla.
async function registrarAuditoriaUsuario(datos: {
  usuarioId: string | null;
  usuarioNombre: string;
  usuarioEmail: string;
  accion: "ACCESO_ACTUALIZADO" | "FIRMA_ACTUALIZADA" | "FIRMA_ELIMINADA" | "ELIMINADO";
  detalle: string;
}) {
  try {
    const actor = await getUsuarioActual();
    await db.usuarioAuditoria.create({
      data: {
        usuarioId: datos.usuarioId,
        usuarioNombre: datos.usuarioNombre,
        usuarioEmail: datos.usuarioEmail,
        accion: datos.accion,
        detalle: datos.detalle,
        actorUsuarioId: actor?.id ?? null,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar auditoría de usuario:", error);
  }
}

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

  const usuario = await db.usuario.findUnique({
    where: { id: usuarioId },
    include: { empresas: { include: { empresa: true } } },
  });
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
  await registrarAuditoriaUsuario({
    usuarioId: null, // ya no existe — SetNull lo dejaría igual, pero explícito
    usuarioNombre: usuario.nombre,
    usuarioEmail: usuario.email,
    accion: "ELIMINADO",
    detalle: `Rol: ${ROL_LABELS[usuario.rol]} · Empresas: ${
      usuario.empresas.map((e) => e.empresa.nombre).join(", ") || "ninguna"
    }`,
  });
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

  const usuario = await db.usuario.update({
    where: { id: usuarioId },
    data: { firma: datos.firma },
  });
  await registrarAuditoriaUsuario({
    usuarioId: usuario.id,
    usuarioNombre: usuario.nombre,
    usuarioEmail: usuario.email,
    accion: datos.firma ? "FIRMA_ACTUALIZADA" : "FIRMA_ELIMINADA",
    detalle: datos.firma ? "Firma cargada/reemplazada" : "Firma eliminada",
  });
  revalidatePath("/usuarios");
}

export async function actualizarAccesoUsuario(usuarioId: string, input: unknown) {
  const datos: AccesoUsuarioInput = accesoUsuarioSchema.parse(input);
  await assertSuperusuario();

  const antes = await db.usuario.findUnique({
    where: { id: usuarioId },
    include: { empresas: { include: { empresa: true } } },
  });
  if (!antes) throw new Error("Usuario no encontrado");

  // Tanda 4 del audit crítico: el <select> del formulario ya evita elegir la
  // misma empresa dos veces, pero un envío manipulado a mano sí podría —
  // eso chocaría con @@unique([usuarioId, empresaId]) dentro del mismo
  // createMany. Deduplicar acá es la validación de negocio real; el catch de
  // abajo es solo la red de seguridad si algo igual se cuela.
  const empresaIdsUnicos = Array.from(new Set(datos.empresaIds));

  let usuario;
  try {
    [usuario] = await db.$transaction([
      db.usuario.update({ where: { id: usuarioId }, data: { rol: datos.rol } }),
      db.usuarioEmpresa.deleteMany({ where: { usuarioId } }),
      db.usuarioEmpresa.createMany({
        data: empresaIdsUnicos.map((empresaId) => ({ usuarioId, empresaId })),
      }),
    ]);
  } catch (error) {
    throw mapearErrorPrisma(error);
  }

  const empresasDespues = await db.empresa.findMany({
    where: { id: { in: empresaIdsUnicos } },
    select: { nombre: true },
  });
  const rolAntes = ROL_LABELS[antes.rol];
  const rolDespues = ROL_LABELS[datos.rol];
  const empresasAntesTexto = antes.empresas.map((e) => e.empresa.nombre).sort().join(", ") || "ninguna";
  const empresasDespuesTexto = empresasDespues.map((e) => e.nombre).sort().join(", ") || "ninguna";
  const cambios: string[] = [];
  if (rolAntes !== rolDespues) cambios.push(`Rol: ${rolAntes} → ${rolDespues}`);
  if (empresasAntesTexto !== empresasDespuesTexto) {
    cambios.push(`Empresas: ${empresasAntesTexto} → ${empresasDespuesTexto}`);
  }

  await registrarAuditoriaUsuario({
    usuarioId: usuario.id,
    usuarioNombre: usuario.nombre,
    usuarioEmail: usuario.email,
    accion: "ACCESO_ACTUALIZADO",
    detalle: cambios.length > 0 ? cambios.join(" · ") : "Sin cambios detectados",
  });
  revalidatePath("/usuarios");
}
