"use server";

import { cookies } from "next/headers";
import { assertAccesoEmpresa } from "@/lib/auth";
import { EMPRESA_ACTIVA_COOKIE } from "@/lib/empresa-activa";

// Fase 3.2 — selector de empresa global. `null` significa "todas las
// empresas permitidas" (borra la cookie). Un id revalida SIEMPRE contra
// assertAccesoEmpresa antes de guardarse — el <Select> del cliente ya
// filtra a las empresas permitidas, pero esta acción no confía en eso: si
// alguien llamara esta acción directamente con un empresaId ajeno, se
// rechaza acá igual que en cualquier otra mutación del sistema.
export async function establecerEmpresaActiva(empresaId: string | null) {
  const cookieStore = await cookies();

  if (empresaId === null) {
    cookieStore.delete(EMPRESA_ACTIVA_COOKIE);
    return;
  }

  await assertAccesoEmpresa(empresaId);

  cookieStore.set(EMPRESA_ACTIVA_COOKIE, empresaId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
