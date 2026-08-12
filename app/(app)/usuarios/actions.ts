"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
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

  const client = await clerkClient();
  await client.invitations.createInvitation({
    emailAddress: datos.email,
    publicMetadata: { rol: datos.rol, empresaIds: datos.empresaIds },
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
