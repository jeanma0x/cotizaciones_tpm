# Arquitectura técnica

## Stack

| Capa | Elección | Motivo |
|---|---|---|
| Framework | **Next.js 15 (App Router)** + TypeScript | Frontend y backend en el mismo proyecto. Server Actions para mutaciones sin escribir una API REST aparte. |
| Estilos | **Tailwind CSS** + **shadcn/ui** | Componentes accesibles (Radix por debajo) y fáciles de personalizar con los tokens de `design-system.md`. **No usar los estilos default de shadcn sin personalizar** — ver ese documento. |
| Base de datos | **Postgres** en **Neon** (serverless) | Gratis en este volumen, point-in-time recovery disponible, encaja con el modelo relacional (empresas → clientes/servicios/documentos). |
| ORM | **Prisma** | Migraciones versionadas y tipado end-to-end — crítico para no filtrar datos entre empresas por error de tipos. |
| Autenticación y roles | **Clerk** | Login, invitación de usuarios, recuperación de contraseña. El rol y la(s) empresa(s) asignadas se guardan como metadata del usuario (ver `data-model.md` y `security.md`). |
| Formularios | **React Hook Form** + **Zod** | Validación tipada, mismo schema en cliente y servidor. |
| Hosting | **Vercel** | Deploy nativo de Next.js, variables de entorno, preview deployments antes de producción. |
| Iconografía | **lucide-react** | Ya incluido en el ecosistema shadcn. Elegir íconos con sentido para logística/transporte (camión, contenedor, ruta, documento, usuario) — no íconos genéricos de "dashboard SaaS" sin relación con el negocio. |

## Estructura de carpetas (Next.js App Router)

```
app/
  (auth)/                     ← rutas de login, manejadas por Clerk
  (app)/
    layout.tsx                ← shell con sidebar (ver design-system.md)
    dashboard/page.tsx
    documentos/
      nuevo/page.tsx
      [id]/page.tsx
      [id]/editar/page.tsx
    clientes/page.tsx
    servicios/page.tsx
    empresas/page.tsx         ← solo visible para superusuario
    usuarios/page.tsx         ← solo visible para superusuario
  api/
    (solo si hace falta algo que Server Actions no cubran, ej. webhooks de Clerk)
components/
  ui/                         ← componentes shadcn, ya tematizados
  documentos/                 ← componentes específicos: tabla de ítems, vista imprimible, etc.
lib/
  auth.ts                     ← helpers de sesión/rol (getCurrentUser, getEmpresasPermitidas)
  db.ts                       ← cliente Prisma
  validations/                ← schemas Zod compartidos
  numero-a-letras.ts          ← conversión de montos a texto (ver document-export.md)
prisma/
  schema.prisma
  seed.ts                     ← datos de ejemplo, ver nota en CLAUDE.md sobre datos reales pendientes
docs/                         ← esta carpeta
```

## Server Actions vs. API Routes

Usar **Server Actions** para toda mutación (crear/editar documento, cambiar estado,
agregar cliente, etc.) — evita tener que mantener una capa de API separada y permite
que la autorización viva junto a la lógica de negocio en el servidor, no en el cliente.

Reservar **Route Handlers** (`app/api/...`) solo para:
- Webhooks (ej. eventos de Clerk para sincronizar usuarios).
- Endpoints que un tercero externo necesite llamar directamente (poco probable en este
  proyecto).

## Generación de PDF (MVP vs. mejora futura)

**Para esta entrega:** el documento se renderiza como HTML/CSS en pantalla (misma
plantilla que se ve y que se imprime) y se exporta usando la función de impresión del
navegador (`window.print()` con una hoja de estilos `@media print` dedicada). Cero
riesgo técnico, ya validado en la demo que vio el cliente.

**Mejora futura posible (no para esta entrega):** generación de PDF en el servidor con
Puppeteer/Playwright en una función serverless (o un servicio como Browserless), para
tener un archivo descargable con un clic sin pasar por el diálogo de impresión del
navegador. Dejar esto como nota para Fase 3, no bloquear la entrega actual por esto.

## Variables de entorno

```
DATABASE_URL=              # Neon
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
```

Nunca commitear `.env` ni ninguna clave. Usar las variables de entorno de Vercel para
producción y un `.env.local` (en `.gitignore`) para desarrollo.

## Orden de trabajo recomendado

1. `schema.prisma` completo, revisado por el desarrollador antes de escribir una sola
   pantalla (corregir el modelo de datos en un archivo es barato; corregirlo después de
   20 pantallas construidas sobre un modelo equivocado, no).
2. Auth + roles con Clerk, y los helpers de `lib/auth.ts` que filtran por empresa.
3. CRUD de empresas, clientes y servicios (lo más simple, valida que el aislamiento por
   empresa funciona antes de construir algo más complejo encima).
4. CRUD de documentos (cotización/propuesta/factura) reutilizando el mismo modelo.
5. Vista imprimible + exportación PDF.
6. Dashboard y métricas.
7. Pruebas de aislamiento entre empresas (ver `security.md`) — no dejar para el final.
