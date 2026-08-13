import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    // Estas pruebas pegan contra la base real de desarrollo (Neon) dentro de
    // transacciones/fixtures aisladas con prefijo QA_ — no hay una base de
    // pruebas separada todavía. No correr en paralelo con datos que colisionen.
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
