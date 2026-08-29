import { expect, test } from "@playwright/test";
import { db } from "@/lib/db";
import { asignarCorrelativo } from "@/lib/correlativo";

// Verificación de regresión + criterio de salida de la Fase 3.4 (ver
// docs/fase3-clientes-proyectos-costos-activos.md): "el panel muestra
// utilidad por proyecto (facturado menos costos) y permite filtrar por
// cliente/proyecto/empresa/fecha". Datos QA sembrados directamente por DB
// (más rápido y ya suficientemente probado por la Fase 3.3 que la UI de
// creación funciona) — acá lo que se prueba es la AGREGACIÓN y el filtro.
const SUFIJO = Date.now();
const EMPRESA_QA_ID = "cmtdyzqot00008og7m0aya14r"; // QA_PLAYWRIGHT_Empresa de Pruebas
const NOMBRE_CLIENTE = `QA_PLAYWRIGHT_Cliente Utilidad ${SUFIJO}`;
const NOMBRE_PROYECTO_A = `QA_PLAYWRIGHT_Proyecto A ${SUFIJO}`;
const NOMBRE_PROYECTO_B = `QA_PLAYWRIGHT_Proyecto B ${SUFIJO}`;

let clienteId: string;
let proyectoAId: string;
let proyectoBId: string;

test.beforeAll(async () => {
  const cliente = await db.cliente.create({
    data: { empresaId: EMPRESA_QA_ID, nombre: NOMBRE_CLIENTE },
  });
  clienteId = cliente.id;

  const [proyectoA, proyectoB] = await Promise.all([
    db.proyecto.create({ data: { clienteId, nombre: NOMBRE_PROYECTO_A } }),
    db.proyecto.create({ data: { clienteId, nombre: NOMBRE_PROYECTO_B } }),
  ]);
  proyectoAId = proyectoA.id;
  proyectoBId = proyectoB.id;

  // Proyecto A: facturado 1000 (estado FACTURADA), costo 300 → utilidad 700.
  // Proyecto B: facturado 500 (estado FACTURADA), costo 800 → utilidad -300
  // (a propósito negativo, para confirmar que también se muestra así).
  await db.$transaction(async (tx) => {
    const correlativo = await asignarCorrelativo(tx, EMPRESA_QA_ID);
    await tx.documento.create({
      data: {
        empresaId: EMPRESA_QA_ID,
        tipo: "COTIZACION",
        correlativo,
        clienteId,
        proyectoId: proyectoAId,
        fecha: new Date(),
        subtotal: 1000,
        total: 1000,
        notas: [],
        estado: "FACTURADA",
      },
    });
  });
  await db.$transaction(async (tx) => {
    const correlativo = await asignarCorrelativo(tx, EMPRESA_QA_ID);
    await tx.documento.create({
      data: {
        empresaId: EMPRESA_QA_ID,
        tipo: "FACTURA",
        correlativo,
        clienteId,
        proyectoId: proyectoBId,
        fecha: new Date(),
        subtotal: 500,
        total: 500,
        notas: [],
        estado: "FACTURADA",
      },
    });
  });
  await db.costoOperativo.create({
    data: {
      empresaId: EMPRESA_QA_ID,
      clienteId,
      proyectoId: proyectoAId,
      categoria: "OTRO",
      descripcion: "QA_PLAYWRIGHT costo proyecto A",
      monto: 300,
      fechaGasto: new Date(),
    },
  });
  await db.costoOperativo.create({
    data: {
      empresaId: EMPRESA_QA_ID,
      clienteId,
      proyectoId: proyectoBId,
      categoria: "OTRO",
      descripcion: "QA_PLAYWRIGHT costo proyecto B",
      monto: 800,
      fechaGasto: new Date(),
    },
  });
});

test.afterAll(async () => {
  await db.documento.deleteMany({ where: { clienteId } });
  await db.costoOperativo.deleteMany({ where: { clienteId } });
  await db.proyecto.deleteMany({ where: { clienteId } });
  await db.cliente.delete({ where: { id: clienteId } });
});

test("el panel muestra utilidad por proyecto (facturado − costos) y el filtro por proyecto funciona", async ({
  page,
}) => {
  await page.goto("/dashboard");

  const filaA = page.getByRole("row").filter({ hasText: NOMBRE_PROYECTO_A });
  await expect(filaA).toContainText("1,000.00");
  await expect(filaA).toContainText("300.00");
  await expect(filaA).toContainText("700.00");

  const filaB = page.getByRole("row").filter({ hasText: NOMBRE_PROYECTO_B });
  await expect(filaB).toContainText("500.00");
  await expect(filaB).toContainText("800.00");
  await expect(filaB).toContainText("-300.00");

  // Filtrar por cliente, luego por Proyecto A: solo debe quedar esa fila.
  await page.getByLabel("Empresa activa").isVisible().catch(() => {});
  await page.getByRole("combobox").filter({ hasText: /Todos los clientes/i }).click();
  await page.getByRole("option", { name: NOMBRE_CLIENTE }).click();
  await page.getByRole("combobox").filter({ hasText: /Todos los proyectos/i }).click();
  await page.getByRole("option", { name: NOMBRE_PROYECTO_A }).click();

  await expect(page.getByRole("row").filter({ hasText: NOMBRE_PROYECTO_A })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: NOMBRE_PROYECTO_B })).toHaveCount(0);
});
