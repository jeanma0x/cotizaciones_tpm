# Fase 3 — Estado de avance (handoff entre sesiones de Claude Code)

Este documento existe porque el trabajo de la Fase 3 arrancó en una sesión de Claude
Code y se está retomando en otra — las sesiones no comparten contexto entre sí. Antes
de tocar código, corré `git status` y `git diff` para verificar vos mismo el estado
real contra lo que dice acá — este documento es un resumen, no la fuente de verdad.

## Estado de git (sin commitear) al momento de escribir esto

```
 M CLAUDE.md
 M app/(app)/clientes/page.tsx
 M app/(app)/costos/page.tsx
 M app/(app)/dashboard/page.tsx
 M app/(app)/documentos/nuevo/page.tsx
 M app/(app)/documentos/page.tsx
 M app/(app)/layout.tsx
 M app/(app)/servicios/page.tsx
 M components/app/cliente-form-dialog.tsx
 M components/app/clientes-filtros.tsx
 M components/app/costo-form-dialog.tsx
 M components/app/costos-filtros.tsx
 M components/app/documento-form.tsx
 M components/app/documentos-filtros.tsx
 M components/app/servicio-form-dialog.tsx
 M components/app/sidebar.tsx
 M package-lock.json
 M package.json
 M prisma/schema.prisma
?? app/(app)/actions.ts
?? components/app/selector-empresa-global.tsx
?? docs/fase3-clientes-proyectos-costos-activos.md
?? docs/propuesta-modulo-financiero.md
?? lib/empresa-activa.ts
?? prisma/migrations/20260828230934_fase3_proyectos_clientes_activos/
?? tests/cookies-mock.ts
?? tests/empresa-activa.test.ts
```

Nada de esto está commiteado todavía. La migración de Prisma **ya se aplicó contra la
base de datos real de desarrollo (Neon)** — no es solo un archivo local, el schema
real de la base ya tiene las tablas nuevas.

Ojo: el archivo real del alcance se llama `docs/fase3-clientes-proyectos-costos-activos.md`
(sin guion entre "fase" y "3"), aunque el prompt original de la Fase 3 lo referencia como
`docs/fase-3-clientes-proyectos-costos-activos.md`.

`docs/propuesta-modulo-financiero.md` no está relacionado a esta fase, no tocarlo.

## Fase 3.1 — Modelo de datos: COMPLETA

- Discrepancia encontrada entre el documento y el código real: el doc dice modelo
  `Costo`, pero el modelo que ya existe en producción con exactamente esos campos
  (empresaId, categoría, descripción, monto, `fechaGasto`) se llama **`CostoOperativo`**.
  Se extendió `CostoOperativo`, no se creó un modelo `Costo` nuevo — mantené esta
  decisión.
- Agregado a `prisma/schema.prisma`:
  - Modelo `Proyecto` nuevo (clienteId, cliente, nombre, activo, createdAt; relaciones
    a `Documento[]` y `CostoOperativo[]`).
  - `Cliente`: relaciones inversas `proyectos Proyecto[]` y
    `costosOperativos CostoOperativo[]`.
  - `CostoOperativo`: campos nuevos `proyectoId String?` y `clienteId String?` (ambos
    opcionales, `onDelete: SetNull`), con sus índices.
  - `Documento`: campo nuevo `proyectoId String?` (opcional, `onDelete: SetNull`), con
    índice.
  - Enums nuevos `TipoActivo` y `CategoriaFurgon`, y modelo `Activo` nuevo (empresaId,
    tipo, categoria opcional —solo aplica si tipo=FURGON_O_PLATAFORMA—, placa, modelo,
    costo, valor, activo, createdAt).
  - `Empresa`: relación inversa `activos Activo[]`.
- Migración corrida: `npx prisma migrate dev --name fase3_proyectos_clientes_activos`
  (hace falta `set -a && source .env.local && set +a` antes, porque `DATABASE_URL` no
  está en el shell por defecto). Aplicada sin error.
- Verificación pedida por el usuario: se contó cuántos `CostoOperativo` y `Documento`
  preexistentes quedaron con los campos nuevos en `null`. Resultado: **4 de 4
  CostoOperativo** con `proyectoId` y `clienteId` en null, **4 de 4 Documento** con
  `proyectoId` en null. Cero registros con un valor inventado. Confirmado con el
  usuario antes de seguir.

## Fase 3.2 — Selector de empresa global: COMPLETA (falta verificación con Playwright)

Antes de tocar código se investigó a fondo (con un subagente Explore) cómo funcionaba
hoy el manejo de empresa en cada módulo. Hallazgos clave:

- No existía ningún concepto de "empresa activa" en todo el proyecto (nada de
  cookies, localStorage, ni Context de React). Cada página resolvía la empresa de
  forma independiente: `getEmpresasPermitidas()` + a veces un `searchParams.empresaId`
  validado contra las permitidas.
- **Costos también tenía un selector de empresa local suelto** (en `CostosFiltros`)
  que el documento original no menciona explícitamente en la lista de "módulos
  existentes" (solo nombra Panel/Documentos/Clientes/Servicios) — pero el propio doc
  dice en otra sección que Costos también debe leer la empresa activa global, así que
  se incluyó igual.
- Servicios no tenía NINGÚN filtro de empresa antes (ni local ni nada) — se le agregó.
- Los tests del proyecto son **Vitest**, no Playwright — no existía `playwright.config`
  ni carpeta `e2e/` en el repo en ese momento (aunque `@playwright/test` ya estaba
  como devDependency, sin usar).

Implementación:

- `lib/empresa-activa.ts` — `getEmpresaActivaId()`: lee la cookie `empresaActivaId`,
  pero **siempre revalida contra `getEmpresasPermitidas()`** antes de devolver un
  valor. Si la cookie trae una empresa no permitida (manipulada a mano, por ejemplo),
  se ignora y devuelve `null` (modo "todas").
- `app/(app)/actions.ts` — server action `establecerEmpresaActiva(empresaId: string |
  null)`: si `null`, borra la cookie; si trae un id, corre `assertAccesoEmpresa(empresaId)`
  (rechaza si no está permitida) **antes** de guardar la cookie httpOnly.
- `components/app/selector-empresa-global.tsx` — el `<Select>` cliente. Se
  auto-oculta si `empresas.length <= 1` (mismo criterio que ya usaban los filtros
  locales que reemplazó — un MIEMBRO de una sola empresa nunca lo ve).
- Integrado en `components/app/sidebar.tsx` (nuevo bloque debajo del header de marca)
  y en `app/(app)/layout.tsx` (pasa `empresas` y `empresaActivaId` al Sidebar).
- Eliminado el `<Select>` de empresa local en: `documentos-filtros.tsx`,
  `clientes-filtros.tsx`, `costos-filtros.tsx`.
- Todas las páginas (`dashboard`, `documentos`, `clientes`, `servicios`, `costos`)
  ahora resuelven `empresaIds` desde `getEmpresaActivaId()` en vez de (o además de)
  el query param viejo.
- **Decisión de diseño tomada (revisala si no convence)**: en los formularios de
  creación (Nuevo documento, Nuevo cliente, Nuevo servicio, Nuevo costo), si hay una
  empresa activa global elegida, el campo "Empresa" del formulario se precarga con
  ella **y se bloquea** (ya no se elige ahí, se elige en el selector global). Si el
  modo es "todas las empresas", el campo queda libre como antes. Se aplicó a los 4
  formularios por consistencia, aunque el doc original solo menciona explícitamente
  el de "Nuevo documento".
- Verificación de regresión corrida:
  - `rm -rf .next && npx next build` → compila limpio, 0 errores de tipos.
  - `eslint` en los 18 archivos tocados → 0 errores, 0 warnings. (`npm run lint` sin
    filtrar tira ~927 errores preexistentes, pero **todos** dentro de `.next/types/*`
    generado y `next-env.d.ts` — nada relacionado a este trabajo, confirmado
    comparando con una página no tocada.)
  - Vitest completo: **11/11 pasan** — los 6 tests preexistentes de
    `tests/security.test.ts` siguen intactos, más 5 nuevos en
    `tests/empresa-activa.test.ts` (con un mock nuevo `tests/cookies-mock.ts` para
    `next/headers`) probando: un MIEMBRO no puede establecer una empresa ajena como
    activa (rechaza, la cookie nunca se escribe), sí puede establecer la suya, `null`
    limpia la preferencia, y una cookie manipulada a mano con una empresa no permitida
    se ignora en la lectura.
  - Smoke test manual sin autenticar: `/dashboard`, `/documentos`, `/documentos/nuevo`,
    `/clientes`, `/servicios`, `/costos`, `/empresas` (esta última no tocada, de
    control) → todas responden 307 a sign-in, igual que antes.
  - **Lo que falta**: el doc original pide probar con Playwright que un MIEMBRO sigue
    sin ver otra empresa aunque el selector global esté de por medio. Esto **no se
    hizo todavía** — es el trabajo que estaba en curso cuando se interrumpió esta
    sesión (ver siguiente sección).

## Trabajo EN CURSO, sin terminar: infraestructura de Playwright + usuario QA

El usuario preguntó si se podía usar Playwright y cómo dar una sesión autenticada.
Se eligió la opción de usuario QA dedicado + llaves de prueba (ya existentes:
`.env.local` ya tiene `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...` y
`CLERK_SECRET_KEY=sk_test_...`, no hace falta generar nada nuevo ahí).

**Ya hecho:**

- `npm install --save-dev @clerk/testing` → instalado (ver `package.json`/
  `package-lock.json` modificados).
- Chromium de Playwright ya está cacheado localmente
  (`~/Library/Caches/ms-playwright`) — no hace falta `npx playwright install`.
- Usuario real creado en Clerk (instancia de desarrollo) vía `clerk users create
  --secret-key ... --email "qa.playwright+tpm@guatemaltek.com" --password
  "QaTpm2026!Fase3" --first-name QA --last-name Playwright --yes --json`.
  **Clerk user id: `user_3IZrhu5eoXrJ43biCSiuyoI8jni`**.
- Ese usuario vinculado en la base de datos real (Prisma `Usuario`, rol `MIEMBRO`) a
  **dos** empresas de prueba nuevas (para que el selector global sea visible — con
  una sola empresa se auto-oculta):
  - `QA_PLAYWRIGHT_Empresa de Pruebas (dato de prueba, no real)` — id
    `cmtdyzqot00008og7m0aya14r`
  - `QA_PLAYWRIGHT_Empresa B (dato de prueba, no real)` — id `cmtdz1s3k00008oz7kn9ntlhk`
  - Usuario app (Prisma) id: `cmtdyzqxx00018og7endpekdj`
  - **Importante**: estas empresas y este usuario son datos reales y permanentes en
    la base de dev — no se autolimpian como los fixtures `QA_ISOLACION_` de Vitest
    (que sí se borran en `afterAll`). Hay que borrarlos a mano cuando ya no hagan
    falta.
- Se inspeccionó el código fuente de `@clerk/testing` para confirmar (no asumir) los
  nombres exactos de env vars que espera `clerkSetup()` — coinciden con lo que ya hay
  en `.env.local`, no hace falta renombrar nada. También se encontró que existe
  `clerk.signIn({ page, emailAddress })`, un login sin contraseña (vía sign-in
  token/ticket del Backend API) más simple que llenar el formulario — probablemente
  el camino a usar en el setup de Playwright.

**NO hecho todavía (acá quedó cortado):**

- `playwright.config.ts` — no existe.
- `e2e/auth.setup.ts` (el global setup que haría `clerkSetup()` + `clerk.signIn(...)`
  + guardar `storageState`) — no existe.
- `.gitignore` — no actualizado para excluir `/e2e/.auth/`, `/test-results/`,
  `/playwright-report/`.
- Ningún test/spec de Playwright existe todavía.
- Playwright nunca se corrió ni una vez.

## Decisiones/convenciones a preservar

- Reglas de `CLAUDE.md`: nunca romper nada ya en producción, aislamiento por empresa
  es la regla #1, no inventar alcance, seguir el orden de los docs estrictamente.
- Extender `CostoOperativo`, no un modelo `Costo` nuevo, siempre que el doc de Fase 3
  diga "Costo".
- Verificación de regresión por fase (según el propio doc de Fase 3): login funciona,
  se puede crear una cotización/propuesta/factura de cada tipo, aislamiento entre
  empresas intacto (MIEMBRO no ve otra empresa), panel carga sin errores, diseño
  (sidebar/tema/animaciones) sin cambios.
- Convención de server actions: un `actions.ts` por módulo en
  `app/(app)/<modulo>/actions.ts` — se agregó uno transversal nuevo en
  `app/(app)/actions.ts` para la empresa activa.
- Nunca confiar en un `empresaId` que venga del cliente — siempre
  `assertAccesoEmpresa()` en el servidor. Este patrón se preservó/reforzó en todo lo
  tocado.
- Fixtures de prueba: `QA_ISOLACION_` (fixtures existentes de Vitest, se autolimpian)
  vs. `QA_PLAYWRIGHT_` (los que se crearon para e2e, **permanentes**, no se autolimpian).

## Diff completo de lo hecho hasta ahora

<details>
<summary>Ver diff completo (click para expandir)</summary>

```diff
diff --git a/app/(app)/actions.ts b/app/(app)/actions.ts
new file mode 100644
index 0000000..11417e0
--- /dev/null
+++ b/app/(app)/actions.ts
@@ -0,0 +1,29 @@
+"use server";
+
+import { cookies } from "next/headers";
+import { assertAccesoEmpresa } from "@/lib/auth";
+import { EMPRESA_ACTIVA_COOKIE } from "@/lib/empresa-activa";
+
+// Fase 3.2 — selector de empresa global. `null` significa "todas las
+// empresas permitidas" (borra la cookie). Un id revalida SIEMPRE contra
+// assertAccesoEmpresa antes de guardarse — el <Select> del cliente ya
+// filtra a las empresas permitidas, pero esta acción no confía en eso: si
+// alguien llamara esta acción directamente con un empresaId ajeno, se
+// rechaza acá igual que en cualquier otra mutación del sistema.
+export async function establecerEmpresaActiva(empresaId: string | null) {
+  const cookieStore = await cookies();
+
+  if (empresaId === null) {
+    cookieStore.delete(EMPRESA_ACTIVA_COOKIE);
+    return;
+  }
+
+  await assertAccesoEmpresa(empresaId);
+
+  cookieStore.set(EMPRESA_ACTIVA_COOKIE, empresaId, {
+    httpOnly: true,
+    sameSite: "lax",
+    path: "/",
+    maxAge: 60 * 60 * 24 * 365,
+  });
+}
diff --git a/app/(app)/clientes/page.tsx b/app/(app)/clientes/page.tsx
index 75cb028..30074cb 100644
--- a/app/(app)/clientes/page.tsx
+++ b/app/(app)/clientes/page.tsx
@@ -7,24 +7,28 @@ import { PageHeader } from "@/components/app/page-header";
 import { Button } from "@/components/ui/button";
 import { getEmpresasPermitidas } from "@/lib/auth";
 import { db } from "@/lib/db";
+import { getEmpresaActivaId } from "@/lib/empresa-activa";
 
 const ACCION_CLIENTE_LABEL: Record<string, string> = { CREADO: "Creado", EDITADO: "Editado" };
 
 export default async function ClientesPage({
   searchParams,
 }: {
-  searchParams: Promise<{ q?: string; empresaId?: string }>;
+  searchParams: Promise<{ q?: string }>;
 }) {
-  const { q, empresaId } = await searchParams;
-  const empresasPermitidas = await getEmpresasPermitidas();
+  const { q } = await searchParams;
+  const [empresasPermitidas, empresaActivaId] = await Promise.all([
+    getEmpresasPermitidas(),
+    getEmpresaActivaId(),
+  ]);
+  // Fase 3.2: el selector de empresa global reemplaza el filtro local de
+  // empresa que vivía en ClientesFiltros.
+  const empresaIds = empresaActivaId ? [empresaActivaId] : empresasPermitidas;
 
   const [clientes, empresas, auditoria] = await Promise.all([
     db.cliente.findMany({
       where: {
-        empresaId:
-          empresaId && empresasPermitidas.includes(empresaId)
-            ? empresaId
-            : { in: empresasPermitidas },
+        empresaId: { in: empresaIds },
         ...(q
           ? {
               OR: [
@@ -42,7 +46,7 @@ export default async function ClientesPage({
       orderBy: { nombre: "asc" },
     }),
     db.clienteAuditoria.findMany({
-      where: { empresaId: { in: empresasPermitidas } },
+      where: { empresaId: { in: empresaIds } },
       include: { usuario: true },
       orderBy: { fecha: "desc" },
       take: 100,
@@ -85,6 +89,7 @@ export default async function ClientesPage({
             <HistorialAuditoriaSheet titulo="Historial de clientes" entradas={filasAuditoria} />
             <ClienteFormDialog
               empresas={empresas}
+              empresaActivaId={empresaActivaId}
               trigger={
                 <Button>
                   <PlusIcon className="h-4 w-4" />
@@ -96,7 +101,7 @@ export default async function ClientesPage({
         }
       />
 
-      <ClientesFiltros empresas={empresas} placeholder="Buscar por nombre o NIT…" />
+      <ClientesFiltros placeholder="Buscar por nombre o NIT…" />
 
       <ClientesTable
         data={filas}
diff --git a/app/(app)/costos/page.tsx b/app/(app)/costos/page.tsx
index 0c19685..16f0db3 100644
--- a/app/(app)/costos/page.tsx
+++ b/app/(app)/costos/page.tsx
@@ -8,6 +8,7 @@ import { PageHeader } from "@/components/app/page-header";
 import { Button } from "@/components/ui/button";
 import { getEmpresasPermitidas } from "@/lib/auth";
 import { db } from "@/lib/db";
+import { getEmpresaActivaId } from "@/lib/empresa-activa";
 import { CATEGORIA_COSTO_LABELS } from "@/lib/validations/costo";
 import type { CategoriaCosto, Prisma } from "@prisma/client";
 
@@ -15,17 +16,21 @@ export default async function CostosPage({
   searchParams,
 }: {
   searchParams: Promise<{
-    empresaId?: string;
     categoria?: string;
     desde?: string;
     hasta?: string;
   }>;
 }) {
-  const { empresaId, categoria, desde, hasta } = await searchParams;
-  const empresasPermitidas = await getEmpresasPermitidas();
+  const { categoria, desde, hasta } = await searchParams;
+  const [empresasPermitidas, empresaActivaId] = await Promise.all([
+    getEmpresasPermitidas(),
+    getEmpresaActivaId(),
+  ]);
 
-  const empresaFiltrada =
-    empresaId && empresasPermitidas.includes(empresaId) ? empresaId : undefined;
+  // Fase 3.2: el selector de empresa global reemplaza el filtro local de
+  // empresa que vivía en CostosFiltros.
+  const empresaFiltrada = empresaActivaId ?? undefined;
+  const empresaIds = empresaActivaId ? [empresaActivaId] : empresasPermitidas;
   const categoriaFiltrada =
     categoria && categoria in CATEGORIA_COSTO_LABELS ? (categoria as CategoriaCosto) : undefined;
 
@@ -54,7 +59,7 @@ export default async function CostosPage({
     // Capado a 100 — es una bitácora de actividad reciente, no un reporte
     // contable completo (para eso está Exportar, sobre costos_operativos).
     db.costoOperativoAuditoria.findMany({
-      where: { empresaId: { in: empresasPermitidas } },
+      where: { empresaId: { in: empresaIds } },
       include: { empresa: true, usuario: true },
       orderBy: { fecha: "desc" },
       take: 100,
@@ -92,9 +97,10 @@ export default async function CostosPage({
         actions={
           <div className="flex gap-2">
             <HistorialCostosSheet entradas={filasAuditoria} mostrarEmpresa={empresas.length > 1} />
-            <ExportarCostosDialog empresaId={empresaId} />
+            <ExportarCostosDialog empresaId={empresaFiltrada} />
             <CostoFormDialog
               empresas={empresas}
+              empresaActivaId={empresaActivaId}
               trigger={
                 <Button>
                   <PlusIcon className="h-4 w-4" />
@@ -106,7 +112,7 @@ export default async function CostosPage({
         }
       />
 
-      <CostosFiltros empresas={empresas} />
+      <CostosFiltros />
 
       <CostosTable
         data={filas}
diff --git a/app/(app)/dashboard/page.tsx b/app/(app)/dashboard/page.tsx
index b7abe9e..2737dc9 100644
--- a/app/(app)/dashboard/page.tsx
+++ b/app/(app)/dashboard/page.tsx
@@ -22,6 +22,7 @@ import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/com
 import { getEmpresasPermitidas } from "@/lib/auth";
 import { getUsuarioActual } from "@/lib/current-usuario";
 import { db } from "@/lib/db";
+import { getEmpresaActivaId } from "@/lib/empresa-activa";
 import { CATEGORIA_COSTO_LABELS } from "@/lib/validations/costo";
 
 const TIPO_LABELS: Record<string, string> = {
@@ -81,11 +82,17 @@ function MontoPorMoneda({
 // - "Atención hoy" (Zona 1 y 3): unión deduplicada de VENCIDA + sin
 //   respuesta hace más de 7 días + próximas a vencer en 3 días o menos.
 export default async function DashboardPage() {
-  const [empresasPermitidas, usuario] = await Promise.all([
+  const [empresasPermitidasTodas, usuario, empresaActivaId] = await Promise.all([
     getEmpresasPermitidas(),
     getUsuarioActual(),
+    getEmpresaActivaId(),
   ]);
   const primerNombre = usuario?.nombre?.split(" ")[0] ?? "";
+  // Selector de empresa global (Fase 3.2): si el usuario eligió una empresa
+  // activa, el panel se agrega solo para esa empresa; si eligió "todas" (o
+  // solo tiene una permitida), el comportamiento es igual al de antes de
+  // esta fase — agregado de todas las permitidas.
+  const empresasPermitidas = empresaActivaId ? [empresaActivaId] : empresasPermitidasTodas;
   const where = { empresaId: { in: empresasPermitidas } };
   const hoy = new Date();
   const hace12Meses = new Date(hoy.getTime() - MESES_TENDENCIA * 31 * UN_DIA_MS);
diff --git a/app/(app)/documentos/nuevo/page.tsx b/app/(app)/documentos/nuevo/page.tsx
index f4cbc94..c4cd087 100644
--- a/app/(app)/documentos/nuevo/page.tsx
+++ b/app/(app)/documentos/nuevo/page.tsx
@@ -4,9 +4,13 @@ import { PageHeader } from "@/components/app/page-header";
 import { VolverLink } from "@/components/app/volver-link";
 import { getEmpresasPermitidas } from "@/lib/auth";
 import { db } from "@/lib/db";
+import { getEmpresaActivaId } from "@/lib/empresa-activa";
 
 export default async function NuevoDocumentoPage() {
-  const empresasPermitidas = await getEmpresasPermitidas();
+  const [empresasPermitidas, empresaActivaId] = await Promise.all([
+    getEmpresasPermitidas(),
+    getEmpresaActivaId(),
+  ]);
 
   const [empresas, clientes, servicios, usuariosConFirma] = await Promise.all([
     db.empresa.findMany({
@@ -41,6 +45,7 @@ export default async function NuevoDocumentoPage() {
       </div>
       <DocumentoForm
         empresas={empresas}
+        empresaActivaId={empresaActivaId}
         clientes={clientes}
         servicios={servicios.map((s) => ({ ...s, precioFijo: Number(s.precioFijo) }))}
         usuarios={usuariosConFirma.map((u) => ({
diff --git a/app/(app)/documentos/page.tsx b/app/(app)/documentos/page.tsx
index 6592416..d97c39c 100644
--- a/app/(app)/documentos/page.tsx
+++ b/app/(app)/documentos/page.tsx
@@ -7,6 +7,7 @@ import { PageHeader } from "@/components/app/page-header";
 import { Button } from "@/components/ui/button";
 import { getEmpresasPermitidas } from "@/lib/auth";
 import { db } from "@/lib/db";
+import { getEmpresaActivaId } from "@/lib/empresa-activa";
 import type { Prisma } from "@prisma/client";
 
 const TIPOS_VALIDOS = ["COTIZACION", "PROPUESTA", "FACTURA"];
@@ -26,12 +27,15 @@ export default async function DocumentosPage({
   searchParams: Promise<Record<string, string | undefined>>;
 }) {
   const params = await searchParams;
-  const empresasPermitidas = await getEmpresasPermitidas();
+  const [empresasPermitidas, empresaActivaId] = await Promise.all([
+    getEmpresasPermitidas(),
+    getEmpresaActivaId(),
+  ]);
 
-  const empresaIds =
-    params.empresaId && empresasPermitidas.includes(params.empresaId)
-      ? [params.empresaId]
-      : empresasPermitidas;
+  // Fase 3.2: el selector de empresa global reemplaza el filtro local de
+  // empresa que vivía en DocumentosFiltros — "todas" cuando no hay empresa
+  // activa elegida, igual que antes.
+  const empresaIds = empresaActivaId ? [empresaActivaId] : empresasPermitidas;
 
   const where: Prisma.DocumentoWhereInput = {
     empresaId: { in: empresaIds },
@@ -54,21 +58,15 @@ export default async function DocumentosPage({
     ];
   }
 
-  const [documentos, empresas] = await Promise.all([
-    db.documento.findMany({
-      where,
-      include: {
-        empresa: true,
-        cliente: true,
-        historial: { orderBy: { fecha: "desc" }, take: 1 },
-      },
-      orderBy: { createdAt: "desc" },
-    }),
-    db.empresa.findMany({
-      where: { id: { in: empresasPermitidas } },
-      orderBy: { nombre: "asc" },
-    }),
-  ]);
+  const documentos = await db.documento.findMany({
+    where,
+    include: {
+      empresa: true,
+      cliente: true,
+      historial: { orderBy: { fecha: "desc" }, take: 1 },
+    },
+    orderBy: { createdAt: "desc" },
+  });
 
   const hoy = Date.now();
   const UN_DIA_MS = 24 * 60 * 60 * 1000;
@@ -110,7 +108,7 @@ export default async function DocumentosPage({
         }
       />
 
-      <DocumentosFiltros empresas={empresas} />
+      <DocumentosFiltros />
 
       <DocumentosTable data={filas} />
     </div>
diff --git a/app/(app)/layout.tsx b/app/(app)/layout.tsx
index adef9ef..23cf785 100644
--- a/app/(app)/layout.tsx
+++ b/app/(app)/layout.tsx
@@ -4,6 +4,7 @@ import { MobileTopBar } from "@/components/app/mobile-topbar";
 import { PageTransition } from "@/components/app/page-transition";
 import { Sidebar } from "@/components/app/sidebar";
 import { getUsuarioActual } from "@/lib/current-usuario";
+import { getEmpresaActivaId } from "@/lib/empresa-activa";
 
 export default async function AppLayout({
   children,
@@ -12,7 +13,10 @@ export default async function AppLayout({
 }) {
   await auth.protect({ unauthenticatedUrl: "/sign-in" });
 
-  const usuario = await getUsuarioActual();
+  const [usuario, empresaActivaId] = await Promise.all([
+    getUsuarioActual(),
+    getEmpresaActivaId(),
+  ]);
 
   if (!usuario) {
     return (
@@ -31,7 +35,13 @@ export default async function AppLayout({
     // se oculta y solo queda visible el documento (que el Dialog porta fuera
     // de este div).
     <div className="app-shell flex h-screen overflow-hidden">
-      <Sidebar esSuperusuario={usuario.rol === "SUPERUSUARIO"} />
+      <Sidebar
+        esSuperusuario={usuario.rol === "SUPERUSUARIO"}
+        empresas={usuario.empresas
+          .map((ue) => ue.empresa)
+          .sort((a, b) => a.nombre.localeCompare(b.nombre))}
+        empresaActivaId={empresaActivaId}
+      />
       <div className="flex flex-1 flex-col overflow-hidden">
         <MobileTopBar />
         <main className="flex-1 overflow-y-auto bg-surface-sunken p-4 md:p-8">
diff --git a/app/(app)/servicios/page.tsx b/app/(app)/servicios/page.tsx
index 6f5097e..da5bccb 100644
--- a/app/(app)/servicios/page.tsx
+++ b/app/(app)/servicios/page.tsx
@@ -7,6 +7,7 @@ import { ServiciosTable, type FilaServicio } from "@/components/app/servicios-ta
 import { Button } from "@/components/ui/button";
 import { getEmpresasPermitidas } from "@/lib/auth";
 import { db } from "@/lib/db";
+import { getEmpresaActivaId } from "@/lib/empresa-activa";
 
 const ACCION_SERVICIO_LABEL: Record<string, string> = { CREADO: "Creado", EDITADO: "Editado" };
 
@@ -16,12 +17,19 @@ export default async function ServiciosPage({
   searchParams: Promise<{ q?: string }>;
 }) {
   const { q } = await searchParams;
-  const empresasPermitidas = await getEmpresasPermitidas();
+  const [empresasPermitidas, empresaActivaId] = await Promise.all([
+    getEmpresasPermitidas(),
+    getEmpresaActivaId(),
+  ]);
+  // Fase 3.2: antes de esta fase, Servicios nunca tuvo forma de filtrar por
+  // una sola empresa — ahora respeta el selector global igual que los demás
+  // módulos.
+  const empresaIds = empresaActivaId ? [empresaActivaId] : empresasPermitidas;
 
   const [servicios, empresas, auditoria] = await Promise.all([
     db.servicio.findMany({
       where: {
-        empresaId: { in: empresasPermitidas },
+        empresaId: { in: empresaIds },
         ...(q ? { nombre: { contains: q, mode: "insensitive" } } : {}),
       },
       include: { empresa: true },
@@ -32,7 +40,7 @@ export default async function ServiciosPage({
       orderBy: { nombre: "asc" },
     }),
     db.servicioAuditoria.findMany({
-      where: { empresaId: { in: empresasPermitidas } },
+      where: { empresaId: { in: empresaIds } },
       include: { usuario: true },
       orderBy: { fecha: "desc" },
       take: 100,
@@ -69,6 +77,7 @@ export default async function ServiciosPage({
             <HistorialAuditoriaSheet titulo="Historial de servicios" entradas={filasAuditoria} />
             <ServicioFormDialog
               empresas={empresas}
+              empresaActivaId={empresaActivaId}
               trigger={
                 <Button>
                   <PlusIcon className="h-4 w-4" />
diff --git a/components/app/cliente-form-dialog.tsx b/components/app/cliente-form-dialog.tsx
index 52e6eae..afcb3fd 100644
--- a/components/app/cliente-form-dialog.tsx
+++ b/components/app/cliente-form-dialog.tsx
@@ -54,10 +54,13 @@ export function ClienteFormDialog({
   empresas,
   cliente,
   trigger,
+  empresaActivaId = null,
 }: {
   empresas: Empresa[];
   cliente?: Cliente;
   trigger: React.ReactNode;
+  // Fase 3.2 — selector de empresa global. Solo relevante al crear.
+  empresaActivaId?: string | null;
 }) {
   const [open, setOpen] = useState(false);
   const router = useRouter();
@@ -74,7 +77,7 @@ export function ClienteFormDialog({
   } = useForm<ClienteFormValues, unknown, ClienteInput>({
     resolver: zodResolver(clienteSchema),
     defaultValues: {
-      empresaId: cliente?.empresaId ?? empresas[0]?.id ?? "",
+      empresaId: cliente?.empresaId ?? empresaActivaId ?? empresas[0]?.id ?? "",
       tipo: cliente?.tipo ?? "INDIVIDUAL",
       nombre: cliente?.nombre ?? "",
       nit: cliente?.nit ?? "",
@@ -122,7 +125,7 @@ export function ClienteFormDialog({
               items={Object.fromEntries(empresas.map((e) => [e.id, e.nombre]))}
               value={watch("empresaId")}
               onValueChange={(v) => setValue("empresaId", v as string)}
-              disabled={empresas.length <= 1}
+              disabled={empresas.length <= 1 || (!esEdicion && Boolean(empresaActivaId))}
             >
               <SelectTrigger id="empresaId" className="w-full">
                 <SelectValue placeholder="Seleccioná una empresa" />
diff --git a/components/app/clientes-filtros.tsx b/components/app/clientes-filtros.tsx
index 4381926..f631af9 100644
--- a/components/app/clientes-filtros.tsx
+++ b/components/app/clientes-filtros.tsx
@@ -8,21 +8,10 @@ import {
   InputGroupAddon,
   InputGroupInput,
 } from "@/components/ui/input-group";
-import {
-  Select,
-  SelectContent,
-  SelectItem,
-  SelectTrigger,
-  SelectValue,
-} from "@/components/ui/select";
 
-export function ClientesFiltros({
-  empresas,
-  placeholder,
-}: {
-  empresas: { id: string; nombre: string }[];
-  placeholder: string;
-}) {
+// Fase 3.2: el filtro de empresa que vivía acá se reemplazó por el selector
+// de empresa global (ver components/app/selector-empresa-global.tsx).
+export function ClientesFiltros({ placeholder }: { placeholder: string }) {
   const router = useRouter();
   const searchParams = useSearchParams();
   const [, startTransition] = useTransition();
@@ -50,11 +39,6 @@ export function ClientesFiltros({
     debounceRef.current = setTimeout(() => setParam("q", value), 350);
   }
 
-  const empresasItems = {
-    TODOS: "Todas las empresas",
-    ...Object.fromEntries(empresas.map((e) => [e.id, e.nombre])),
-  };
-
   return (
     <div className="flex flex-wrap items-center gap-2">
       <InputGroup className="w-64">
@@ -67,24 +51,6 @@ export function ClientesFiltros({
           onChange={(e) => onBuscarChange(e.target.value)}
         />
       </InputGroup>
-      {empresas.length > 1 && (
-        <Select
-          items={empresasItems}
-          value={searchParams.get("empresaId") ?? "TODOS"}
-          onValueChange={(v) => setParam("empresaId", v as string)}
-        >
-          <SelectTrigger className="w-48">
-            <SelectValue />
-          </SelectTrigger>
-          <SelectContent>
-            {Object.entries(empresasItems).map(([value, label]) => (
-              <SelectItem key={value} value={value}>
-                {label}
-              </SelectItem>
-            ))}
-          </SelectContent>
-        </Select>
-      )}
     </div>
   );
 }
diff --git a/components/app/costo-form-dialog.tsx b/components/app/costo-form-dialog.tsx
index f57890a..34fefea 100644
--- a/components/app/costo-form-dialog.tsx
+++ b/components/app/costo-form-dialog.tsx
@@ -51,10 +51,14 @@ export function CostoFormDialog({
   empresas,
   costo,
   trigger,
+  empresaActivaId = null,
 }: {
   empresas: Empresa[];
   costo?: Costo;
   trigger: React.ReactNode;
+  // Fase 3.2 — selector de empresa global. Solo relevante al crear: precarga
+  // y bloquea el campo con la empresa activa, igual que en DocumentoForm.
+  empresaActivaId?: string | null;
 }) {
   const [open, setOpen] = useState(false);
   const router = useRouter();
@@ -70,7 +74,7 @@ export function CostoFormDialog({
   } = useForm<CostoOperativoFormValues, unknown, CostoOperativoInput>({
     resolver: zodResolver(costoOperativoSchema),
     defaultValues: {
-      empresaId: costo?.empresaId ?? empresas[0]?.id ?? "",
+      empresaId: costo?.empresaId ?? empresaActivaId ?? empresas[0]?.id ?? "",
       categoria: costo?.categoria ?? "COMBUSTIBLE",
       descripcion: costo?.descripcion ?? "",
       monto: costo?.monto ?? 0,
@@ -109,7 +113,7 @@ export function CostoFormDialog({
               items={Object.fromEntries(empresas.map((e) => [e.id, e.nombre]))}
               value={watch("empresaId")}
               onValueChange={(v) => setValue("empresaId", v as string)}
-              disabled={empresas.length <= 1}
+              disabled={empresas.length <= 1 || (!esEdicion && Boolean(empresaActivaId))}
             >
               <SelectTrigger id="empresaId" className="w-full">
                 <SelectValue placeholder="Seleccioná una empresa" />
diff --git a/components/app/costos-filtros.tsx b/components/app/costos-filtros.tsx
index b48d42c..913053e 100644
--- a/components/app/costos-filtros.tsx
+++ b/components/app/costos-filtros.tsx
@@ -16,11 +16,9 @@ const CATEGORIAS_ITEMS = {
   ...CATEGORIA_COSTO_LABELS,
 };
 
-export function CostosFiltros({
-  empresas,
-}: {
-  empresas: { id: string; nombre: string }[];
-}) {
+// Fase 3.2: el filtro de empresa que vivía acá se reemplazó por el selector
+// de empresa global (ver components/app/selector-empresa-global.tsx).
+export function CostosFiltros() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const [, startTransition] = useTransition();
@@ -34,35 +32,11 @@ export function CostosFiltros({
     });
   }
 
-  const empresasItems = {
-    TODOS: "Todas las empresas",
-    ...Object.fromEntries(empresas.map((e) => [e.id, e.nombre])),
-  };
-
   const desde = searchParams.get("desde") ?? "";
   const hasta = searchParams.get("hasta") ?? "";
 
   return (
     <div className="flex flex-wrap items-center gap-2">
-      {empresas.length > 1 && (
-        <Select
-          items={empresasItems}
-          value={searchParams.get("empresaId") ?? "TODOS"}
-          onValueChange={(v) => setParam("empresaId", v as string)}
-        >
-          <SelectTrigger className="w-48">
-            <SelectValue />
-          </SelectTrigger>
-          <SelectContent>
-            {Object.entries(empresasItems).map(([value, label]) => (
-              <SelectItem key={value} value={value}>
-                {label}
-              </SelectItem>
-            ))}
-          </SelectContent>
-        </Select>
-      )}
-
       <Select
         items={CATEGORIAS_ITEMS}
         value={searchParams.get("categoria") ?? "TODAS"}
diff --git a/components/app/documento-form.tsx b/components/app/documento-form.tsx
index cbd5f66..00e5396 100644
--- a/components/app/documento-form.tsx
+++ b/components/app/documento-form.tsx
@@ -99,12 +99,19 @@ export function DocumentoForm({
   servicios,
   usuarios,
   documento,
+  empresaActivaId = null,
 }: {
   empresas: Empresa[];
   clientes: Cliente[];
   servicios: Servicio[];
   usuarios: UsuarioFirmante[];
   documento?: DocumentoExistente;
+  // Fase 3.2 — selector de empresa global. Solo relevante al CREAR: si el
+  // usuario ya tiene una empresa activa elegida, el campo se precarga con
+  // ella y se bloquea (se cambia desde el selector global, no acá). Al
+  // editar, `documento?.empresaId` siempre gana — la empresa de un
+  // documento existente nunca cambia (ver actions.ts).
+  empresaActivaId?: string | null;
 }) {
   const esEdicion = Boolean(documento);
   const [submitting, setSubmitting] = useState(false);
@@ -126,7 +133,7 @@ export function DocumentoForm({
   } = useForm<DocumentoFormValues, unknown, DocumentoInput>({
     resolver: zodResolver(documentoSchema),
     defaultValues: {
-      empresaId: documento?.empresaId ?? empresas[0]?.id ?? "",
+      empresaId: documento?.empresaId ?? empresaActivaId ?? empresas[0]?.id ?? "",
       tipo: (documento?.tipo as DocumentoFormValues["tipo"]) ?? "COTIZACION",
       clienteId: documento?.clienteId ?? "",
       fecha: documento ? aFechaInput(documento.fecha) : aFechaInput(new Date()),
@@ -274,7 +281,7 @@ export function DocumentoForm({
                 setValue("empresaId", v as string);
                 setValue("clienteId", "");
               }}
-              disabled={esEdicion || empresas.length <= 1}
+              disabled={esEdicion || empresas.length <= 1 || Boolean(empresaActivaId)}
             >
               <SelectTrigger id="empresaId" className="w-full">
                 <SelectValue placeholder="Seleccioná una empresa" />
diff --git a/components/app/documentos-filtros.tsx b/components/app/documentos-filtros.tsx
index 4870df7..57d2b05 100644
--- a/components/app/documentos-filtros.tsx
+++ b/components/app/documentos-filtros.tsx
@@ -28,11 +28,11 @@ const ESTADOS = {
   FACTURADA: "Facturada",
 };
 
-export function DocumentosFiltros({
-  empresas,
-}: {
-  empresas: { id: string; nombre: string }[];
-}) {
+// Fase 3.2: el filtro de empresa que vivía acá se reemplazó por el selector
+// de empresa global (ver components/app/selector-empresa-global.tsx) —
+// dejar dos selectores de empresa distintos en pantalla confundía cuál
+// mandaba. Este componente ya no recibe `empresas`.
+export function DocumentosFiltros() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const [, startTransition] = useTransition();
@@ -60,11 +60,6 @@ export function DocumentosFiltros({
     debounceRef.current = setTimeout(() => setParam("q", value), 350);
   }
 
-  const empresasItems = {
-    TODOS: "Todas las empresas",
-    ...Object.fromEntries(empresas.map((e) => [e.id, e.nombre])),
-  };
-
   return (
     <div className="flex flex-wrap items-center gap-2">
       <InputGroup className="w-64">
@@ -109,24 +104,6 @@ export function DocumentosFiltros({
           ))}
         </SelectContent>
       </Select>
-      {empresas.length > 1 && (
-        <Select
-          items={empresasItems}
-          value={searchParams.get("empresaId") ?? "TODOS"}
-          onValueChange={(v) => setParam("empresaId", v as string)}
-        >
-          <SelectTrigger className="w-48">
-            <SelectValue />
-          </SelectTrigger>
-          <SelectContent>
-            {Object.entries(empresasItems).map(([value, label]) => (
-              <SelectItem key={value} value={value}>
-                {label}
-              </SelectItem>
-            ))}
-          </SelectContent>
-        </Select>
-      )}
     </div>
   );
 }
diff --git a/components/app/selector-empresa-global.tsx b/components/app/selector-empresa-global.tsx
new file mode 100644
index 0000000..83b7814
--- /dev/null
+++ b/components/app/selector-empresa-global.tsx
@@ -0,0 +1,76 @@
+"use client";
+
+import { Building2Icon } from "lucide-react";
+import { useRouter } from "next/navigation";
+import { useTransition } from "react";
+import {
+  Select,
+  SelectContent,
+  SelectItem,
+  SelectTrigger,
+  SelectValue,
+} from "@/components/ui/select";
+import { establecerEmpresaActiva } from "@/app/(app)/actions";
+import { cn } from "@/lib/utils";
+
+const TODAS = "__TODAS__";
+
+// Fase 3.2 — reemplaza cualquier selector de empresa local (Documentos,
+// Clientes, y el que vivía suelto en "Nuevo documento"): un solo lugar que
+// filtra Panel/Documentos/Clientes/Servicios/Costos/Activos a la vez. Nunca
+// se oculta condicionado por rol — un MIEMBRO con una sola empresa permitida
+// simplemente no ve el selector (no hay nada entre qué elegir), igual que ya
+// hacían los filtros locales que reemplaza.
+export function SelectorEmpresaGlobal({
+  empresas,
+  empresaActivaId,
+  colapsado,
+}: {
+  empresas: { id: string; nombre: string }[];
+  empresaActivaId: string | null;
+  colapsado?: boolean;
+}) {
+  const router = useRouter();
+  const [isPending, startTransition] = useTransition();
+
+  if (empresas.length <= 1) return null;
+
+  const items = {
+    [TODAS]: "Todas las empresas",
+    ...Object.fromEntries(empresas.map((e) => [e.id, e.nombre])),
+  };
+
+  function onChange(valor: string) {
+    const nuevaEmpresaId = valor === TODAS ? null : valor;
+    startTransition(async () => {
+      await establecerEmpresaActiva(nuevaEmpresaId);
+      router.refresh();
+    });
+  }
+
+  return (
+    <Select
+      items={items}
+      value={empresaActivaId ?? TODAS}
+      onValueChange={(v) => onChange(v as string)}
+      disabled={isPending}
+    >
+      <SelectTrigger
+        aria-label="Empresa activa"
+        className={cn(
+          "w-full text-sidebar-foreground",
+          colapsado && "w-8 justify-center border-none bg-transparent p-0",
+        )}
+      >
+        {colapsado ? <Building2Icon className="h-4 w-4" /> : <SelectValue />}
+      </SelectTrigger>
+      <SelectContent>
+        {Object.entries(items).map(([value, label]) => (
+          <SelectItem key={value} value={value}>
+            {label}
+          </SelectItem>
+        ))}
+      </SelectContent>
+    </Select>
+  );
+}
diff --git a/components/app/servicio-form-dialog.tsx b/components/app/servicio-form-dialog.tsx
index 51058a6..a5bf8b1 100644
--- a/components/app/servicio-form-dialog.tsx
+++ b/components/app/servicio-form-dialog.tsx
@@ -45,10 +45,13 @@ export function ServicioFormDialog({
   empresas,
   servicio,
   trigger,
+  empresaActivaId = null,
 }: {
   empresas: Empresa[];
   servicio?: Servicio;
   trigger: React.ReactNode;
+  // Fase 3.2 — selector de empresa global. Solo relevante al crear.
+  empresaActivaId?: string | null;
 }) {
   const [open, setOpen] = useState(false);
   const router = useRouter();
@@ -64,7 +67,7 @@ export function ServicioFormDialog({
   } = useForm<ServicioFormValues, unknown, ServicioInput>({
     resolver: zodResolver(servicioSchema),
     defaultValues: {
-      empresaId: servicio?.empresaId ?? empresas[0]?.id ?? "",
+      empresaId: servicio?.empresaId ?? empresaActivaId ?? empresas[0]?.id ?? "",
       nombre: servicio?.nombre ?? "",
       precioFijo: servicio ? Number(servicio.precioFijo) : 0,
       activo: servicio?.activo ?? true,
@@ -102,7 +105,7 @@ export function ServicioFormDialog({
               items={Object.fromEntries(empresas.map((e) => [e.id, e.nombre]))}
               value={watch("empresaId")}
               onValueChange={(v) => setValue("empresaId", v as string)}
-              disabled={empresas.length <= 1}
+              disabled={empresas.length <= 1 || (!esEdicion && Boolean(empresaActivaId))}
             >
               <SelectTrigger id="empresaId" className="w-full">
                 <SelectValue placeholder="Seleccioná una empresa" />
diff --git a/components/app/sidebar.tsx b/components/app/sidebar.tsx
index 7b39f2e..6021d1e 100644
--- a/components/app/sidebar.tsx
+++ b/components/app/sidebar.tsx
@@ -23,6 +23,7 @@ import Link from "next/link";
 import { usePathname } from "next/navigation";
 import { useEffect, useState } from "react";
 import { Button } from "@/components/ui/button";
+import { SelectorEmpresaGlobal } from "@/components/app/selector-empresa-global";
 import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
 import { cn } from "@/lib/utils";
 
@@ -79,7 +80,15 @@ function SelectorTema({ colapsado }: { colapsado: boolean }) {
   );
 }
 
-export function Sidebar({ esSuperusuario }: { esSuperusuario: boolean }) {
+export function Sidebar({
+  esSuperusuario,
+  empresas,
+  empresaActivaId,
+}: {
+  esSuperusuario: boolean;
+  empresas: { id: string; nombre: string }[];
+  empresaActivaId: string | null;
+}) {
   const pathname = usePathname();
   const items = esSuperusuario ? [...NAV_ITEMS, ...NAV_ITEMS_SUPERUSUARIO] : NAV_ITEMS;
 
@@ -179,6 +188,16 @@ export function Sidebar({ esSuperusuario }: { esSuperusuario: boolean }) {
         </Button>
       </div>
 
+      {empresas.length > 1 && (
+        <div className={cn("px-3 pb-3", colapsadoEfectivo && "flex justify-center")}>
+          <SelectorEmpresaGlobal
+            empresas={empresas}
+            empresaActivaId={empresaActivaId}
+            colapsado={colapsadoEfectivo}
+          />
+        </div>
+      )}
+
       <div className="px-3">
         {colapsadoEfectivo ? (
           <Tooltip>
diff --git a/lib/empresa-activa.ts b/lib/empresa-activa.ts
new file mode 100644
index 0000000..77e5fff
--- /dev/null
+++ b/lib/empresa-activa.ts
@@ -0,0 +1,19 @@
+import { cookies } from "next/headers";
+import { getEmpresasPermitidas } from "@/lib/auth";
+
+// Fase 3.2 — selector de empresa global. La cookie es una PREFERENCIA de
+// navegación (comodidad de UI), nunca una fuente de autorización: cada
+// lectura acá revalida contra getEmpresasPermitidas() antes de devolver un
+// valor. Si la cookie trae una empresa que el usuario ya no tiene permitida
+// (o nunca tuvo — por ejemplo, manipulada a mano), se ignora en silencio y
+// se vuelve al modo "todas las permitidas", igual que si no hubiera cookie.
+export const EMPRESA_ACTIVA_COOKIE = "empresaActivaId";
+
+export async function getEmpresaActivaId(): Promise<string | null> {
+  const cookieStore = await cookies();
+  const valor = cookieStore.get(EMPRESA_ACTIVA_COOKIE)?.value;
+  if (!valor) return null;
+
+  const permitidas = await getEmpresasPermitidas();
+  return permitidas.includes(valor) ? valor : null;
+}
diff --git a/package.json b/package.json
index 3e0ec86..a6c839c 100644
--- a/package.json
+++ b/package.json
@@ -39,7 +39,7 @@
     "zod": "^4.4.3"
   },
   "devDependencies": {
-    "@clerk/testing": "^2.2.22",
+    "@clerk/testing": "^2.2.31",
     "@eslint/eslintrc": "^3.3.6",
     "@playwright/test": "^1.62.1",
     "@tailwindcss/postcss": "^4",
diff --git a/prisma/migrations/20260828230934_fase3_proyectos_clientes_activos/migration.sql b/prisma/migrations/20260828230934_fase3_proyectos_clientes_activos/migration.sql
new file mode 100644
index 0000000..4610ca3
--- /dev/null
+++ b/prisma/migrations/20260828230934_fase3_proyectos_clientes_activos/migration.sql
@@ -0,0 +1,69 @@
+-- CreateEnum
+CREATE TYPE "TipoActivo" AS ENUM ('CAMION', 'MAQUINARIA_SOLDAR', 'EQUIPO_ARRASTRE', 'FURGON_O_PLATAFORMA', 'OTRO');
+
+-- CreateEnum
+CREATE TYPE "CategoriaFurgon" AS ENUM ('PORTACONTENEDOR_40', 'PORTACONTENEDOR_20', 'PLATAFORMA', 'CISTERNA', 'FURGON_SECO', 'FURGON_REFRIGERADO', 'LOWBOY');
+
+-- AlterTable
+ALTER TABLE "costos_operativos" ADD COLUMN     "clienteId" TEXT,
+ADD COLUMN     "proyectoId" TEXT;
+
+-- AlterTable
+ALTER TABLE "documentos" ADD COLUMN     "proyectoId" TEXT;
+
+-- CreateTable
+CREATE TABLE "proyectos" (
+    "id" TEXT NOT NULL,
+    "clienteId" TEXT NOT NULL,
+    "nombre" TEXT NOT NULL,
+    "activo" BOOLEAN NOT NULL DEFAULT true,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+
+    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "activos" (
+    "id" TEXT NOT NULL,
+    "empresaId" TEXT NOT NULL,
+    "tipo" "TipoActivo" NOT NULL,
+    "categoria" "CategoriaFurgon",
+    "placa" TEXT,
+    "modelo" TEXT,
+    "costo" DECIMAL(12,2) NOT NULL,
+    "valor" DECIMAL(12,2) NOT NULL,
+    "activo" BOOLEAN NOT NULL DEFAULT true,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+
+    CONSTRAINT "activos_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateIndex
+CREATE INDEX "proyectos_clienteId_idx" ON "proyectos"("clienteId");
+
+-- CreateIndex
+CREATE INDEX "activos_empresaId_idx" ON "activos"("empresaId");
+
+-- CreateIndex
+CREATE INDEX "costos_operativos_proyectoId_idx" ON "costos_operativos"("proyectoId");
+
+-- CreateIndex
+CREATE INDEX "costos_operativos_clienteId_idx" ON "costos_operativos"("clienteId");
+
+-- CreateIndex
+CREATE INDEX "documentos_proyectoId_idx" ON "documentos"("proyectoId");
+
+-- AddForeignKey
+ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "costos_operativos" ADD CONSTRAINT "costos_operativos_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "costos_operativos" ADD CONSTRAINT "costos_operativos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "documentos" ADD CONSTRAINT "documentos_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "activos" ADD CONSTRAINT "activos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
diff --git a/prisma/schema.prisma b/prisma/schema.prisma
index 1e5c1e8..6ff5be3 100644
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -74,6 +74,7 @@ model Empresa {
   clientesAuditoria         ClienteAuditoria[]
   serviciosAuditoria        ServicioAuditoria[]
   auditoria                 EmpresaAuditoria[]
+  activos                   Activo[]
 
   @@map("empresas")
 }
@@ -145,11 +146,33 @@ model Cliente {
   // INDIVIDUAL sigue usando el campo `email` de acá arriba, sin tocar nada.
   contactos  ContactoCliente[]
   auditoria  ClienteAuditoria[]
+  // Fase 3: un cliente puede tener varios proyectos, y costos asociados
+  // directamente a él (sin proyecto específico) — ver modelo Proyecto.
+  proyectos  Proyecto[]
+  costosOperativos CostoOperativo[]
 
   @@index([empresaId])
   @@map("clientes")
 }
 
+// Fase 3 — nueva entidad para cruzar utilidad (facturado − costos) por
+// proyecto de un cliente, no solo por cliente en general. Ver
+// docs/fase3-clientes-proyectos-costos-activos.md.
+model Proyecto {
+  id        String   @id @default(cuid())
+  clienteId String
+  cliente   Cliente  @relation(fields: [clienteId], references: [id], onDelete: Cascade)
+  nombre    String
+  activo    Boolean  @default(true)
+  createdAt DateTime @default(now())
+
+  documentos Documento[]
+  costos     CostoOperativo[]
+
+  @@index([clienteId])
+  @@map("proyectos")
+}
+
 enum AccionCliente {
   CREADO
   EDITADO
@@ -223,9 +246,19 @@ model CostoOperativo {
   fechaGasto  DateTime
   createdAt   DateTime       @default(now())
 
+  // Fase 3: opcionales — un costo registrado antes de esta fase, o uno que
+  // el usuario decide no ligar a ningún cliente/proyecto en particular,
+  // queda en null. Nunca inferir un valor por defecto acá.
+  proyectoId String?
+  proyecto   Proyecto? @relation(fields: [proyectoId], references: [id], onDelete: SetNull)
+  clienteId  String?
+  cliente    Cliente?  @relation(fields: [clienteId], references: [id], onDelete: SetNull)
+
   auditoria CostoOperativoAuditoria[]
 
   @@index([empresaId, fechaGasto])
+  @@index([proyectoId])
+  @@index([clienteId])
   @@map("costos_operativos")
 }
 
@@ -353,6 +386,11 @@ model Documento {
   correlativo        Int
   clienteId          String?
   cliente            Cliente?        @relation(fields: [clienteId], references: [id])
+  // Fase 3: opcional — documentos previos a esta fase quedan en null, nunca
+  // se les infiere un proyecto. Validar en el server action que, si se
+  // envía, el proyecto pertenezca al mismo clienteId de este documento.
+  proyectoId         String?
+  proyecto           Proyecto?       @relation(fields: [proyectoId], references: [id], onDelete: SetNull)
   fecha              DateTime
   vigenciaDias       Int?            @default(15)
   condicionesPago    String?
@@ -380,6 +418,7 @@ model Documento {
 
   @@unique([empresaId, correlativo])
   @@index([empresaId, tipo, estado])
+  @@index([proyectoId])
   @@map("documentos")
 }
 
@@ -406,3 +445,43 @@ model HistorialEstado {
 
   @@map("historial_estado")
 }
+
+enum TipoActivo {
+  CAMION
+  MAQUINARIA_SOLDAR
+  EQUIPO_ARRASTRE
+  FURGON_O_PLATAFORMA
+  OTRO
+}
+
+enum CategoriaFurgon {
+  PORTACONTENEDOR_40
+  PORTACONTENEDOR_20
+  PLATAFORMA
+  CISTERNA
+  FURGON_SECO
+  FURGON_REFRIGERADO
+  LOWBOY
+}
+
+// Fase 3 — registro de camiones, maquinaria y equipo por empresa. `costo` es
+// lo que costó adquirirlo/traerlo (incluyendo traslado si vino del
+// extranjero); `valor` es su valor actual como activo ya operando en
+// Guatemala. `modelo` reemplaza el concepto de "año" — pedido explícito del
+// cliente. `categoria` solo aplica cuando tipo = FURGON_O_PLATAFORMA.
+model Activo {
+  id        String           @id @default(cuid())
+  empresaId String
+  empresa   Empresa          @relation(fields: [empresaId], references: [id])
+  tipo      TipoActivo
+  categoria CategoriaFurgon?
+  placa     String?
+  modelo    String?
+  costo     Decimal          @db.Decimal(12, 2)
+  valor     Decimal          @db.Decimal(12, 2)
+  activo    Boolean          @default(true)
+  createdAt DateTime         @default(now())
+
+  @@index([empresaId])
+  @@map("activos")
+}
diff --git a/tests/cookies-mock.ts b/tests/cookies-mock.ts
new file mode 100644
index 0000000..0c4c074
--- /dev/null
+++ b/tests/cookies-mock.ts
@@ -0,0 +1,30 @@
+// Mock mínimo de next/headers `cookies()` para probar lib/empresa-activa.ts y
+// la server action que la establece, sin necesitar un request real de
+// Next.js. Los tests controlan el valor guardado llamando setMockCookie() /
+// clearMockCookies() directamente, simulando una cookie manipulada a mano
+// (sin pasar por establecerEmpresaActiva) cuando hace falta probar que la
+// lectura revalida igual.
+const store = new Map<string, string>();
+
+export function setMockCookie(name: string, value: string) {
+  store.set(name, value);
+}
+
+export function clearMockCookies() {
+  store.clear();
+}
+
+export async function cookies() {
+  return {
+    get(name: string) {
+      const value = store.get(name);
+      return value === undefined ? undefined : { name, value };
+    },
+    set(name: string, value: string) {
+      store.set(name, value);
+    },
+    delete(name: string) {
+      store.delete(name);
+    },
+  };
+}
diff --git a/tests/empresa-activa.test.ts b/tests/empresa-activa.test.ts
new file mode 100644
index 0000000..bb03f4d
--- /dev/null
+++ b/tests/empresa-activa.test.ts
@@ -0,0 +1,98 @@
+// Fase 3.2 — verificación de que el selector de empresa global nunca es una
+// vía de autorización: la cookie "empresaActivaId" es solo una preferencia
+// de navegación, revalidada contra empresasPermitidas en cada lectura y en
+// la server action que la escribe. Mismo patrón de fixtures/mock que
+// tests/security.test.ts (prefijo QA_ISOLACION_, clerk-mock).
+import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
+import { setMockUserId } from "./clerk-mock";
+import { clearMockCookies, setMockCookie } from "./cookies-mock";
+
+vi.mock("@clerk/nextjs/server", async () => {
+  const mock = await import("./clerk-mock");
+  return { auth: mock.auth };
+});
+vi.mock("next/headers", async () => {
+  const mock = await import("./cookies-mock");
+  return { cookies: mock.cookies };
+});
+
+const { db } = await import("@/lib/db");
+const { getEmpresaActivaId, EMPRESA_ACTIVA_COOKIE } = await import("@/lib/empresa-activa");
+const { establecerEmpresaActiva } = await import("@/app/(app)/actions");
+
+const PREFIJO = "QA_ISOLACION_EMPRESA_ACTIVA_";
+
+let empresaA: { id: string };
+let empresaB: { id: string };
+let miembroA: { id: string; clerkId: string };
+
+beforeAll(async () => {
+  empresaA = await db.empresa.create({
+    data: { nombre: `${PREFIJO}Empresa A (dato de prueba, no real)` },
+  });
+  empresaB = await db.empresa.create({
+    data: { nombre: `${PREFIJO}Empresa B (dato de prueba, no real)` },
+  });
+  miembroA = await db.usuario.create({
+    data: {
+      clerkId: `${PREFIJO}clerk_miembro_a`,
+      nombre: `${PREFIJO}Miembro A`,
+      email: `${PREFIJO.toLowerCase()}miembro-a@example.test`,
+      rol: "MIEMBRO",
+      empresas: { create: { empresaId: empresaA.id } },
+    },
+  });
+});
+
+afterAll(async () => {
+  await db.usuarioEmpresa.deleteMany({ where: { usuarioId: miembroA.id } });
+  await db.usuario.deleteMany({ where: { id: miembroA.id } });
+  await db.empresa.deleteMany({ where: { id: { in: [empresaA.id, empresaB.id] } } });
+});
+
+beforeEach(() => {
+  setMockUserId(null);
+  clearMockCookies();
+});
+afterEach(() => {
+  clearMockCookies();
+});
+
+describe("establecerEmpresaActiva — nunca confía en el cliente", () => {
+  it("rechaza establecer una empresa que el usuario no tiene permitida", async () => {
+    setMockUserId(miembroA.clerkId);
+    await expect(establecerEmpresaActiva(empresaB.id)).rejects.toThrow(/no autorizado/i);
+    // La cookie nunca debió escribirse tras el rechazo.
+    expect(await getEmpresaActivaId()).toBeNull();
+  });
+
+  it("acepta y guarda una empresa que el usuario sí tiene permitida", async () => {
+    setMockUserId(miembroA.clerkId);
+    await establecerEmpresaActiva(empresaA.id);
+    expect(await getEmpresaActivaId()).toBe(empresaA.id);
+  });
+
+  it("null borra la preferencia (modo 'todas las permitidas')", async () => {
+    setMockUserId(miembroA.clerkId);
+    await establecerEmpresaActiva(empresaA.id);
+    expect(await getEmpresaActivaId()).toBe(empresaA.id);
+    await establecerEmpresaActiva(null);
+    expect(await getEmpresaActivaId()).toBeNull();
+  });
+});
+
+describe("getEmpresaActivaId — revalida la cookie en cada lectura, nunca confía ciegamente", () => {
+  it("ignora una cookie manipulada a mano con una empresa no permitida", async () => {
+    setMockUserId(miembroA.clerkId);
+    // Simula una cookie alterada sin pasar por establecerEmpresaActiva —
+    // exactamente el escenario contra el que el selector global debe blindar.
+    setMockCookie(EMPRESA_ACTIVA_COOKIE, empresaB.id);
+    expect(await getEmpresaActivaId()).toBeNull();
+  });
+
+  it("devuelve el valor solo si sigue estando entre las empresas permitidas", async () => {
+    setMockUserId(miembroA.clerkId);
+    setMockCookie(EMPRESA_ACTIVA_COOKIE, empresaA.id);
+    expect(await getEmpresaActivaId()).toBe(empresaA.id);
+  });
+});
```

</details>

## Pendiente (en orden, sin saltar pasos, según el documento)

- **Terminar la infraestructura de Playwright** (o decidir con el usuario si conviene,
  dado que ya se armó el usuario QA) — hace falta antes de poder cumplir la
  verificación de regresión de 3.2 (MIEMBRO no ve otra empresa con Playwright) y antes
  de las capturas que pide 3.5.
- **Fase 3.3** — Catálogo de Proyectos por cliente (no existe ninguna UI todavía),
  agregar cliente/proyecto a `CostoFormDialog` y `DocumentoForm`, validar que un
  documento no se asocie a un proyecto de otro cliente.
- **Fase 3.4** — KPIs de utilidad por proyecto en el panel (usando `fechaGasto`, nunca
  fecha de pago/cierre), desglose Facturado vs. Aceptado-no-facturado, filtros
  combinables.
- **Fase 3.5** — Módulo de Activos completo (listado/alta/edición), con el sistema de
  diseño ya validado, capturas con Playwright.
- **Fase 3.6** — Nombre de PDF con correlativo; auditar (sin rediseñar) el cálculo de
  ISR estimado actual en `app/(app)/dashboard/page.tsx` — hoy aplica Régimen Opcional
  Simplificado (5% sobre los primeros Q30,000 mensuales por contribuyente, 7% sobre el
  excedente), solo a empresas con `codigoPais="502"` (Guatemala). Confirmar si es
  correcto o corregirlo.
- **Reporte final** fase por fase, con capturas de Playwright de pantallas nuevas y de
  Panel/Documentos/Clientes existentes — no dar la fase por cerrada hasta que las 6
  verificaciones de regresión (una por sub-fase) hayan pasado.
