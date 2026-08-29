import { defineConfig, devices } from "@playwright/test";

// e2e real (navegador de verdad), separado de Vitest (unit/integración) —
// se usa puntualmente para las verificaciones de regresión de la Fase 3 que
// requieren una sesión autenticada real (selector de empresa global, capturas
// del módulo de Activos), no para cada cambio del proyecto.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/qa.json" },
      dependencies: ["setup"],
    },
  ],
  // No levanta el server automáticamente: se corre contra un `npm run dev` ya
  // activo en localhost:3000 — evita interferir con la caché de .next de una
  // sesión de desarrollo en curso (ver docs/fase3-handoff-avance.md, el
  // problema recurrente de .next corrupto en la Fase 2).
});
