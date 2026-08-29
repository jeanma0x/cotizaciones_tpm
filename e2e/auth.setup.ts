import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";

// Usuario QA dedicado (ver docs/fase3-handoff-avance.md): MIEMBRO con acceso
// SOLO a las 2 empresas QA_PLAYWRIGHT_*, nunca a las 4 empresas reales del
// cliente — así cualquier verificación de aislamiento en los specs usa datos
// de prueba, jamás datos reales de Oldemar.
const QA_EMAIL = "qa.playwright+tpm@guatemaltek.com";

setup("autenticar usuario QA", async ({ page }) => {
  await clerkSetup();

  // clerk.signIn exige haber navegado antes a una página no protegida que
  // cargue Clerk — /sign-in es pública (ver middleware.ts).
  await page.goto("/sign-in");
  await clerk.signIn({ page, emailAddress: QA_EMAIL });

  await page.goto("/dashboard");
  await page.waitForURL("**/dashboard");

  await page.context().storageState({ path: "e2e/.auth/qa.json" });
});
