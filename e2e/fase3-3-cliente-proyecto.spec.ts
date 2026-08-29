import { expect, test } from "@playwright/test";
import { db } from "@/lib/db";
import { cambiarEmpresaActiva } from "./helpers";

// Verificación de regresión + criterio de salida de la Fase 3.3 (ver
// docs/fase3-clientes-proyectos-costos-activos.md): "se puede crear un
// proyecto para un cliente, asociarle un costo y una cotización, y ambos
// quedan correctamente ligados a ese proyecto". Flujo real de punta a punta
// a través de la UI (no atajos por DB), con datos QA efímeros que se limpian
// al final — nunca se toca una empresa/cliente real.
const SUFIJO = Date.now();
const NOMBRE_CLIENTE = `QA_PLAYWRIGHT_Cliente Proyecto ${SUFIJO}`;
const NOMBRE_PROYECTO = `QA_PLAYWRIGHT_Proyecto ${SUFIJO}`;
const EMPRESA_QA = "QA_PLAYWRIGHT_Empresa de Pruebas (dato de prueba, no real)";

test.afterAll(async () => {
  const cliente = await db.cliente.findFirst({ where: { nombre: NOMBRE_CLIENTE } });
  if (cliente) {
    await db.documento.deleteMany({ where: { clienteId: cliente.id } });
    await db.costoOperativo.deleteMany({ where: { clienteId: cliente.id } });
    await db.proyecto.deleteMany({ where: { clienteId: cliente.id } });
    await db.cliente.delete({ where: { id: cliente.id } });
  }
});

test("crear cliente + proyecto, asociar un costo y una cotización, y confirmar que quedan ligados", async ({
  page,
}) => {
  // 1) Empresa activa: QA_PLAYWRIGHT_Empresa de Pruebas. Ver e2e/helpers.ts
  // — hallazgo real: un waitForResponse genérico (POST+200) puede atrapar
  // por accidente la telemetría de Clerk en vez de la respuesta real de
  // establecerEmpresaActiva, dejando que se navegue antes de tiempo.
  await page.goto("/dashboard");
  await cambiarEmpresaActiva(page, EMPRESA_QA);

  // 2) Nuevo cliente.
  await page.goto("/clientes");
  await page.getByRole("button", { name: "Nuevo cliente" }).click();
  await page.getByLabel("Nombre").fill(NOMBRE_CLIENTE);
  await page.getByRole("button", { name: "Crear cliente" }).click();
  await expect(page.getByText(NOMBRE_CLIENTE)).toBeVisible();

  // 3) Proyecto para ese cliente. La verificación de que quedó creado se
  // hace contra la base (no reabriendo el Sheet): router.refresh() dentro de
  // agregar() reconstruye la fila de la tabla, y el Sheet (estado local
  // "open") no sobrevive ese remount de forma confiable en el navegador de
  // pruebas — verificar acá con un getByText intermitentemente daba falso
  // negativo aunque el proyecto sí quedaba creado (confirmado contra DB).
  const filaCliente = page.getByRole("row").filter({ hasText: NOMBRE_CLIENTE });
  await filaCliente.getByRole("button", { name: "Proyectos" }).click();
  await page.getByPlaceholder("Nombre del proyecto nuevo").fill(NOMBRE_PROYECTO);
  await Promise.all([
    page.waitForResponse((res) => res.request().method() === "POST" && res.status() === 200),
    page.getByRole("button", { name: "Agregar" }).click(),
  ]);
  await expect
    .poll(async () => db.proyecto.count({ where: { nombre: NOMBRE_PROYECTO } }), {
      timeout: 5000,
    })
    .toBe(1);
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(filaCliente.getByRole("button", { name: /Proyectos.*1/ })).toBeVisible();

  // 4) Costo asociado a ese cliente + proyecto.
  await page.goto("/costos");
  await page.getByRole("button", { name: "Nuevo costo" }).click();
  await page.getByLabel("Cliente (opcional)").click();
  await page.getByRole("option", { name: NOMBRE_CLIENTE }).click();
  await page.getByLabel("Proyecto (opcional)").click();
  await page.getByRole("option", { name: NOMBRE_PROYECTO }).click();
  await page.getByLabel("Descripción").fill("QA_PLAYWRIGHT costo de prueba");
  await page.getByLabel("Monto").fill("100");
  await page.getByRole("button", { name: "Registrar costo" }).click();
  await expect(page.getByText("QA_PLAYWRIGHT costo de prueba")).toBeVisible();
  await expect(
    page.getByRole("row").filter({ hasText: "QA_PLAYWRIGHT costo de prueba" }),
  ).toContainText(NOMBRE_PROYECTO);

  // 5) Cotización asociada al mismo cliente + proyecto.
  await page.goto("/documentos/nuevo");
  await page.getByPlaceholder("Buscá un cliente por nombre…").click();
  await page.getByPlaceholder("Buscá un cliente por nombre…").fill(NOMBRE_CLIENTE);
  await page.getByRole("option", { name: NOMBRE_CLIENTE }).click();
  await page.getByLabel("Proyecto (opcional)").click();
  await page.getByRole("option", { name: NOMBRE_PROYECTO }).click();
  // El textarea de descripción del ítem no tiene label/placeholder propios
  // (ver documento-form.tsx) — se identifica por el `name` que le da
  // react-hook-form (items.0.descripcion), estable independientemente del
  // texto visible de la columna.
  await page.locator('textarea[name="items.0.descripcion"]').fill("QA_PLAYWRIGHT ítem de prueba");
  await page.getByRole("button", { name: /^Crear cotización$/i }).click();
  // OJO: "/documentos/nuevo" también matchea un regex ingenuo tipo
  // /\/documentos\/[a-z0-9]+$/ ("nuevo" son solo letras minúsculas) — esto
  // causaba que waitForURL resolviera de inmediato sin esperar la
  // navegación real tras crear el documento. Excluirlo explícitamente.
  await page.waitForURL((url) => /^\/documentos\/(?!nuevo$)[a-z0-9]+$/.test(url.pathname));

  // 6) Confirmar en la base que ambos quedaron ligados al MISMO proyecto.
  const cliente = await db.cliente.findFirstOrThrow({ where: { nombre: NOMBRE_CLIENTE } });
  const proyecto = await db.proyecto.findFirstOrThrow({ where: { nombre: NOMBRE_PROYECTO } });
  expect(proyecto.clienteId).toBe(cliente.id);

  const costo = await db.costoOperativo.findFirstOrThrow({
    where: { descripcion: "QA_PLAYWRIGHT costo de prueba" },
  });
  expect(costo.clienteId).toBe(cliente.id);
  expect(costo.proyectoId).toBe(proyecto.id);

  const documento = await db.documento.findFirstOrThrow({ where: { clienteId: cliente.id } });
  expect(documento.proyectoId).toBe(proyecto.id);
});
