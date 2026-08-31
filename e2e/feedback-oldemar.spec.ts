import { test, expect } from "@playwright/test";
import { db } from "@/lib/db";
import { cambiarEmpresaActiva } from "./helpers";

// Regresión del feedback de Oldemar (capturas + WhatsApp, 29-30/08/26) sobre
// Activos, Costos operativos y el Panel — ver plan
// jiggly-kindling-pillow.md para el detalle de cada punto. Datos QA
// efímeros sembrados directo por DB (mismo patrón que fase3-3/fase3-4/
// reportes) — no se toca ninguna empresa/cliente real.
const EMPRESA_A_ID = "cmtdyzqot00008og7m0aya14r";
const EMPRESA_QA = "QA_PLAYWRIGHT_Empresa de Pruebas (dato de prueba, no real)";
const SUFIJO = Date.now();
const PLACA = `QA-FB-${SUFIJO}`;
const NOMBRE_CLIENTE = `QA_PLAYWRIGHT_Cliente Feedback ${SUFIJO}`;
const DESC_REPUESTOS = `QA repuestos ${SUFIJO}`;
const DESC_LLANTAS = `QA llantas ${SUFIJO}`;
const DESC_OTRO = `QA otro seguros ${SUFIJO}`;

test.beforeAll(async () => {
  const empresa = await db.empresa.findUniqueOrThrow({ where: { id: EMPRESA_A_ID } });

  await db.activo.create({
    data: {
      empresaId: EMPRESA_A_ID,
      tipo: "CAMION",
      placa: PLACA,
      marca: "Freightliner",
      descripcion: "Camión de prueba con marca y descripción",
      costo: 100000,
      valor: 200000,
      activo: true,
    },
  });

  await db.costoOperativo.create({
    data: { empresaId: EMPRESA_A_ID, categoria: "REPUESTOS", descripcion: DESC_REPUESTOS, monto: 500, fechaGasto: new Date() },
  });
  await db.costoOperativo.create({
    data: { empresaId: EMPRESA_A_ID, categoria: "LLANTAS", descripcion: DESC_LLANTAS, monto: 800, fechaGasto: new Date() },
  });
  await db.costoOperativo.create({
    data: {
      empresaId: EMPRESA_A_ID,
      categoria: "OTRO",
      categoriaOtroDetalle: "Seguros",
      descripcion: DESC_OTRO,
      monto: 300,
      fechaGasto: new Date(),
    },
  });

  const cliente = await db.cliente.create({ data: { empresaId: EMPRESA_A_ID, nombre: NOMBRE_CLIENTE } });
  const proyecto = await db.proyecto.create({ data: { clienteId: cliente.id, nombre: "QA Feedback Proyecto" } });
  const correlativo = empresa.correlativoActual + 1;
  const doc = await db.documento.create({
    data: {
      empresaId: EMPRESA_A_ID,
      tipo: "FACTURA",
      correlativo,
      clienteId: cliente.id,
      proyectoId: proyecto.id,
      fecha: new Date(),
      subtotal: 15000,
      descuento: 0,
      total: 15000,
      notas: [],
      estado: "FACTURADA",
    },
  });
  await db.itemDocumento.create({
    data: { documentoId: doc.id, orden: 1, cantidad: 1, descripcion: "QA feedback item", precioUnitario: 15000 },
  });
  await db.empresa.update({ where: { id: EMPRESA_A_ID }, data: { correlativoActual: correlativo } });
});

test.afterAll(async () => {
  await db.activo.deleteMany({ where: { empresaId: EMPRESA_A_ID, placa: PLACA } });
  await db.costoOperativo.deleteMany({
    where: { empresaId: EMPRESA_A_ID, descripcion: { in: [DESC_REPUESTOS, DESC_LLANTAS, DESC_OTRO] } },
  });
  const cliente = await db.cliente.findFirst({ where: { empresaId: EMPRESA_A_ID, nombre: NOMBRE_CLIENTE } });
  if (cliente) {
    const docs = await db.documento.findMany({ where: { empresaId: EMPRESA_A_ID, clienteId: cliente.id } });
    for (const d of docs) {
      await db.itemDocumento.deleteMany({ where: { documentoId: d.id } });
      await db.historialEstado.deleteMany({ where: { documentoId: d.id } });
    }
    await db.documento.deleteMany({ where: { empresaId: EMPRESA_A_ID, clienteId: cliente.id } });
    await db.proyecto.deleteMany({ where: { clienteId: cliente.id } });
    await db.cliente.delete({ where: { id: cliente.id } });
  }
});

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await cambiarEmpresaActiva(page, EMPRESA_QA);
});

test("Activos: columna Marca visible en la tabla, con el valor sembrado", async ({ page }) => {
  await page.goto("/activos");
  await page.waitForTimeout(300);
  await expect(page.getByRole("columnheader", { name: "Marca" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Freightliner" })).toBeVisible();
});

test("Activos: el formulario de edición trae Marca y Descripción precargadas", async ({ page }) => {
  await page.goto("/activos");
  await page.waitForTimeout(300);
  await page
    .getByRole("row", { name: PLACA })
    .getByRole("button", { name: "Editar" })
    .click();
  await expect(page.getByLabel("Marca")).toHaveValue("Freightliner");
  await expect(page.getByLabel("Descripción (opcional)")).toHaveValue(
    "Camión de prueba con marca y descripción",
  );
});

test("Costos: Repuestos y Llantas existen como categorías, y Otro muestra el detalle específico", async ({
  page,
}) => {
  await page.goto("/costos");
  await page.waitForTimeout(300);
  await expect(page.getByText("Repuestos", { exact: true })).toBeVisible();
  await expect(page.getByText("Llantas", { exact: true })).toBeVisible();
  await expect(page.getByText("Otro: Seguros")).toBeVisible();
});

test("Costos: filtrar por 'Otro: Seguros' lo lista como opción y filtra correctamente", async ({ page }) => {
  await page.goto("/costos");
  await page.waitForTimeout(300);
  await page.locator('[role="combobox"]', { hasText: "Todas las categorías" }).click();
  await expect(page.getByRole("option", { name: "Otro: Seguros" })).toBeVisible();
  await page.getByRole("option", { name: "Otro: Seguros" }).click();
  await page.waitForTimeout(300);
  await expect(page.getByText(DESC_OTRO)).toBeVisible();
  await expect(page.getByText(DESC_REPUESTOS)).not.toBeVisible();
});

test("Costos: elegir categoría Otro exige el detalle específico", async ({ page }) => {
  await page.goto("/costos");
  await page.getByRole("button", { name: "Nuevo costo" }).click();
  await page.getByLabel("Categoría").click();
  await page.getByRole("option", { name: "Otro", exact: true }).click();
  await expect(page.getByLabel("¿A qué categoría corresponde?")).toBeVisible();
});

test("Panel: Facturado/Costos (mes en curso) agrupados junto a Utilidad neta, sin 'histórico'", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Facturado (mes en curso)")).toBeVisible();
  await expect(page.getByText("Costos (mes en curso)")).toBeVisible();
  await expect(page.getByText("Facturado (histórico)")).not.toBeVisible();
});

test("Panel: gráfica de facturado por proyecto muestra el proyecto sembrado", async ({ page }) => {
  await page.goto("/dashboard");
  await page.locator("text=Utilidad por proyecto").scrollIntoViewIfNeeded();
  await expect(page.getByText("Facturado por proyecto", { exact: false })).toBeVisible();
  await expect(page.getByText(NOMBRE_CLIENTE, { exact: false }).first()).toBeVisible();
});
