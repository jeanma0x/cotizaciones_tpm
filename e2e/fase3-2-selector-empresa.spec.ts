import { expect, test } from "@playwright/test";

// Verificación de regresión de la Fase 3.2 (ver
// docs/fase3-clientes-proyectos-costos-activos.md): un usuario MIEMBRO nunca
// debe poder ver una empresa fuera de las que tiene permitidas, ni siquiera
// manipulando directamente la cookie del selector global (que es solo una
// preferencia de navegación, revalidada siempre en el servidor —
// getEmpresaActivaId()/assertAccesoEmpresa()).
//
// El usuario QA (ver docs/fase3-handoff-avance.md) es MIEMBRO de 2 empresas
// de prueba (QA_PLAYWRIGHT_*), nunca de las 4 empresas reales del cliente —
// esos 4 ids reales solo se usan acá como el valor "prohibido" a inyectar.
const EMPRESAS_REALES_PROHIBIDAS = [
  { id: "cmspp5tvg0000osbby8ay6d5v", nombre: "Corporación SIAP S.A." },
  { id: "cmspp5yu50002osbb96abuql5", nombre: "Servicios Generales TPM, S.A." },
  { id: "cmspp5wti0001osbbew31mus9", nombre: "Estados Unidos" },
  { id: "cmspp60ue0003osbbriymxjj5", nombre: "Servicios Generales TPM" },
];

test("el selector global solo lista las empresas permitidas del MIEMBRO, nunca las 4 reales", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);

  const selector = page.getByLabel("Empresa activa");
  await expect(selector).toBeVisible();
  await selector.click();

  for (const { nombre } of EMPRESAS_REALES_PROHIBIDAS) {
    await expect(page.getByRole("option", { name: nombre })).toHaveCount(0);
  }
  await expect(page.getByRole("option", { name: /Todas las empresas/i })).toBeVisible();
  await expect(page.getByRole("option", { name: /QA_PLAYWRIGHT_Empresa/ }).first()).toBeVisible();

  await page.keyboard.press("Escape");
  await page.screenshot({ path: "e2e/screenshots/3.2-selector-empresas-permitidas.png" });
});

test("una cookie de empresa activa manipulada a mano (empresa real no permitida) se ignora, no filtra ni deja ver esa empresa", async ({
  page,
  context,
}) => {
  const empresaAjena = EMPRESAS_REALES_PROHIBIDAS[0];

  // Simula el ataque exacto contra el que lib/empresa-activa.ts debe blindar:
  // alguien pone a mano la cookie con el id de una empresa real ajena,
  // saltándose por completo el <Select> y la server action.
  await context.addCookies([
    {
      name: "empresaActivaId",
      value: empresaAjena.id,
      domain: "localhost",
      path: "/",
      httpOnly: true,
    },
  ]);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);

  // El nombre de la empresa ajena no debe aparecer en ningún lado del panel
  // (encabezados de "Desglose por empresa", tarjetas, etc.).
  await expect(page.getByText(empresaAjena.nombre, { exact: false })).toHaveCount(0);

  // El selector debe haber vuelto a "Todas las empresas" (o quedarse en una
  // de las 2 QA permitidas) — nunca mostrar la empresa ajena como activa.
  const selector = page.getByLabel("Empresa activa");
  await expect(selector).not.toHaveText(new RegExp(empresaAjena.nombre));

  await page.screenshot({ path: "e2e/screenshots/3.2-cookie-manipulada-ignorada.png" });
});

test("regresión: Documentos, Clientes y Servicios cargan sin errores para el MIEMBRO QA", async ({
  page,
}) => {
  for (const ruta of ["/documentos", "/clientes", "/servicios", "/costos"]) {
    const respuesta = await page.goto(ruta);
    expect(respuesta?.status()).toBeLessThan(400);
    // Ninguna de las 4 empresas reales debe aparecer en ninguna de estas
    // pantallas para este usuario, sin importar la ruta.
    for (const { nombre } of EMPRESAS_REALES_PROHIBIDAS) {
      await expect(page.getByText(nombre, { exact: false })).toHaveCount(0);
    }
  }
});

// Hallazgo real descubierto durante la Fase 3.3 (ver commit de esa fase):
// establecerEmpresaActiva es una server action asíncrona — navegar
// inmediatamente después de cambiar la empresa activa, sin esperar esa
// respuesta, podía dejar la página siguiente con la empresa activa
// desactualizada. El fix bloquea la navegación del sidebar mientras el
// cambio está en curso (ver selector-empresa-global.tsx/sidebar.tsx).
test("la navegación del sidebar queda bloqueada mientras se guarda el cambio de empresa activa, y se libera al terminar", async ({
  page,
}) => {
  await page.goto("/dashboard");

  const selector = page.getByLabel("Empresa activa");
  await selector.click();
  // Deliberadamente SIN esperar la respuesta de establecerEmpresaActiva —
  // este test simula justo la condición de carrera que se encontró.
  await page.getByRole("option", { name: /Todas las empresas/i }).click();

  const linkDocumentos = page.getByRole("link", { name: "Documentos" });
  await expect(linkDocumentos).toHaveAttribute("aria-disabled", "true");
  await linkDocumentos.click({ force: true });
  // Si el bloqueo funcionó, el clic (incluso forzado) no debió navegar.
  await expect(page).toHaveURL(/\/dashboard/);

  // Una vez que termina el cambio de empresa, la navegación se libera y
  // funciona con normalidad.
  await expect(linkDocumentos).toHaveAttribute("aria-disabled", "false");
  await linkDocumentos.click();
  await expect(page).toHaveURL(/\/documentos$/);
});
