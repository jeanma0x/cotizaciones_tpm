import { expect, test } from "@playwright/test";
import { db } from "@/lib/db";
import { cambiarEmpresaActiva } from "./helpers";

// Verificación de regresión + criterio de salida de la Fase 3.5 (ver
// docs/fase3-clientes-proyectos-costos-activos.md): "se puede registrar un
// camión y un furgón con su categoría, costo, valor y modelo, y aparecen
// correctamente segmentados por empresa". Flujo real por UI, datos QA
// efímeros limpiados al final.
const SUFIJO = Date.now();
const PLACA_CAMION = `QA-C-${SUFIJO}`;
const MODELO_CAMION = `Modelo Camión ${SUFIJO}`;
const PLACA_FURGON = `QA-F-${SUFIJO}`;
const MODELO_FURGON = `Modelo Furgón ${SUFIJO}`;
const EMPRESA_A = "QA_PLAYWRIGHT_Empresa de Pruebas (dato de prueba, no real)";
const EMPRESA_B = "QA_PLAYWRIGHT_Empresa B (dato de prueba, no real)";

test.afterAll(async () => {
  await db.activo.deleteMany({ where: { placa: { in: [PLACA_CAMION, PLACA_FURGON] } } });
});

test("registrar un camión y un furgón con categoría/costo/valor/modelo, segmentados por empresa", async ({
  page,
}) => {
  // 1) Camión en Empresa de Pruebas.
  await page.goto("/dashboard");
  await cambiarEmpresaActiva(page, EMPRESA_A);

  await page.goto("/activos");
  await page.getByRole("button", { name: "Nuevo activo" }).click();
  // "Camión" ya es el tipo por defecto — no hace falta tocar el selector.
  await page.getByLabel("Placa").fill(PLACA_CAMION);
  await page.getByLabel("Modelo").fill(MODELO_CAMION);
  await page.getByLabel("Costo").fill("500000");
  await page.getByLabel("Valor actual").fill("450000");
  await page.getByRole("button", { name: "Registrar activo" }).click();
  await expect(page.getByText(PLACA_CAMION)).toBeVisible();

  const filaCamion = page.getByRole("row").filter({ hasText: PLACA_CAMION });
  await expect(filaCamion).toContainText("Camión");
  await expect(filaCamion).toContainText(MODELO_CAMION);
  await expect(filaCamion).toContainText("450000.00");

  // 2) Furgón (con categoría) en Empresa B.
  await cambiarEmpresaActiva(page, EMPRESA_B);
  await page.reload();

  // Con la empresa cambiada, el camión de Empresa A ya no debe verse acá.
  await expect(page.getByText(PLACA_CAMION)).toHaveCount(0);

  await page.getByRole("button", { name: "Nuevo activo" }).click();
  await page.getByLabel("Tipo").click();
  await page.getByRole("option", { name: "Furgón o plataforma" }).click();
  await page.getByLabel("Categoría").click();
  await page.getByRole("option", { name: "Furgón refrigerado" }).click();
  await page.getByLabel("Placa").fill(PLACA_FURGON);
  await page.getByLabel("Modelo").fill(MODELO_FURGON);
  await page.getByLabel("Costo").fill("300000");
  await page.getByLabel("Valor actual").fill("280000");
  await page.getByRole("button", { name: "Registrar activo" }).click();
  await expect(page.getByText(PLACA_FURGON)).toBeVisible();

  const filaFurgon = page.getByRole("row").filter({ hasText: PLACA_FURGON });
  await expect(filaFurgon).toContainText("Furgón o plataforma");
  await expect(filaFurgon).toContainText("Furgón refrigerado");
  await expect(filaFurgon).toContainText(MODELO_FURGON);
  await expect(filaFurgon).toContainText("280000.00");

  await page.screenshot({ path: "e2e/screenshots/3.5-activos-empresa-b.png", fullPage: true });

  // 3) Segmentación: volver a "Todas las empresas" y confirmar que ambos
  // aparecen, cada uno bajo su propia empresa.
  await cambiarEmpresaActiva(page, /Todas las empresas/i);
  await page.reload();
  await expect(page.getByRole("row").filter({ hasText: PLACA_CAMION })).toContainText(
    "QA_PLAYWRIGHT_Empresa de Pruebas",
  );
  await expect(page.getByRole("row").filter({ hasText: PLACA_FURGON })).toContainText(
    "QA_PLAYWRIGHT_Empresa B",
  );
  await page.screenshot({ path: "e2e/screenshots/3.5-activos-todas-empresas.png", fullPage: true });
});
