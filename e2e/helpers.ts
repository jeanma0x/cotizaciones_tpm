import { expect, type Page } from "@playwright/test";

// Cambia la empresa activa desde el selector global y confirma, con un
// assert que sondea (no una espera de red), que el propio selector ya
// refleja el cambio antes de devolver el control. Un simple
// `waitForResponse` genérico (POST + 200) no alcanza: puede atrapar por
// accidente la llamada de telemetría/sincronización de Clerk (también un
// POST 200, casi al mismo tiempo) y resolver antes de que la cookie
// realmente se haya guardado. Hallazgo real de la Fase 3.5: sin este
// chequeo, un activo se creaba bajo la empresa equivocada porque el test
// navegaba antes de tiempo — el texto del selector, en cambio, solo cambia
// cuando el servidor ya re-renderizó con la empresa activa nueva (ver
// selector-empresa-global.tsx: `value` viene siempre de la prop del
// servidor, nunca de un estado optimista local).
export async function cambiarEmpresaActiva(page: Page, nombreEmpresa: string | RegExp) {
  const selector = page.getByLabel("Empresa activa");
  await selector.click();
  await page.getByRole("option", { name: nombreEmpresa }).click();
  await expect(selector).toContainText(nombreEmpresa);
}
