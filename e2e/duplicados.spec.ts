import { expect, test } from "@playwright/test";
import { db } from "@/lib/db";
import { cambiarEmpresaActiva } from "./helpers";

// Regresión de la Tanda 2 del audit crítico: crear un Cliente, Servicio o
// Proyecto con un nombre ya usado en la misma empresa muestra un diálogo
// de doble confirmación (no bloquea, no crea en silencio) — el usuario
// trabaja desde Excel/WhatsApp y puede repetir nombres fácilmente, pero un
// homónimo legítimo también existe. Datos QA efímeros, mismo patrón que el
// resto de la suite.
const EMPRESA_QA_ID = "cmtdyzqot00008og7m0aya14r"; // QA_PLAYWRIGHT_Empresa de Pruebas
const SUFIJO = Date.now();
const NOMBRE_CLIENTE = `QA_PLAYWRIGHT_Cliente Duplicado ${SUFIJO}`;
const NOMBRE_SERVICIO = `QA_PLAYWRIGHT_Servicio Duplicado ${SUFIJO}`;
const EMPRESA_QA = "QA_PLAYWRIGHT_Empresa de Pruebas (dato de prueba, no real)";

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await cambiarEmpresaActiva(page, EMPRESA_QA);
});

test.afterAll(async () => {
  await db.cliente.deleteMany({ where: { empresaId: EMPRESA_QA_ID, nombre: NOMBRE_CLIENTE } });
  await db.servicio.deleteMany({ where: { empresaId: EMPRESA_QA_ID, nombre: NOMBRE_SERVICIO } });
});

test("crear un Cliente con un nombre repetido pide confirmar antes de duplicar", async ({ page }) => {
  await page.goto("/clientes");

  // Primero, uno real.
  await page.getByRole("button", { name: "Nuevo cliente" }).click();
  await page.locator("#nombre").fill(NOMBRE_CLIENTE);
  await page.getByRole("button", { name: "Crear cliente" }).click();
  await expect(page.getByText("Cliente creado")).toBeVisible();

  // Segundo, mismo nombre — debe pedir confirmación, no crear directo.
  await page.getByRole("button", { name: "Nuevo cliente" }).click();
  await page.locator("#nombre").fill(NOMBRE_CLIENTE);
  await page.getByRole("button", { name: "Crear cliente" }).click();
  await expect(page.getByText("Ya existe algo parecido")).toBeVisible();
  await expect(page.getByText(NOMBRE_CLIENTE, { exact: false }).first()).toBeVisible();

  const antesDeConfirmar = await db.cliente.count({
    where: { empresaId: EMPRESA_QA_ID, nombre: NOMBRE_CLIENTE },
  });
  expect(antesDeConfirmar).toBe(1);

  await page.getByRole("button", { name: "Crear de todas formas" }).click();
  await expect(page.getByText("Ya existe algo parecido")).not.toBeVisible();

  const despuesDeConfirmar = await db.cliente.count({
    where: { empresaId: EMPRESA_QA_ID, nombre: NOMBRE_CLIENTE },
  });
  expect(despuesDeConfirmar).toBe(2);
});

test("cancelar el diálogo de duplicado no crea nada", async ({ page }) => {
  const nombre = `${NOMBRE_SERVICIO}`;
  await page.goto("/servicios");

  await page.getByRole("button", { name: "Nuevo servicio" }).click();
  await page.locator("#nombre").fill(nombre);
  await page.locator("#precioFijo").fill("100");
  await page.getByRole("button", { name: "Crear servicio" }).click();
  await expect(page.getByText("Servicio creado")).toBeVisible();

  await page.getByRole("button", { name: "Nuevo servicio" }).click();
  await page.locator("#nombre").fill(nombre);
  await page.locator("#precioFijo").fill("200");
  await page.getByRole("button", { name: "Crear servicio" }).click();
  await expect(page.getByText("Ya existe algo parecido")).toBeVisible();

  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.waitForTimeout(300);

  const total = await db.servicio.count({ where: { empresaId: EMPRESA_QA_ID, nombre } });
  expect(total).toBe(1);
});
