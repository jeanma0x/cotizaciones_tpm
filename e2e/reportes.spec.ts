import { test, expect } from "@playwright/test";
import { db } from "@/lib/db";
import { cambiarEmpresaActiva } from "./helpers";

// Regresión del módulo de Reportes (Fase 3.6,
// docs/fase3-clientes-proyectos-costos-activos.md): un solo reporte con
// filtros de fecha/empresa/cliente/proyecto opcionales, resumen ejecutivo +
// desglose por proyecto + desglose por empresa (consolidado) + detalle
// opcional, exportable a Excel real (no CSV) e imprimible con el membrete
// institucional real. Datos QA efímeros sembrados directo por DB (mismo
// patrón que fase3-3/fase3-4) — no se toca ninguna empresa/cliente real.
const EMPRESA_A_ID = "cmtdyzqot00008og7m0aya14r";
const EMPRESA_B_ID = "cmtdz1s3k00008oz7kn9ntlhk";
const EMPRESA_QA = "QA_PLAYWRIGHT_Empresa de Pruebas (dato de prueba, no real)";
const SUFIJO = Date.now();

test.beforeAll(async () => {
  for (const empresaId of [EMPRESA_A_ID, EMPRESA_B_ID]) {
    const empresa = await db.empresa.findUniqueOrThrow({ where: { id: empresaId } });
    const cliente = await db.cliente.create({
      data: { empresaId, nombre: `QA_PLAYWRIGHT_Cliente Reportes ${SUFIJO}` },
    });
    const correlativo = empresa.correlativoActual + 1;
    const doc = await db.documento.create({
      data: {
        empresaId,
        tipo: "FACTURA",
        correlativo,
        clienteId: cliente.id,
        fecha: new Date(),
        subtotal: 10000,
        descuento: 0,
        total: 10000,
        notas: [],
        estado: "FACTURADA",
      },
    });
    await db.itemDocumento.create({
      data: { documentoId: doc.id, orden: 1, cantidad: 1, descripcion: "QA reportes", precioUnitario: 10000 },
    });
    await db.empresa.update({ where: { id: empresaId }, data: { correlativoActual: correlativo } });
    await db.costoOperativo.create({
      data: { empresaId, categoria: "COMBUSTIBLE", descripcion: "QA reportes", monto: 2000, fechaGasto: new Date() },
    });
  }
});

test.afterAll(async () => {
  for (const empresaId of [EMPRESA_A_ID, EMPRESA_B_ID]) {
    const cliente = await db.cliente.findFirst({
      where: { empresaId, nombre: `QA_PLAYWRIGHT_Cliente Reportes ${SUFIJO}` },
    });
    if (cliente) {
      const docs = await db.documento.findMany({ where: { empresaId, clienteId: cliente.id } });
      for (const d of docs) {
        await db.itemDocumento.deleteMany({ where: { documentoId: d.id } });
        await db.historialEstado.deleteMany({ where: { documentoId: d.id } });
      }
      await db.documento.deleteMany({ where: { empresaId, clienteId: cliente.id } });
      await db.cliente.delete({ where: { id: cliente.id } });
    }
    await db.costoOperativo.deleteMany({ where: { empresaId, descripcion: "QA reportes" } });
  }
});

test("la página de reportes carga y muestra resumen ejecutivo + desglose por empresa (consolidado)", async ({
  page,
}) => {
  const res = await page.goto("/reportes");
  expect(res?.status()).toBeLessThan(400);
  await expect(page.getByText("Resumen ejecutivo")).toBeVisible();
  await expect(page.getByText("Desglose por proyecto")).toBeVisible();
  await expect(page.getByText("Desglose por empresa")).toBeVisible();
  const tabla = page.locator("table").last();
  await expect(tabla.getByText("QA_PLAYWRIGHT_Empresa de Pruebas", { exact: false })).toBeVisible();
  await expect(tabla.getByText("QA_PLAYWRIGHT_Empresa B", { exact: false })).toBeVisible();

  // "Desglose por proyecto" también debe distinguir la empresa cuando el
  // reporte está consolidado — antes solo "Costos por categoría" lo hacía.
  const tablaProyecto = page.locator("table").first();
  await expect(
    tablaProyecto.getByText(`QA_PLAYWRIGHT_Cliente Reportes ${SUFIJO}`, { exact: false }),
  ).toHaveCount(2);
  await expect(tablaProyecto.getByText("QA_PLAYWRIGHT_Empresa de Pruebas", { exact: false })).toBeVisible();
  await expect(tablaProyecto.getByText("QA_PLAYWRIGHT_Empresa B", { exact: false })).toBeVisible();
});

test("filtrando a una sola empresa, desaparece el desglose por empresa y la otra empresa", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await cambiarEmpresaActiva(page, EMPRESA_QA);
  await page.goto("/reportes");
  await page.waitForTimeout(300);
  await expect(page.getByText("Desglose por empresa")).not.toBeVisible();
  const tabla = page.locator("table").first();
  await expect(tabla.getByText("QA_PLAYWRIGHT_Empresa B", { exact: false })).not.toBeVisible();
});

test("el interruptor de detalle agrega el listado de documentos/costos individuales", async ({ page }) => {
  await page.goto("/reportes");
  await expect(page.getByText("Detalle — documentos facturados")).not.toBeVisible();
  await page.getByRole("checkbox", { name: "Incluir detalle", exact: false }).click();
  await page.waitForTimeout(300);
  await expect(page.getByText("Detalle — documentos facturados")).toBeVisible();
  await expect(page.getByText("QA reportes", { exact: false }).first()).toBeVisible();
});

test("exportar Excel responde con un .xlsx real (no CSV)", async ({ page }) => {
  await page.goto("/dashboard");
  const res = await page.request.get("/api/reportes/exportar?desde=2020-01-01&hasta=2030-12-31");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain(
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  const buffer = await res.body();
  expect(buffer.length).toBeGreaterThan(1000);
});

test("el Excel exportado tiene columna Empresa (para distinguir filas en consolidado)", async ({ page }) => {
  await page.goto("/dashboard");
  const res = await page.request.get("/api/reportes/exportar?desde=2020-01-01&hasta=2030-12-31");
  const buffer = Buffer.from(await res.body());

  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.worksheets[0];
  const encabezados = (sheet.getRow(1).values as unknown[]).filter(Boolean).map(String);
  expect(encabezados).toContain("Empresa");

  const columnaEmpresa = encabezados.indexOf("Empresa") + 1; // getCell es 1-indexado
  const empresasEnFilas = new Set<string>();
  sheet.eachRow((fila, numero) => {
    if (numero === 1) return;
    const valor = fila.getCell(columnaEmpresa).value;
    if (valor) empresasEnFilas.add(String(valor));
  });
  expect(empresasEnFilas.has("QA_PLAYWRIGHT_Empresa de Pruebas (dato de prueba, no real)")).toBe(true);
  expect(empresasEnFilas.has("QA_PLAYWRIGHT_Empresa B (dato de prueba, no real)")).toBe(true);
});

test("Imprimir/PDF abre el diálogo con el membrete institucional (logo real)", async ({ page }) => {
  await page.goto("/reportes");
  await page.getByRole("button", { name: "Imprimir / PDF" }).click();
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByRole("img", { name: "Servicios Generales TPM" })).toBeVisible();
  await expect(dialogo.getByText("Reporte financiero")).toBeVisible();
});
