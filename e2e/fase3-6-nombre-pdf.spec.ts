import { expect, test } from "@playwright/test";
import { db } from "@/lib/db";
import { asignarCorrelativo } from "@/lib/correlativo";

// Verificación de la Fase 3.6 (ver docs/fase3-clientes-proyectos-costos-activos.md):
// "el archivo descargado incluye el correlativo en el nombre". El navegador
// sugiere document.title como nombre de archivo al guardar el PDF — se
// verifica acá que el título cambia al correlativo/tipo/cliente justo antes
// de imprimir, y se restaura después (afterprint), sin depender de si
// Playwright puede o no completar un diálogo de impresión real headless.
const EMPRESA_QA_ID = "cmtdyzqot00008og7m0aya14r"; // QA_PLAYWRIGHT_Empresa de Pruebas
const NOMBRE_CLIENTE = `QA_PLAYWRIGHT_Cliente PDF ${Date.now()}`;

let clienteId: string;
let documentoId: string;
let correlativo: number;

test.beforeAll(async () => {
  const cliente = await db.cliente.create({
    data: { empresaId: EMPRESA_QA_ID, nombre: NOMBRE_CLIENTE },
  });
  clienteId = cliente.id;

  const documento = await db.$transaction(async (tx) => {
    correlativo = await asignarCorrelativo(tx, EMPRESA_QA_ID);
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
        items: { create: [{ cantidad: 1, descripcion: "QA item", precioUnitario: 100, orden: 0 }] },
      },
    });
  });
  documentoId = documento.id;
});

test.afterAll(async () => {
  await db.documento.delete({ where: { id: documentoId } });
  await db.cliente.delete({ where: { id: clienteId } });
});

test("el título del documento cambia a 'TPM-<correlativo> - <tipo> - <cliente>' al imprimir, y se restaura después", async ({
  page,
}) => {
  await page.goto(`/documentos/${documentoId}/imprimir`);

  const tituloOriginal = await page.title();

  // Stub de window.print — evita abrir el diálogo real del SO (no
  // disponible en un navegador headless) pero conserva el efecto real que
  // interesa probar: el cambio de document.title antes/después.
  await page.evaluate(() => {
    window.print = () => {
      window.dispatchEvent(new Event("afterprint"));
    };
  });

  await page.getByRole("button", { name: /Imprimir.*Exportar PDF/i }).click();

  await expect.poll(() => page.title()).toBe(tituloOriginal);
  // Con el stub disparando "afterprint" de inmediato, lo único observable
  // es que el título termina restaurado — confirmamos por separado (sin el
  // stub) que SÍ cambia antes de imprimir, computando el mismo valor que
  // usa el componente.
});

test("el nombre calculado para el PDF incluye el correlativo, el tipo y el cliente", async ({
  page,
}) => {
  await page.goto(`/documentos/${documentoId}/imprimir`);

  let tituloDurantePrint = "";
  await page.exposeFunction("__reportarTitulo", (t: string) => {
    tituloDurantePrint = t;
  });
  await page.evaluate(() => {
    window.print = () => {
      // @ts-expect-error -- expuesta por exposeFunction, sin tipos en window
      window.__reportarTitulo(document.title);
      window.dispatchEvent(new Event("afterprint"));
    };
  });

  await page.getByRole("button", { name: /Imprimir.*Exportar PDF/i }).click();
  await page.waitForTimeout(200);

  expect(tituloDurantePrint).toContain(`TPM-${correlativo}`);
  expect(tituloDurantePrint).toContain("Cotización");
  expect(tituloDurantePrint).toContain(NOMBRE_CLIENTE);
});
