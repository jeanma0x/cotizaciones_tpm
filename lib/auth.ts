import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function getEmpresasPermitidas(): Promise<string[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

  const usuario = await db.usuario.findUnique({
    where: { clerkId: userId },
    include: { empresas: true },
  });
  if (!usuario) throw new Error("Usuario no encontrado");

  return usuario.empresas.map((ue) => ue.empresaId);
}

export async function assertAccesoEmpresa(empresaId: string) {
  const permitidas = await getEmpresasPermitidas();
  if (!permitidas.includes(empresaId)) {
    throw new Error("No autorizado para esta empresa");
  }
}

// Restringe acciones/pantallas reservadas al rol SUPERUSUARIO (ej. gestión de
// empresas). No reemplaza assertAccesoEmpresa — son chequeos independientes.
export async function assertSuperusuario() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

  const usuario = await db.usuario.findUnique({ where: { clerkId: userId } });
  if (!usuario || usuario.rol !== "SUPERUSUARIO") {
    throw new Error("No autorizado");
  }
}
