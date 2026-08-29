import { cookies } from "next/headers";
import { getEmpresasPermitidas } from "@/lib/auth";

// Fase 3.2 — selector de empresa global. La cookie es una PREFERENCIA de
// navegación (comodidad de UI), nunca una fuente de autorización: cada
// lectura acá revalida contra getEmpresasPermitidas() antes de devolver un
// valor. Si la cookie trae una empresa que el usuario ya no tiene permitida
// (o nunca tuvo — por ejemplo, manipulada a mano), se ignora en silencio y
// se vuelve al modo "todas las permitidas", igual que si no hubiera cookie.
export const EMPRESA_ACTIVA_COOKIE = "empresaActivaId";

export async function getEmpresaActivaId(): Promise<string | null> {
  const cookieStore = await cookies();
  const valor = cookieStore.get(EMPRESA_ACTIVA_COOKIE)?.value;
  if (!valor) return null;

  const permitidas = await getEmpresasPermitidas();
  return permitidas.includes(valor) ? valor : null;
}
