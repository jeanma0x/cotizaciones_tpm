import { expect, test } from "@playwright/test";
import { db } from "@/lib/db";
import { cambiarEmpresaActiva } from "./helpers";

// Regresión de la Tanda 3 del audit crítico: Costos desactivar/activar (no
// eliminar), Historial visible en Activos, advertencia de dependientes al
// desactivar un Cliente, y optimistic locking en Costo. Datos QA efímeros,
// mismo patrón que el resto de la suite.
const EMPRESA_QA_ID = "cmtdyzqot00008og7m0aya14r";
const EMPRESA_QA = "QA_PLAYWRIGHT_Empresa de Pruebas (dato de prueba, no real)";
const SUFIJO = Date.now();
const DESC_COSTO = `QA_PLAYWRIGHT_Costo Tanda3 ${SUFIJO}`;
const DESC_COSTO_LOCK = `QA_PLAYWRIGHT_Costo Lock ${SUFIJO}`;
const PLACA_ACTIVO = `QA-T3-${SUFIJO}`;
const NOMBRE_CLIENTE = `QA_PLAYWRIGHT_Cliente Dependientes ${SUFIJO}`;
const NOMBRE_PROYECTO = `QA Proyecto Activo ${SUFIJO}`;

let costoId: string;
let costoLockId: string;

test.beforeAll(async () => {
  const costo = await db.costoOperativo.create({
    data: {
      empresaId: EMPRESA_QA_ID,
      categoria: "COMBUSTIBLE",
      descripcion: DESC_COSTO,
      monto: 250,
      fechaGasto: new Date(),
    },
  });
  costoId = costo.id;

  const costoLock = await db.costoOperativo.create({
    data: {
      empresaId: EMPRESA_QA_ID,
      categoria: "COMBUSTIBLE",
      descripcion: DESC_COSTO_LOCK,
      monto: 100,
      fechaGasto: new Date(),
    },
  });
  costoLockId = costoLock.id;

  await db.activo.create({
    data: {
      empresaId: EMPRESA_QA_ID,
      tipo: "CAMION",
      placa: PLACA_ACTIVO,
      costo: 50000,
      valor: 60000,
      activo: true,
    },
  });

  const cliente = await db.cliente.create({
    data: { empresaId: EMPRESA_QA_ID, nombre: NOMBRE_CLIENTE },
  });
  await db.proyecto.create({ data: { clienteId: cliente.id, nombre: NOMBRE_PROYECTO } });
});

test.afterAll(async () => {
  await db.costoOperativo.deleteMany({
    where: { empresaId: EMPRESA_QA_ID, descripcion: { in: [DESC_COSTO, DESC_COSTO_LOCK] } },
  });
  await db.activo.deleteMany({ where: { empresaId: EMPRESA_QA_ID, placa: PLACA_ACTIVO } });
  const cliente = await db.cliente.findFirst({ where: { empresaId: EMPRESA_QA_ID, nombre: NOMBRE_CLIENTE } });
  if (cliente) {
    await db.proyecto.deleteMany({ where: { clienteId: cliente.id } });
    await db.cliente.delete({ where: { id: cliente.id } });
  }
});

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await cambiarEmpresaActiva(page, EMPRESA_QA);
});

test("Costos: se desactiva/activa (no se elimina), con Estado visible en la tabla", async ({ page }) => {
  await page.goto("/costos");
  await page.waitForTimeout(300);

  const fila = page.getByRole("row", { name: DESC_COSTO });
  await expect(fila.getByText("Activo", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Eliminar" })).toHaveCount(0);

  await fila.getByRole("button", { name: "Desactivar" }).click();
  await page.getByRole("button", { name: "Sí, desactivar" }).click();
  await expect(page.getByText("Costo desactivado")).toBeVisible();

  const costoTrasDesactivar = await db.costoOperativo.findUniqueOrThrow({ where: { id: costoId } });
  expect(costoTrasDesactivar.activo).toBe(false);

  await page.waitForTimeout(300);
  const filaInactiva = page.getByRole("row", { name: DESC_COSTO });
  await expect(filaInactiva.getByText("Inactivo", { exact: true })).toBeVisible();
  await filaInactiva.getByRole("button", { name: "Activar" }).click();
  await expect(page.getByText("Costo activado")).toBeVisible();

  const costoTrasActivar = await db.costoOperativo.findUniqueOrThrow({ where: { id: costoId } });
  expect(costoTrasActivar.activo).toBe(true);
});

test("Activos: crear uno desde la UI queda registrado en el Historial", async ({ page }) => {
  const placaNueva = `QA-T3-UI-${SUFIJO}`;
  await page.goto("/activos");
  await page.getByRole("button", { name: "Nuevo activo" }).click();
  await page.getByLabel("Placa").fill(placaNueva);
  await page.getByLabel("Costo").fill("1000");
  await page.getByLabel("Valor").fill("1200");
  await page.getByRole("button", { name: "Registrar activo" }).click();
  await expect(page.getByText("Activo registrado")).toBeVisible();

  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Historial" }).click();
  await expect(page.getByText("Historial de activos")).toBeVisible();
  await expect(page.getByText(placaNueva, { exact: false }).first()).toBeVisible();

  await db.activo.deleteMany({ where: { empresaId: EMPRESA_QA_ID, placa: placaNueva } });
  await db.activoAuditoria.deleteMany({ where: { empresaId: EMPRESA_QA_ID, activoNombre: { contains: placaNueva } } });
});

test("Clientes: desactivar a alguien con un proyecto activo muestra la advertencia", async ({ page }) => {
  await page.goto("/clientes");
  await page.waitForTimeout(300);
  await page
    .getByRole("row", { name: NOMBRE_CLIENTE })
    .getByRole("button", { name: "Desactivar" })
    .click();
  await expect(page.getByText(/1 proyecto activo/)).toBeVisible();
});

test("Costos: editar con datos desactualizados (dos ediciones concurrentes) da un error de conflicto", async ({
  page,
}) => {
  await page.goto("/costos");
  await page.waitForTimeout(300);

  // Simula que otro usuario ya guardó un cambio mientras esta pantalla
  // seguía abierta con el updatedAt original.
  await db.costoOperativo.update({ where: { id: costoLockId }, data: { monto: 999 } });

  await page
    .getByRole("row", { name: DESC_COSTO_LOCK })
    .getByRole("button", { name: "Editar" })
    .click();
  await page.getByLabel("Monto").fill("777");
  await page.getByRole("button", { name: "Guardar cambios" }).click();

  await expect(page.getByText("cambió mientras lo editabas", { exact: false })).toBeVisible();

  const costoFinal = await db.costoOperativo.findUniqueOrThrow({ where: { id: costoLockId } });
  expect(Number(costoFinal.monto)).toBe(999);
});
