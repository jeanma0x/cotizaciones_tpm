import { expect, test } from "@playwright/test";
import { db } from "@/lib/db";
import { asignarCorrelativo } from "@/lib/correlativo";
import { cambiarEmpresaActiva } from "./helpers";

// Regresión de la auditoría móvil (08/09/26): varias pantallas se
// desbordaban o perdían contenido en un viewport angosto. Tres bugs reales
// encontrados y corregidos:
// 1. PageHeader (components/app/page-header.tsx): con botones de acción,
//    el título de la pantalla quedaba invisible (le ganaba todo el espacio
//    a los botones en una sola fila sin wrap).
// 2. DataTable (components/app/data-table.tsx): usaba overflow-hidden en
//    vez de overflow-x-auto — las columnas que no cabían quedaban
//    inalcanzables, no solo cortadas visualmente.
// 3. El selector "Agregar del catálogo…" en Ítems (documento-form.tsx) y
//    el header de FormSection (form-section.tsx) no envolvían, así que el
//    selector ancho (agregado para el pedido de Oldemar sobre nombres
//    largos, 02/09/26) se salía de la tarjeta en mobile.
const EMPRESA_QA_ID = "cmtdyzqot00008og7m0aya14r";
const EMPRESA_QA = "QA_PLAYWRIGHT_Empresa de Pruebas (dato de prueba, no real)";
const SUFIJO = Date.now();
const NOMBRE_CLIENTE = `QA_PLAYWRIGHT_Cliente Movil ${SUFIJO}`;
const NOMBRE_SERVICIO = `QA_PLAYWRIGHT servicio con nombre bien largo para forzar el truncado ${SUFIJO}`;

let clienteId: string;
let servicioId: string;
let documentoId: string;

test.beforeAll(async () => {
  const cliente = await db.cliente.create({
    data: { empresaId: EMPRESA_QA_ID, nombre: NOMBRE_CLIENTE },
  });
  clienteId = cliente.id;
  const servicio = await db.servicio.create({
    data: { empresaId: EMPRESA_QA_ID, nombre: NOMBRE_SERVICIO, precioFijo: 100 },
  });
  servicioId = servicio.id;

  const correlativo = await asignarCorrelativo(db, EMPRESA_QA_ID);
  const doc = await db.documento.create({
    data: {
      empresaId: EMPRESA_QA_ID,
      tipo: "COTIZACION",
      correlativo,
      clienteId,
      fecha: new Date(),
      subtotal: 100,
      total: 100,
      notas: [],
      estado: "BORRADOR",
      items: { create: [{ orden: 0, cantidad: 1, descripcion: "QA movil item", precioUnitario: 100 }] },
    },
  });
  documentoId = doc.id;
  await db.empresa.update({ where: { id: EMPRESA_QA_ID }, data: { correlativoActual: correlativo } });
});

test.afterAll(async () => {
  await db.itemDocumento.deleteMany({ where: { documentoId } });
  await db.historialEstado.deleteMany({ where: { documentoId } });
  await db.documento.delete({ where: { id: documentoId } });
  await db.servicio.delete({ where: { id: servicioId } });
  await db.cliente.delete({ where: { id: clienteId } });
});

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/dashboard");
  // En mobile el sidebar (donde vive "Empresa activa") arranca fuera de
  // pantalla — hay que abrirlo primero, a diferencia del helper compartido
  // que asume el sidebar de escritorio siempre visible.
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await cambiarEmpresaActiva(page, EMPRESA_QA);
  await page.getByRole("button", { name: "Cerrar menú" }).click();
  await page.waitForTimeout(300);
});

test("PageHeader: el título de la pantalla sigue visible en mobile con varios botones de acción", async ({
  page,
}) => {
  await page.goto("/costos");
  await page.waitForTimeout(400);
  await expect(page.getByRole("heading", { name: "Costos operativos" })).toBeVisible();
  const box = await page.getByRole("heading", { name: "Costos operativos" }).boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(20);
});

test("DataTable: la tabla se puede scrollear horizontalmente en vez de cortar columnas", async ({
  page,
}) => {
  await page.goto("/documentos");
  await page.waitForTimeout(500);
  const wrapper = page.locator("table").locator("xpath=..");
  await expect(wrapper).toHaveCSS("overflow-x", "auto");
  const info = await wrapper.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
  expect(info.scrollWidth).toBeGreaterThan(info.clientWidth);
});

test("Nuevo documento: el selector de catálogo no desborda la tarjeta de Ítems en mobile", async ({
  page,
}) => {
  await page.goto("/documentos/nuevo");
  await page.waitForTimeout(500);
  const bodyOverflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(bodyOverflow.scrollWidth).toBe(bodyOverflow.clientWidth);

  const selectorCatalogo = page.locator('[role="combobox"]', { hasText: "Agregar del catálogo" });
  const box = await selectorCatalogo.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);
});
