# Sistema de Cotizaciones, Propuestas y Facturas — Corporación SIAP S.A

Este es un sistema web privado de gestión de cotizaciones, propuestas y facturas para
Oldemar Villagrán Zelaya, dueño de una empresa de transporte y logística (renta de
cabezales, furgones refrigerados de 48 pies y pilotos profesionales) que opera bajo
cuatro entidades distintas.

**Lee esto primero, en este orden, antes de escribir código:**

1. `docs/business-context.md` — quién es el cliente, cómo trabaja hoy, y por qué se
   construye este sistema. Sin esto, las decisiones de producto no van a tener sentido.
2. `docs/scope.md` — qué está contratado (Fase 2, lo que se entrega ahora) y qué está
   explícitamente fuera de alcance (Fase 3, futuro). **No implementar nada de Fase 3
   sin que se pida explícitamente** — pero el diseño de datos sí debe dejar espacio para
   agregarlo después sin rehacer el modelo.
3. `docs/data-model.md` — el modelo de datos y por qué está estructurado así.
4. `docs/architecture.md` — el stack técnico y la estructura de carpetas.
5. `docs/security.md` — reglas no negociables, sobre todo el aislamiento entre empresas.
6. `docs/design-system.md` — la identidad visual ya validada con el cliente. No es
   opcional ni un punto de partida — es el sistema de diseño a seguir tal cual.
7. `docs/document-export.md` — cómo deben verse y comportarse los documentos generados
   (cotización, propuesta, factura), incluyendo el comportamiento de altura dinámica que
   pidió el cliente explícitamente.
8. `docs/plan-de-construccion.md` — el orden de trabajo día a día, con criterios de
   salida por fase. **No construir todo el sistema de una sola vez** — seguir este
   orden y confirmar cada criterio de salida antes de avanzar a la fase siguiente.
9. `docs/design-review.md` — checklist de corrección abierto tras revisar capturas
   reales de la Fase 6. Mientras tenga ítems sin marcar, el criterio de salida de esa
   fase no está cumplido, sin importar qué tan avanzada esté la funcionalidad.
10. `docs/fase3-clientes-proyectos-costos-activos.md` — **léelo solo cuando se te
    pida trabajar en la Fase 3** (Clientes/Proyectos, Costos, Activos, selector de
    empresa global). Es un contrato aprobado por separado, con su propio alcance
    cerrado — no se construye nada de ahí mientras se esté trabajando en otra cosa,
    y nada de esta fase reemplaza o modifica lo ya definido en `scope.md` para la
    Fase 2, que sigue vigente tal cual.

## Reglas no negociables

- **Aislamiento por empresa.** Este cliente maneja 4 empresas (SIAP, Estados Unidos,
  Panamá, Individual) en el mismo sistema, y un socio con acceso limitado a una sola de
  ellas. Un error de aislamiento no es un bug menor — es el tipo de fallo que rompe la
  confianza del cliente de inmediato. Ver `docs/security.md` antes de tocar cualquier
  query.
- **No inventar alcance.** Si algo no está en `docs/scope.md` como incluido, no se
  construye sin confirmarlo primero. El contrato firmado con el cliente lista
  explícitamente qué está dentro y qué está fuera.
- **La identidad visual ya está definida y validada.** No generar una paleta nueva, no
  usar los defaults de shadcn/ui sin personalizar, no diseñar "genérico de dashboard
  SaaS". Ver `docs/design-system.md` — los tokens, la tipografía y el lenguaje visual
  (inspirado en manifiestos de carga / logística) ya fueron mostrados al cliente en una
  demo y en una propuesta formal, y le gustaron. Mantener consistencia con eso.
- **Los documentos (cotización/propuesta/factura) crecen en altura y en páginas.** El
  cliente fue explícito: viene de usar Excel, donde las celdas se agrandan solas con el
  contenido. Nada de descripciones truncadas ni de un documento forzado a una sola
  página. Ver `docs/document-export.md`.
- **Nunca se pierde el historial.** Ninguna cotización, propuesta o factura se borra
  físicamente. Se archivan, nunca se eliminan — la trazabilidad completa es el valor
  principal que se le vendió al cliente.

## Cómo pensar las decisiones ambiguas

Si algo no está claro en la documentación y hay que tomar una decisión de diseño o de
producto, preferir la opción que:

1. Mantenga los datos de las 4 empresas completamente separados.
2. Sea lo más simple de operar para alguien que **no sabe de sistemas** (el cliente es
   dueño de una empresa de transporte, no una persona técnica).
3. Se parezca a cómo ya trabaja hoy (Excel, Word, WhatsApp, correo) en vez de imponerle
   un flujo nuevo que tenga que aprender desde cero.

## Datos reales pendientes de recibir del cliente

El cliente todavía tiene que enviar: datos legales de las 4 empresas, catálogo real de
clientes y servicios con precios, correos de los usuarios (él + su socio), notas y
condiciones de pago reales, y el logo (engranaje azul) en buena resolución. Hasta que
lleguen, usar datos de ejemplo claramente ficticios (no inventar NITs o datos que
parezcan reales) y dejar el modelo de datos listo para cargarlos por seed script.
