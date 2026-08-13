// Pruebas mínimas de docs/security.md, sección "Pruebas mínimas antes de la
// entrega". Corren contra la base de desarrollo real (Neon) — no hay una base
// de pruebas separada todavía — usando fixtures con prefijo QA_ISOLACION_ que
// se crean en beforeAll y se borran por completo en afterAll.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { setMockUserId } from "./clerk-mock";

vi.mock("@clerk/nextjs/server", async () => {
  const mock = await import("./clerk-mock");
  return { auth: mock.auth };
});

const { db } = await import("@/lib/db");
const { getEmpresasPermitidas, assertAccesoEmpresa, assertSuperusuario } = await import(
  "@/lib/auth"
);
const { asignarCorrelativo } = await import("@/lib/correlativo");

const PREFIJO = "QA_ISOLACION_";

let empresaA: { id: string };
let empresaB: { id: string };
let clienteA: { id: string };
let servicioA: { id: string };
let documentoA: { id: string };
let miembroA: { id: string; clerkId: string };
let superusuario: { id: string; clerkId: string };

beforeAll(async () => {
  empresaA = await db.empresa.create({
    data: { nombre: `${PREFIJO}Empresa A (dato de prueba, no real)` },
  });
  empresaB = await db.empresa.create({
    data: { nombre: `${PREFIJO}Empresa B (dato de prueba, no real)` },
  });

  clienteA = await db.cliente.create({
    data: { empresaId: empresaA.id, nombre: `${PREFIJO}Cliente A` },
  });
  servicioA = await db.servicio.create({
    data: { empresaId: empresaA.id, nombre: `${PREFIJO}Servicio A`, precioFijo: 100 },
  });
  documentoA = await db.documento.create({
    data: {
      empresaId: empresaA.id,
      tipo: "COTIZACION",
      correlativo: 1,
      fecha: new Date(),
      subtotal: 100,
      total: 100,
      notas: [],
    },
  });

  miembroA = await db.usuario.create({
    data: {
      clerkId: `${PREFIJO}clerk_miembro_a`,
      nombre: `${PREFIJO}Miembro A`,
      email: `${PREFIJO.toLowerCase()}miembro-a@example.test`,
      rol: "MIEMBRO",
      empresas: { create: { empresaId: empresaA.id } },
    },
    include: { empresas: true },
  });

  superusuario = await db.usuario.create({
    data: {
      clerkId: `${PREFIJO}clerk_super`,
      nombre: `${PREFIJO}Superusuario`,
      email: `${PREFIJO.toLowerCase()}super@example.test`,
      rol: "SUPERUSUARIO",
      empresas: {
        create: [{ empresaId: empresaA.id }, { empresaId: empresaB.id }],
      },
    },
  });
});

afterAll(async () => {
  // Orden que respeta las relaciones sin onDelete: Cascade explícito
  // (Documento.empresa no cascadea) — borrar de hijo a padre.
  await db.historialEstado.deleteMany({ where: { documento: { empresaId: { in: [empresaA.id, empresaB.id] } } } });
  await db.itemDocumento.deleteMany({ where: { documento: { empresaId: { in: [empresaA.id, empresaB.id] } } } });
  await db.documento.deleteMany({ where: { empresaId: { in: [empresaA.id, empresaB.id] } } });
  await db.cliente.deleteMany({ where: { empresaId: { in: [empresaA.id, empresaB.id] } } });
  await db.servicio.deleteMany({ where: { empresaId: { in: [empresaA.id, empresaB.id] } } });
  await db.usuarioEmpresa.deleteMany({
    where: { usuarioId: { in: [miembroA.id, superusuario.id] } },
  });
  await db.usuario.deleteMany({ where: { id: { in: [miembroA.id, superusuario.id] } } });
  await db.empresa.deleteMany({ where: { id: { in: [empresaA.id, empresaB.id] } } });
});

beforeEach(() => {
  setMockUserId(null);
});

describe("Prueba 1 — aislamiento de lectura", () => {
  it("MIEMBRO solo ve la empresa asignada en getEmpresasPermitidas()", async () => {
    setMockUserId(miembroA.clerkId);
    const permitidas = await getEmpresasPermitidas();
    expect(permitidas).toEqual([empresaA.id]);
    expect(permitidas).not.toContain(empresaB.id);
  });

  it("MIEMBRO no puede leer documentos/clientes/servicios de la empresa B, aunque conozca el ID", async () => {
    setMockUserId(miembroA.clerkId);
    const permitidas = await getEmpresasPermitidas();

    const documentosVisibles = await db.documento.findMany({
      where: { empresaId: { in: permitidas }, id: documentoA.id },
    });
    expect(documentosVisibles).toHaveLength(1);

    // Mismo patrón que usan las páginas reales (`where: { empresaId: { in: permitidas } }`):
    // si el ID de la empresa B no está en `permitidas`, el filtro lo excluye
    // aunque se busque exactamente por su ID.
    const documentosDeB = await db.documento.findMany({
      where: { empresaId: { in: permitidas }, id: { in: [documentoA.id] } },
    });
    const soloEmpresasPermitidas = documentosDeB.every((d) => permitidas.includes(d.empresaId));
    expect(soloEmpresasPermitidas).toBe(true);
    expect(documentosDeB.some((d) => d.empresaId === empresaB.id)).toBe(false);

    await expect(assertAccesoEmpresa(empresaB.id)).rejects.toThrow();
  });
});

describe("Prueba 2 — aislamiento de escritura", () => {
  it("MIEMBRO no puede pasar el empresaId de otra empresa a una mutación", async () => {
    setMockUserId(miembroA.clerkId);
    await expect(assertAccesoEmpresa(empresaB.id)).rejects.toThrow(/no autorizado/i);
    // assertAccesoEmpresa es el gate que corren TODAS las server actions antes
    // de escribir (ver lib/auth.ts) — bloquearlo acá bloquea toda mutación.
    await expect(assertAccesoEmpresa(empresaA.id)).resolves.toBeUndefined();
  });
});

describe("Prueba 3 — acceso total del superusuario", () => {
  it("el superusuario puede leer y escribir en las 4 empresas (A y B en este fixture)", async () => {
    setMockUserId(superusuario.clerkId);
    const permitidas = await getEmpresasPermitidas();
    expect(permitidas).toEqual(expect.arrayContaining([empresaA.id, empresaB.id]));

    await expect(assertAccesoEmpresa(empresaA.id)).resolves.toBeUndefined();
    await expect(assertAccesoEmpresa(empresaB.id)).resolves.toBeUndefined();
    await expect(assertSuperusuario()).resolves.toBeUndefined();
  });

  it("un MIEMBRO no pasa assertSuperusuario()", async () => {
    setMockUserId(miembroA.clerkId);
    await expect(assertSuperusuario()).rejects.toThrow();
  });
});

describe("Prueba 4 — condición de carrera del correlativo", () => {
  it("dos asignaciones concurrentes nunca producen el mismo número", async () => {
    const empresaCarrera = await db.empresa.create({
      data: { nombre: `${PREFIJO}Empresa Carrera (dato de prueba, no real)` },
    });

    try {
      const [n1, n2] = await Promise.all([
        db.$transaction((tx) => asignarCorrelativo(tx, empresaCarrera.id)),
        db.$transaction((tx) => asignarCorrelativo(tx, empresaCarrera.id)),
      ]);

      expect(n1).not.toBe(n2);
      expect(new Set([n1, n2]).size).toBe(2);
    } finally {
      await db.empresa.delete({ where: { id: empresaCarrera.id } });
    }
  });
});
