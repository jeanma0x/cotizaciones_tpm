import "dotenv/config";
import { config } from "dotenv";

// Vitest no carga .env.local automáticamente como Next.js — lo hacemos acá.
config({ path: ".env.local" });
