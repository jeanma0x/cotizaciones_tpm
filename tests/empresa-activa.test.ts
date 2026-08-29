// Fase 3.2 — verificación de que el selector de empresa global nunca es una
// vía de autorización: la cookie "empresaActivaId" es solo una preferencia
// de navegación, revalidada contra empresasPermitidas en cada lectura y en
// la server action que la escribe. Mismo patrón de fixtures/mock que
// tests/security.test.ts (prefijo QA_ISOLACION_, clerk-mock).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { setMockUserId } from "./clerk-mock";
import { clearMockCookies, setMockCookie } from "./cookies-mock";

vi.mock("@clerk/nextjs/server", async () => {
  const mock = await import("./clerk-mock");
  return { auth: mock.auth };
});
vi.mock("next/headers", async () => {
  const mock = await import("./cookies-mock");
  return { cookies: mock.cookies };
});

const { db } = await import("@/lib/db");
const { getEmpresaActivaId, EMPRESA_ACTIVA_COOKIE } = await import("@/lib/empresa-activa");
const { establecerEmpresaActiva } = await import("@/app/(app)/actions");

const PREFIJO = "QA_ISOLACION_EMPRESA_ACTIVA_";

let empresaA: { id: string };
let empresaB: { id: string };
let miembroA: { id: string; clerkId: string };

beforeAll(async () => {
  empresaA = await db.empresa.create({
    data: { nombre: `${PREFIJO}Empresa A (dato de prueba, no real)` },
  });
  empresaB = await db.empresa.create({
    data: { nombre: `${PREFIJO}Empresa B (dato de prueba, no real)` },
  });
  miembroA = await db.usuario.create({
    data: {
      clerkId: `${PREFIJO}clerk_miembro_a`,
      nombre: `${PREFIJO}Miembro A`,
      email: `${PREFIJO.toLowerCase()}miembro-a@example.test`,
      rol: "MIEMBRO",
      empresas: { create: { empresaId: empresaA.id } },
    },
  });
});

afterAll(async () => {
  await db.usuarioEmpresa.deleteMany({ where: { usuarioId: miembroA.id } });
  await db.usuario.deleteMany({ where: { id: miembroA.id } });
  await db.empresa.deleteMany({ where: { id: { in: [empresaA.id, empresaB.id] } } });
});

beforeEach(() => {
  setMockUserId(null);
  clearMockCookies();
});
afterEach(() => {
  clearMockCookies();
});

describe("establecerEmpresaActiva — nunca confía en el cliente", () => {
  it("rechaza establecer una empresa que el usuario no tiene permitida", async () => {
    setMockUserId(miembroA.clerkId);
    await expect(establecerEmpresaActiva(empresaB.id)).rejects.toThrow(/no autorizado/i);
    // La cookie nunca debió escribirse tras el rechazo.
    expect(await getEmpresaActivaId()).toBeNull();
  });

  it("acepta y guarda una empresa que el usuario sí tiene permitida", async () => {
    setMockUserId(miembroA.clerkId);
    await establecerEmpresaActiva(empresaA.id);
    expect(await getEmpresaActivaId()).toBe(empresaA.id);
  });

  it("null borra la preferencia (modo 'todas las permitidas')", async () => {
    setMockUserId(miembroA.clerkId);
    await establecerEmpresaActiva(empresaA.id);
    expect(await getEmpresaActivaId()).toBe(empresaA.id);
    await establecerEmpresaActiva(null);
    expect(await getEmpresaActivaId()).toBeNull();
  });
});

describe("getEmpresaActivaId — revalida la cookie en cada lectura, nunca confía ciegamente", () => {
  it("ignora una cookie manipulada a mano con una empresa no permitida", async () => {
    setMockUserId(miembroA.clerkId);
    // Simula una cookie alterada sin pasar por establecerEmpresaActiva —
    // exactamente el escenario contra el que el selector global debe blindar.
    setMockCookie(EMPRESA_ACTIVA_COOKIE, empresaB.id);
    expect(await getEmpresaActivaId()).toBeNull();
  });

  it("devuelve el valor solo si sigue estando entre las empresas permitidas", async () => {
    setMockUserId(miembroA.clerkId);
    setMockCookie(EMPRESA_ACTIVA_COOKIE, empresaA.id);
    expect(await getEmpresaActivaId()).toBe(empresaA.id);
  });
});
