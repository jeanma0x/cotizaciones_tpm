"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { assertSuperusuario } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  type AccesoUsuarioInput,
  accesoUsuarioSchema,
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
  await client.invitations.createInvitation({
    emailAddress: datos.email,
    publicMetadata: { rol: datos.rol, empresaIds: datos.empresaIds },
    redirectUrl: `${protocolo}://${host}/sign-up`,
  });

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
