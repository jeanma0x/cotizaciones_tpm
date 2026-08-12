import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

// Sincroniza la creación de usuarios de Clerk con nuestra tabla propia
// (docs/security.md: rol y empresa viven en nuestra DB, no en metadata de
// Clerk). El rol/empresa que el superusuario eligió al invitar viajan en
// publicMetadata de la invitación — si vienen, se aplican de una vez; si no
// (por ejemplo, un usuario preexistente sin invitación), queda MIEMBRO sin
// ninguna empresa asignada hasta que el superusuario lo asigne manualmente
// desde /usuarios.
export async function POST(request: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(request);
  } catch {
    return new Response("Firma inválida", { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name, public_metadata } =
      evt.data;
    const email = email_addresses[0]?.email_address ?? "";
    const nombre = [first_name, last_name].filter(Boolean).join(" ") || email;

    const metadata = public_metadata as { rol?: string; empresaIds?: string[] };
    const rol = metadata?.rol === "SUPERUSUARIO" ? "SUPERUSUARIO" : "MIEMBRO";

    const usuario = await db.usuario.upsert({
      where: { clerkId: id },
      update: {},
      create: { clerkId: id, email, nombre, rol },
    });

    const empresaIds = Array.isArray(metadata?.empresaIds) ? metadata.empresaIds : [];
    for (const empresaId of empresaIds) {
      const empresaExiste = await db.empresa.findUnique({ where: { id: empresaId } });
      if (!empresaExiste) continue;
      await db.usuarioEmpresa.upsert({
        where: { usuarioId_empresaId: { usuarioId: usuario.id, empresaId } },
        update: {},
        create: { usuarioId: usuario.id, empresaId },
      });
    }
  }

  return new Response("ok", { status: 200 });
}
