# Alcance del proyecto

Este documento refleja lo acordado en el contrato firmado el 12 de agosto de 2026, con
entrega en 7 días calendario. Es la fuente de verdad sobre qué construir ahora (Fase 2)
y qué queda fuera (Fase 3, futuro, no construir sin que se pida explícitamente).

## Fase 2 — Incluido (esto es lo que se construye ahora)

### 1. Documentos

- Generación de **cotizaciones**, **propuestas de servicios** y **facturas**, con
  formato profesional propio del cliente (ver `design-system.md` y
  `document-export.md`).
- Los tres tipos comparten el mismo motor de datos (cliente, empresa, ítems, totales,
  notas) y solo cambian en rótulo/plantilla. La propuesta además incluye la portada
  institucional descrita en `business-context.md`.
- Numeración correlativa automática de **4 dígitos, iniciando en 1001**, de forma
  **independiente para cada una de las 4 empresas**.
- Cotizaciones/propuestas/facturas son **editables** después de creadas.
- Trazabilidad y control de estado por documento: Borrador, Enviada, En negociación,
  Aceptada, Rechazada, Vencida, Facturada — con historial completo de cambios (fecha +
  estado + nota).
- Función "Duplicar": copia un documento existente (cliente, servicio, precio) y le
  asigna un nuevo correlativo y fecha — pensada para la renovación mensual de clientes
  recurrentes.
- Fila de **"Descripción general"** editable, ubicada en la sección de datos del
  documento (debajo de "Oferta válida hasta"), no dentro de la tabla de ítems.
- Celdas de descripción de cada ítem que **se expanden automáticamente** según el
  contenido (comportamiento tipo Excel) — ver `document-export.md` para el detalle
  técnico.
- Encabezado/sección visual propia antes de la fila de columnas
  Cantidad/Descripción/Precio unitario/Total, separando esa sección del resto del
  documento.
- Exportación a PDF, y generación de borrador de mensaje para envío por correo
  electrónico y WhatsApp (el usuario adjunta el archivo manualmente — ninguna de las dos
  plataformas permite adjuntar automáticamente desde un sistema externo).

### 2. Catálogos

- **Catálogo de clientes**, segmentado por empresa: nombre, NIT, dirección, contacto,
  teléfono, correo. Autocompleta datos al elegir un cliente en un documento nuevo.
- **Catálogo de servicios**, segmentado por empresa: nombre del servicio + precio fijo,
  editable por el cliente. Al elegir un servicio en un documento, se sugiere cantidad 1
  y el precio ya cargado (ambos editables).

### 3. Empresas

- Gestión de las **4 empresas** del cliente (SIAP, Estados Unidos, Panamá, Individual),
  cada una con sus propios clientes, catálogo de servicios, correlativo y documentos —
  sin mezclarse entre sí bajo ninguna circunstancia. Ver `security.md`.

### 4. Usuarios y accesos

- Sistema de usuarios con dos roles:
  - **Superusuario** (Oldemar): acceso total a las 4 empresas, puede administrar
    usuarios.
  - **Miembro** (su socio, y potencialmente más socios a futuro): acceso limitado
    únicamente a la empresa que se le asigne.
- El modelo de permisos debe quedar **extensible** — agregar un tercer o cuarto usuario
  en el futuro no debe requerir cambios de esquema.

### 5. Panel / dashboard

El panel se organiza en zonas, en orden de importancia para Oldemar como dueño del
negocio — no una fila de tarjetas genéricas seguida de gráficos sueltos. Cada zona
responde una pregunta real que él se haría, no una métrica que "suena bien tener".

**Zona 1 — Estado del negocio ahora mismo (lo primero que se ve)**

- Monto vigente cotizado (pipeline: suma de Enviada + En negociación).
- Tasa de conversión (Aceptada+Facturada / total enviado).
- **Documentos que necesitan atención hoy** — un solo número que combina vencidos +
  sin respuesta hace más de 7 días + próximos a vencer en menos de 3 días. Este
  reemplaza al antiguo "sin respuesta hace 7+ días" aislado — es más útil como una
  sola señal de "esto requiere que actúes" que como tres números sueltos.

**Zona 2 — Tendencia (¿el negocio está creciendo?)**

- Gráfico de monto cotizado vs. monto facturado por mes, últimos 6-12 meses. Es la
  pregunta que un dueño de negocio se hace más — no aparecía en ninguna versión
  anterior del dashboard.

**Zona 3 — Atención requerida (lista accionable, no solo un número)**

- Reemplaza la tarjeta aislada de alertas por una lista real: cada documento vencido,
  sin respuesta, o próximo a vencer, con su cliente, correlativo y días — clickeable,
  lleva directo al documento. Un número solo no le dice a Oldemar qué hacer; una lista
  sí.

**Zona 4 — Desglose por empresa**

- Monto cotizado/facturado y cantidad de documentos por cada una de las 4 empresas
  (SIAP, Estados Unidos, Panamá, Individual) — con 4 empresas activas, un total
  general ya no alcanza, hace falta ver el aporte de cada una por separado.

**Zona 5 — Desglose por tipo de documento y por estado**

- Cantidad de cotizaciones, propuestas y facturas (cuánto de la actividad es
  negociación vs. facturación ya cerrada).
- Distribución de documentos por estado (Recharts, ya disponible en el stack).

**Zona 6 — Servicios más cotizados**

- Ranking simple de los servicios del catálogo más usados (por frecuencia o por monto
  acumulado) — le dice a Oldemar en qué está poniendo más su negocio, información que
  hoy no tiene de ningún lado.

**Zona 7 — Documentos recientes**

- Listado corto de la actividad más reciente, directo en el panel, sin tener que ir a
  la pantalla de Documentos.

Búsqueda y filtro por tipo/estado/empresa siguen viviendo en la pantalla de Documentos,
no en el panel — el panel es para entender el negocio de un vistazo, la pantalla de
Documentos es para trabajar documento por documento.

### 6. Acceso y diseño

- Acceso privado mediante usuario y contraseña individual (vía Clerk — ver
  `architecture.md`).
- **Diseño responsivo (adaptable)**: debe usarse bien desde computadora o navegador de
  celular. Esto **no** es una aplicación instalable — es el mismo sistema web,
  adaptado. No confundir con el punto excluido de "app móvil instalable" abajo.

## Fase 3 — Explícitamente fuera de alcance (no construir sin que se confirme)

Estos puntos fueron discutidos con el cliente pero **no están contratados en esta
fase**. Si en algún momento parece que "sería fácil agregar ya que estamos", no hacerlo
sin confirmar — cada uno de estos se cotiza y acuerda por separado:

- **Renovación automática** de cotizaciones recurrentes sin intervención manual (más
  allá del clic en "Duplicar", que sí está incluido).
- **Aceptación digital** del cliente vía enlace (que el cliente del cliente pueda
  aprobar una cotización en línea, con fecha/hora registrada).
- **Recordatorios automáticos** de documentos sin respuesta (notificaciones push/email
  proactivas — el dashboard sí muestra la alerta visual al entrar, pero no envía avisos
  por su cuenta).
- **Rediseño o mejora del logotipo** de la empresa.
- **Integración directa con FEL/Digifact** — el sistema no certifica ni se conecta con
  la SAT ni con Digifact de ninguna forma.
- **Aplicación móvil instalable** (tipo app de tienda de aplicaciones/PWA). El uso desde
  celular vía navegador (responsivo) sí está incluido — ver arriba.
- **Soporte y mantenimiento mensual** posterior a la entrega — es un acuerdo comercial
  aparte entre el cliente y el desarrollador, no una funcionalidad del sistema.

## Nota para decisiones de arquitectura

Aunque estos puntos de Fase 3 no se construyen ahora, el modelo de datos (ver
`data-model.md`) debe evitar decisiones que hagan **imposible o muy costoso** agregarlos
después. Ejemplos concretos:

- La tabla de documentos debe poder soportar un futuro campo de "aceptado por el
  cliente el [fecha]" sin romper nada existente.
- El modelo de usuarios/roles debe poder crecer a más roles o más granularidad sin
  reescribirse.
