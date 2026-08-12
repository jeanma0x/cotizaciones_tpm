# Plan de construcción (7 días)

Esta es la secuencia de trabajo recomendada para el desarrollo, no una restricción de
alcance — el alcance completo es el que ya está en `scope.md` y se entrega como una sola
cosa al final de los 7 días. Lo que cambia acá es **el orden interno en el que se
construye y se valida**, para no descubrir un problema del modelo de datos el día 6.

**Regla para Claude Code:** no saltar a la fase siguiente sin cumplir los criterios de
salida de la fase actual. Si algo de una fase queda a medias, decirlo explícitamente en
vez de seguir construyendo encima.

## Día 1 — Base: schema, autenticación, esqueleto desplegado

**Qué se construye:**
- `schema.prisma` completo según `data-model.md`, migrado contra Neon.
- Proyecto Next.js inicial desplegado en Vercel (aunque sea una página en blanco con
  login).
- Integración de Clerk funcionando: login, logout, creación de usuario.
- `lib/auth.ts` con `getEmpresasPermitidas()` y `assertAccesoEmpresa()` ya escritos
  (ver `security.md`) — aunque todavía no haya nada que proteger con ellos.

**Criterio de salida (no seguir sin esto):**
- Alguien puede iniciar sesión y ver una pantalla en blanco protegida en producción
  (no solo en local).
- El schema fue revisado por el desarrollador línea por línea, no solo generado y
  aceptado.

## Día 2 — Empresas, clientes y servicios (y primera prueba de aislamiento)

**Qué se construye:**
- CRUD de Empresas (las 4, cargadas por seed).
- CRUD de Clientes y Servicios, segmentado por empresa.
- Aquí es donde se prueba por primera vez el patrón de autorización de
  `security.md` — es la parte más simple del sistema, así que es el mejor lugar para
  confirmar que el aislamiento funciona antes de que todo se vuelva más complejo.

**Criterio de salida:**
- Un usuario de prueba con acceso a una sola empresa **no puede ver ni crear** clientes
  o servicios de otra empresa, aunque adivine el ID. Probado manualmente como mínimo
  (la prueba automatizada formal es el Día 7, pero la validación manual es acá).

## Días 3–4 — Documentos: cotización, propuesta y factura

**Qué se construye:**
- Crear y editar los 3 tipos de documento, con el motor compartido descrito en
  `data-model.md` y `document-export.md`.
- Asignación de correlativo por empresa (un solo contador compartido entre los 3
  tipos, ver decisión final en `data-model.md`) dentro de una transacción que evite
  condiciones de carrera.
- Cambios de estado + historial (append-only, nunca se borra).
- Función "Duplicar".
- Fila de "Descripción general" y celdas de ítem de altura automática.

**Criterio de salida:**
- Se puede crear una cotización completa de principio a fin, editarla, cambiarle el
  estado, y duplicarla — y el correlativo nuevo nunca choca con uno existente.
- Una descripción de varios párrafos en un ítem se ve completa, sin recortarse.

## Día 5 — Exportación y envío

**Qué se construye:**
- Vista imprimible con la hoja `@media print` (ver `document-export.md`), probada con
  un documento de muchos ítems (para confirmar que sí crece a varias páginas).
- Botones de exportar PDF, y de generar borrador de mensaje por correo y WhatsApp.
- Cálculo de "Total en letras" usando la función ya provista en `document-export.md`.

**Criterio de salida:**
- Un documento con 15-20 ítems de descripción larga exporta correctamente a varias
  páginas, sin cortar contenido ni romper el encabezado o el bloque de firma.

## Día 6 — Panel, usuarios/permisos, y diseño

**Qué se construye:**
- Dashboard con métricas y filtros (`scope.md`).
- Pantalla de Usuarios: alta de un usuario `MIEMBRO` y asignación a una sola empresa
  (el caso real del socio de Oldemar).
- Aplicar el sistema de diseño de `design-system.md` de forma consistente en todas las
  pantallas construidas los días anteriores (es más fácil pulir visualmente al final,
  una vez que la funcionalidad ya está probada, que ir puliendo pantalla por pantalla
  a medias).

**Criterio de salida:**
- El socio, con su propio usuario, entra y solo ve la empresa asignada — en todas las
  pantallas (documentos, clientes, servicios, dashboard), no solo en una.

## Día 7 — Pruebas de aislamiento, datos reales, cierre

**Qué se hace (no se construye funcionalidad nueva este día):**
- Escribir y correr las 4 pruebas mínimas de `security.md` (aislamiento de lectura,
  aislamiento de escritura, acceso total del superusuario, condición de carrera del
  correlativo).
- Cargar los datos reales que Oldemar haya enviado (empresas, clientes, servicios,
  usuarios, notas, logo) reemplazando los datos de ejemplo del seed.
- Revisión final de que ningún dato de ejemplo obviamente falso quedó visible en la
  versión que va a usar Oldemar.
- Deploy final a producción.

**Criterio de salida:**
- Las 4 pruebas de seguridad pasan.
- Cero datos de prueba visibles en el sistema que Oldemar va a usar.

## Si algo se atrasa

Si un día se corre, lo primero que se recorta es el pulido visual del Día 6 (funcional
pero menos refinado), nunca las pruebas de aislamiento del Día 7 ni el criterio de
salida de correlativo sin condiciones de carrera del Día 3-4 — esas dos cosas son las
que más caro salen si fallan después de la entrega.
