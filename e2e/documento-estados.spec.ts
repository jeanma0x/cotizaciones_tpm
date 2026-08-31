import { expect, test } from "@playwright/test";
import { db } from "@/lib/db";
import { asignarCorrelativo } from "@/lib/correlativo";

// Regresión de la Tanda 2 del audit crítico (máquina de estados de
// Documento + bloqueo de edición de un documento FACTURADA). El mapa de
// transiciones válidas vive en un solo lugar (lib/validations/documento.ts,
// TRANSICIONES_ESTADO_VALIDAS) e importado tanto por el servidor
// (cambiarEstadoDocumento) como por el cliente (documento-estado-form.tsx)
// — verificar que el <Select> del cliente ofrece exactamente esas opciones
// por cada estado da confianza fuerte de que el servidor las exige
// también, sin necesidad de forjar una petición inválida directo al
// servidor (los server actions de Next requieren el contexto de request
// real de Clerk, no se pueden invocar sueltos desde el proceso de test).
const EMPRESA_QA_ID = "cmtdyzqot00008og7m0aya14r"; // QA_PLAYWRIGHT_Empresa de Pruebas
const NOMBRE_CLIENTE = `QA_PLAYWRIGHT_Cliente Estados ${Date.now()}`;

const CASOS: { estado: "BORRADOR" | "ENVIADA" | "EN_NEGOCIACION" | "ACEPTADA" | "VENCIDA" | "RECHAZADA" | "FACTURADA"; opcionesEsperadas: string[] }[] = [
  { estado: "BORRADOR", opcionesEsperadas: ["Enviada"] },
  { estado: "ENVIADA", opcionesEsperadas: ["En negociación", "Aceptada", "Rechazada", "Vencida"] },
  { estado: "EN_NEGOCIACION", opcionesEsperadas: ["Aceptada", "Rechazada", "Vencida"] },
  { estado: "ACEPTADA", opcionesEsperadas: ["Facturada"] },
  { estado: "VENCIDA", opcionesEsperadas: ["Enviada"] },
  { estado: "RECHAZADA", opcionesEsperadas: [] },
  { estado: "FACTURADA", opcionesEsperadas: [] },
];

let clienteId: string;
const documentoIds: Record<string, string> = {};

test.beforeAll(async () => {
  const cliente = await db.cliente.create({
    data: { empresaId: EMPRESA_QA_ID, nombre: NOMBRE_CLIENTE },
  });
  clienteId = cliente.id;

  for (const { estado } of CASOS) {
    const documento = await db.$transaction(async (tx) => {
      const correlativo = await asignarCorrelativo(tx, EMPRESA_QA_ID);
      return tx.documento.create({
        data: {
          empresaId: EMPRESA_QA_ID,
          tipo: "COTIZACION",
          correlativo,
          clienteId,
          fecha: new Date(),
          subtotal: 100,
          total: 100,
          notas: [],
          estado,
          items: { create: [{ cantidad: 1, descripcion: "QA estados item", precioUnitario: 100, orden: 0 }] },
        },
      });
    });
    documentoIds[estado] = documento.id;
  }
});

test.afterAll(async () => {
  for (const id of Object.values(documentoIds)) {
    await db.itemDocumento.deleteMany({ where: { documentoId: id } });
    await db.historialEstado.deleteMany({ where: { documentoId: id } });
  }
  await db.documento.deleteMany({ where: { id: { in: Object.values(documentoIds) } } });
  await db.cliente.delete({ where: { id: clienteId } });
});

for (const { estado, opcionesEsperadas } of CASOS) {
  test(`desde ${estado}, el selector de estado solo ofrece: ${opcionesEsperadas.join(", ") || "(ninguna — terminal)"}`, async ({
    page,
  }) => {
    await page.goto(`/documentos/${documentoIds[estado]}`);
    await page.waitForTimeout(300);

    if (opcionesEsperadas.length === 0) {
      await expect(page.getByText("es un estado final")).toBeVisible();
      return;
    }

    await page.locator('[role="combobox"]', { hasText: "Elegí el nuevo estado" }).click();
    const opciones = page.getByRole("option");
    await expect(opciones).toHaveCount(opcionesEsperadas.length);
    for (const label of opcionesEsperadas) {
      await expect(page.getByRole("option", { name: label, exact: true })).toBeVisible();
    }
  });
}

test("un documento FACTURADA no muestra el botón Editar", async ({ page }) => {
  await page.goto(`/documentos/${documentoIds.FACTURADA}`);
  await expect(page.getByRole("button", { name: "Editar" })).not.toBeVisible();
});

test("la URL /editar de un documento FACTURADA redirige al detalle (bloqueo también del lado del servidor)", async ({
  page,
}) => {
  await page.goto(`/documentos/${documentoIds.FACTURADA}/editar`);
  await page.waitForTimeout(300);
  await expect(page).toHaveURL(new RegExp(`/documentos/${documentoIds.FACTURADA}$`));
});

test("un documento en BORRADOR sí muestra el botón Editar", async ({ page }) => {
  await page.goto(`/documentos/${documentoIds.BORRADOR}`);
  await expect(page.getByRole("button", { name: "Editar" })).toBeVisible();
});
