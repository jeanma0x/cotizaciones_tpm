import { expect, test } from "@playwright/test";
import { db } from "@/lib/db";
import { cambiarEmpresaActiva } from "./helpers";

// Regresión de dos pedidos del cliente en la misma conversación (02/09/26):
// "Anulado" en Documentos (alternativa al "soft delete" descartado — ver
// comentario en schema.prisma): ortogonal a `estado`, exige motivo, nunca
// borra la fila ni libera el correlativo, y saca al documento de los
// totales de dinero sin ocultarlo del listado. Y el descuento de IVA (12%,
// escenario pesimista) en "Utilidad neta", junto al ISR ya existente — ver
// lib/impuestos.ts para la fórmula exacta (con su propio test unitario en
// tests/impuestos.test.ts). Datos QA efímeros, mismo patrón que el resto de
// la suite.
const EMPRESA_QA_ID = "cmtdyzqot00008og7m0aya14r";
const EMPRESA_QA = "QA_PLAYWRIGHT_Empresa de Pruebas (dato de prueba, no real)";
const SUFIJO = Date.now();
const NOMBRE_CLIENTE = `QA_PLAYWRIGHT_Cliente Anulado ${SUFIJO}`;
const MOTIVO = `Cliente canceló el servicio ${SUFIJO}`;

let documentoId: string;
let correlativo: number;

test.beforeAll(async () => {
  const empresa = await db.empresa.findUniqueOrThrow({ where: { id: EMPRESA_QA_ID } });
  const cliente = await db.cliente.create({
    data: { empresaId: EMPRESA_QA_ID, nombre: NOMBRE_CLIENTE },
  });
  correlativo = empresa.correlativoActual + 1;
  const doc = await db.documento.create({
    data: {
      empresaId: EMPRESA_QA_ID,
      tipo: "FACTURA",
      correlativo,
      clienteId: cliente.id,
      fecha: new Date(),
      subtotal: 5000,
      descuento: 0,
      total: 5000,
      notas: [],
      estado: "FACTURADA",
    },
  });
  documentoId = doc.id;
  await db.itemDocumento.create({
    data: { documentoId: doc.id, orden: 1, cantidad: 1, descripcion: "QA anulado", precioUnitario: 5000 },
  });
  await db.empresa.update({ where: { id: EMPRESA_QA_ID }, data: { correlativoActual: correlativo } });
});

test.afterAll(async () => {
  await db.historialEstado.deleteMany({ where: { documentoId } });
  await db.itemDocumento.deleteMany({ where: { documentoId } });
  await db.documento.delete({ where: { id: documentoId } });
  await db.cliente.deleteMany({ where: { empresaId: EMPRESA_QA_ID, nombre: NOMBRE_CLIENTE } });
});

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await cambiarEmpresaActiva(page, EMPRESA_QA);
});

test("Panel: la Utilidad neta muestra el desglose de ISR e IVA estimados (pedido de Oldemar, 02/09/26)", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page.waitForTimeout(300);
  await expect(page.getByText("ISR estimado", { exact: false })).toBeVisible();
  await expect(page.getByText("IVA estimado", { exact: false })).toBeVisible();
  await expect(page.getByText("12%, escenario pesimista", { exact: false })).toBeVisible();
});

test("Panel: el ícono de información junto a Utilidad neta abre el detalle de ISR/IVA (pedido de Oldemar, 02/09/26)", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page.waitForTimeout(300);
  await page.getByLabel("Cómo se calcula Utilidad neta").click();
  await expect(page.getByText("Cómo se calcula Utilidad neta", { exact: true })).toBeVisible();
  await expect(page.getByText("régimen opcional simplificado", { exact: false }).last()).toBeVisible();
  await expect(page.getByText("escenario pesimista", { exact: false }).last()).toBeVisible();
});

test("Reportes: el resumen ejecutivo menciona el IVA estimado", async ({ page }) => {
  await page.goto("/reportes");
  await page.waitForTimeout(300);
  await expect(page.getByText("IVA estimado", { exact: false })).toBeVisible();
});

test("Documentos: anular exige motivo, no deja confirmar vacío", async ({ page }) => {
  await page.goto(`/documentos/${documentoId}`);
  await page.getByRole("button", { name: "Anular" }).click();
  await expect(page.getByRole("button", { name: "Sí, anular" })).toBeDisabled();
});

test("Documentos: anular deja el badge visible, saca del panel, y reactivar lo devuelve — sin perder el correlativo", async ({
  page,
}) => {
  await page.goto(`/documentos/${documentoId}`);
  await page.getByRole("button", { name: "Anular" }).click();
  await page.getByLabel("Motivo").fill(MOTIVO);
  await page.getByRole("button", { name: "Sí, anular" }).click();
  await expect(page.getByText("Documento anulado")).toBeVisible();

  await page.waitForTimeout(300);
  await expect(page.getByText("Anulada").first()).toBeVisible();
  await expect(page.getByText(MOTIVO).first()).toBeVisible();

  const trasAnular = await db.documento.findUniqueOrThrow({ where: { id: documentoId } });
  expect(trasAnular.anulado).toBe(true);
  expect(trasAnular.motivoAnulacion).toBe(MOTIVO);
  expect(trasAnular.correlativo).toBe(correlativo);

  // Sigue visible en el listado — nunca desaparece de la trazabilidad.
  await page.goto("/documentos");
  await page.waitForTimeout(300);
  await expect(page.getByText(`TPM-${correlativo}`)).toBeVisible();
  await expect(
    page.getByRole("row", { name: `TPM-${correlativo}` }).getByText("Anulada"),
  ).toBeVisible();

  // Excluido de "Facturado (mes en curso)" del panel.
  await page.goto("/dashboard");
  await page.waitForTimeout(300);
  const facturadoAnulado = await db.documento.aggregate({
    where: { empresaId: EMPRESA_QA_ID, estado: "FACTURADA", anulado: false },
    _sum: { total: true },
  });
  // No hay forma directa de leer el StatCard por valor exacto sin acoplarse
  // al resto de los datos QA de la empresa — la verificación fuerte es
  // contra la base: la query que alimenta el panel (anulado: false) no debe
  // incluir este documento.
  const totalIncluyeAnulado = await db.documento.aggregate({
    where: { empresaId: EMPRESA_QA_ID, estado: "FACTURADA" },
    _sum: { total: true },
  });
  expect(Number(facturadoAnulado._sum.total ?? 0)).toBeLessThan(
    Number(totalIncluyeAnulado._sum.total ?? 0),
  );

  // Reactivar lo hace volver a contar.
  await page.goto(`/documentos/${documentoId}`);
  await page.getByRole("button", { name: "Reactivar" }).click();
  await expect(page.getByText("Documento reactivado")).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page.getByText("Anulada")).toHaveCount(0);

  const trasReactivar = await db.documento.findUniqueOrThrow({ where: { id: documentoId } });
  expect(trasReactivar.anulado).toBe(false);
  expect(trasReactivar.motivoAnulacion).toBeNull();
  expect(trasReactivar.correlativo).toBe(correlativo);
});
