import { expect, test } from "@playwright/test";
import { db } from "@/lib/db";
import { cambiarEmpresaActiva } from "./helpers";

// Regresión del pedido de Oldemar (01/09/26): lista de tipos de Activo
// aplanada (Cabezal, Furgón seco/refrigerado, Plataforma, Lowboy, Cisterna,
// Camión, Camión C3/C2, Porta contenedor) + un tipo "Otro" con detalle libre
// filtrable, mismo patrón que ya existe en Costos (categoria = OTRO). Datos
// QA efímeros, mismo patrón que el resto de la suite.
const EMPRESA_QA_ID = "cmtdyzqot00008og7m0aya14r";
const EMPRESA_QA = "QA_PLAYWRIGHT_Empresa de Pruebas (dato de prueba, no real)";
const SUFIJO = Date.now();
const PLACA_CABEZAL = `QA-CAB-${SUFIJO}`;
const PLACA_OTRO = `QA-OTRO-${SUFIJO}`;
const DETALLE_OTRO = `Maquinaria de soldar ${SUFIJO}`;

test.beforeAll(async () => {
  await db.activo.create({
    data: {
      empresaId: EMPRESA_QA_ID,
      tipo: "CABEZAL",
      placa: PLACA_CABEZAL,
      costo: 400000,
      valor: 380000,
    },
  });
  await db.activo.create({
    data: {
      empresaId: EMPRESA_QA_ID,
      tipo: "OTRO",
      tipoOtroDetalle: DETALLE_OTRO,
      placa: PLACA_OTRO,
      costo: 15000,
      valor: 12000,
    },
  });
});

test.afterAll(async () => {
  await db.activo.deleteMany({ where: { empresaId: EMPRESA_QA_ID, placa: { in: [PLACA_CABEZAL, PLACA_OTRO] } } });
});

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await cambiarEmpresaActiva(page, EMPRESA_QA);
});

test("Activos: los tipos nuevos (Cabezal, Camión C2/C3, Porta contenedor, etc.) están disponibles al crear", async ({
  page,
}) => {
  await page.goto("/activos");
  await page.getByRole("button", { name: "Nuevo activo" }).click();
  await page.getByLabel("Tipo").click();
  for (const label of ["Cabezal", "Camión C3", "Camión C2", "Porta contenedor", "Otro"]) {
    await expect(page.getByRole("option", { name: label, exact: true })).toBeVisible();
  }
});

test("Activos: tipo Otro exige el detalle específico, y se muestra como 'Otro: <detalle>'", async ({ page }) => {
  await page.goto("/activos");
  await page.waitForTimeout(300);

  await page.getByRole("button", { name: "Nuevo activo" }).click();
  await page.getByLabel("Tipo").click();
  await page.getByRole("option", { name: "Otro", exact: true }).click();
  await expect(page.getByLabel("¿A qué tipo corresponde?")).toBeVisible();
  // "Otro" no siempre es un vehículo (ej. maquinaria de soldar) — Placa/
  // Marca/Modelo no aplican y no deben pedirse para no complicar el registro.
  await expect(page.getByLabel("Placa")).toHaveCount(0);
  await expect(page.getByLabel("Marca")).toHaveCount(0);
  await expect(page.getByLabel("Modelo")).toHaveCount(0);

  await expect(page.getByText(`Otro: ${DETALLE_OTRO}`)).toBeVisible();
});

test("Activos: filtrar por 'Otro: <detalle>' lo lista como opción y filtra correctamente", async ({ page }) => {
  await page.goto("/activos");
  await page.waitForTimeout(300);
  await page.locator('[role="combobox"]', { hasText: "Todos los tipos" }).click();
  await expect(page.getByRole("option", { name: `Otro: ${DETALLE_OTRO}` })).toBeVisible();
  await page.getByRole("option", { name: `Otro: ${DETALLE_OTRO}` }).click();
  await page.waitForTimeout(300);
  await expect(page.getByText(PLACA_OTRO)).toBeVisible();
  await expect(page.getByText(PLACA_CABEZAL)).not.toBeVisible();
});
