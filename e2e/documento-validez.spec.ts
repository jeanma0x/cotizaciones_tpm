import { expect, test } from "@playwright/test";
import { db } from "@/lib/db";
import { asignarCorrelativo } from "@/lib/correlativo";
import { cambiarEmpresaActiva } from "./helpers";

// Regresión de un pedido de Oldemar por WhatsApp (02/09/26): "Oferta válida
// hasta" pasa de un número de días (que rechazaba 0) a una fecha de
// calendario directa, realmente opcional — a veces se cotiza un servicio
// que ya se prestó y no hay nada que "vencer" hacia el futuro. Ver
// lib/validations/documento.ts (validoHasta) y el comentario en
// schema.prisma.
const EMPRESA_QA_ID = "cmtdyzqot00008og7m0aya14r";
const EMPRESA_QA = "QA_PLAYWRIGHT_Empresa de Pruebas (dato de prueba, no real)";
const SUFIJO = Date.now();
const NOMBRE_CLIENTE = `QA_PLAYWRIGHT_Cliente Validez ${SUFIJO}`;

let clienteId: string;
let documentoSinVigenciaId: string;

test.beforeAll(async () => {
  const cliente = await db.cliente.create({
    data: { empresaId: EMPRESA_QA_ID, nombre: NOMBRE_CLIENTE },
  });
  clienteId = cliente.id;

  const documento = await db.$transaction(async (tx) => {
    const correlativo = await asignarCorrelativo(tx, EMPRESA_QA_ID);
    return tx.documento.create({
      data: {
        empresaId: EMPRESA_QA_ID,
        tipo: "COTIZACION",
        correlativo,
        clienteId,
        fecha: new Date(),
        validoHasta: null,
        subtotal: 100,
        total: 100,
        notas: [],
        estado: "BORRADOR",
        items: { create: [{ cantidad: 1, descripcion: "QA validez item", precioUnitario: 100, orden: 0 }] },
      },
    });
  });
  documentoSinVigenciaId = documento.id;
});

test.afterAll(async () => {
  const documentos = await db.documento.findMany({ where: { clienteId }, select: { id: true } });
  for (const { id } of documentos) {
    await db.itemDocumento.deleteMany({ where: { documentoId: id } });
    await db.historialEstado.deleteMany({ where: { documentoId: id } });
  }
  await db.documento.deleteMany({ where: { clienteId } });
  await db.cliente.delete({ where: { id: clienteId } });
});

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await cambiarEmpresaActiva(page, EMPRESA_QA);
});

test("Documento sin 'Válido hasta' no muestra la línea de vigencia en el resumen", async ({ page }) => {
  await page.goto(`/documentos/${documentoSinVigenciaId}`);
  await expect(page.getByText("Válido hasta")).not.toBeVisible();
});

test("Crear un documento sin 'Válido hasta' — queda opcional, sin error de validación", async ({ page }) => {
  await page.goto("/documentos/nuevo");
  await page.getByPlaceholder("Buscá un cliente por nombre…").click();
  await page.getByPlaceholder("Buscá un cliente por nombre…").fill(NOMBRE_CLIENTE);
  await page.getByRole("option", { name: NOMBRE_CLIENTE }).click();
  await page.locator('textarea[name="items.0.descripcion"]').fill("QA_PLAYWRIGHT ítem sin vigencia");
  // "Válido hasta" se deja vacío a propósito — no debe bloquear el envío.
  await page.getByRole("button", { name: /^Crear cotización$/i }).click();
  await page.waitForURL((url) => /^\/documentos\/(?!nuevo$)[a-z0-9]+$/.test(url.pathname));

  const documento = await db.documento.findFirstOrThrow({
    where: { clienteId, notas: { equals: [] }, items: { some: { descripcion: "QA_PLAYWRIGHT ítem sin vigencia" } } },
  });
  expect(documento.validoHasta).toBeNull();
});

test("Crear un documento con 'Válido hasta' igual a 'Fecha' (antes rechazaba '0 días')", async ({ page }) => {
  await page.goto("/documentos/nuevo");
  await page.getByPlaceholder("Buscá un cliente por nombre…").click();
  await page.getByPlaceholder("Buscá un cliente por nombre…").fill(NOMBRE_CLIENTE);
  await page.getByRole("option", { name: NOMBRE_CLIENTE }).click();
  const hoy = new Date().toISOString().slice(0, 10);
  await page.getByLabel("Válido hasta (opcional)").fill(hoy);
  await page.locator('textarea[name="items.0.descripcion"]').fill("QA_PLAYWRIGHT ítem mismo día");
  await page.getByRole("button", { name: /^Crear cotización$/i }).click();
  await page.waitForURL((url) => /^\/documentos\/(?!nuevo$)[a-z0-9]+$/.test(url.pathname));

  const documento = await db.documento.findFirstOrThrow({
    where: { clienteId, items: { some: { descripcion: "QA_PLAYWRIGHT ítem mismo día" } } },
  });
  expect(documento.validoHasta).not.toBeNull();
  expect(documento.validoHasta!.toISOString().slice(0, 10)).toBe(hoy);

  await expect(page.getByText("Válido hasta")).toBeVisible();
});
