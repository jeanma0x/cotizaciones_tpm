import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function getUsuarioActual() {
  const { userId } = await auth();
  if (!userId) return null;

  return db.usuario.findUnique({
    where: { clerkId: userId },
    include: { empresas: { include: { empresa: true } } },
  });
}
