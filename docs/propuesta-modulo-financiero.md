# Propuesta: Módulo financiero avanzado + pendientes de la llamada del 18/08

Este documento nace de la llamada con Oldemar del 18 de agosto de 2026 ("Coti SIAP").
Es la base para cotizar **por separado** del contrato original (que cubrió el
cotizador — ver `scope.md`), y para no perder ningún punto de lo hablado. Oldemar fue
explícito: esto es adicional, con costo aparte, y no es urgente — el cotizador base ya
lo tiene y le sirve. Lo urgente para él es avanzar en esto en la reunión presencial del
viernes.

## Cómo leer este documento

Cada punto tiene:
- **Qué pidió Oldemar** (con su propia lógica de negocio, no la mía).
- **Complejidad estimada** (S/M/L, relativo — no es una cotización en horas/dinero,
  eso lo decide Jean).
- **Qué toca del sistema actual** (para que la cotización sea realista, no una
  adivinanza).

No incluye precios — eso se define aparte, como Oldemar mismo pidió.

---

## 0. Ya resuelto en la sesión del 18/08 (sin costo — eran ajustes menores ya en curso)

Estos puntos salieron en la llamada como pendientes, pero ya se corrigieron el mismo
día en una sesión de trabajo aparte, antes de estructurar este plan. Se listan aquí
solo para que quede constancia de que están cerrados, no como pendiente de cotizar:

- Centrar la cantidad en la tabla de servicios.
- Alinear precio unitario y total a la derecha.
- Agregar el símbolo de moneda (Q./$) dentro de la tabla.
- Dirección en una sola línea continua después de "Dirección:" (y el resto de campos
  del encabezado con el mismo formato "Etiqueta: valor").
- Aclaración en el dashboard de que "Facturado" y "Cotizado" por empresa son totales
  independientes, no un embudo (surgió de un mensaje aparte de Jean, relacionado con el
  mismo tema de la llamada).

## 1. Pendientes menores de formato — de la misma conversación, aún sin hacer

Dos ajustes puntuales que Oldemar pidió en la llamada (min. 27:50–29:55) y que **no**
se tocaron todavía. Son del mismo tipo "ajuste menor" que el punto 0 — se pueden cerrar
rápido, sin necesitar cotización aparte:

- **"Oferta válida hasta" opcional**: hoy siempre se muestra la fila, incluso sin
  fecha (muestra un guion "—"). Oldemar pidió que si no se ingresó vigencia, la fila
  completa desaparezca del documento, no que quede en blanco.
- **Monto en letras en la primera hoja**: hoy cae en la segunda hoja de la propuesta.
  Al compactar el encabezado (punto 0), debería sobrar espacio para que quepa en la
  primera. Es un ajuste milimétrico de la plantilla de impresión (`docs/document-export.md`),
  no una funcionalidad nueva.

## 2. Flujo de factura sin cotización previa — ya validado, sin desarrollo pendiente

Oldemar tiene clientes con tarifa variable (ej. Q/km recorrido) donde el cliente le
envía una orden de compra periódica y él solo emite la factura — nunca existió una
cotización previa para ese monto. En la llamada se probó en vivo (min. 12:27) crear un
documento directamente con el botón "Factura" (sin pasar por "Cotización"), y
confirmar que ese monto se suma correctamente al indicador de facturado. **Funciona
como está — no requiere ningún cambio de código.** Se deja documentado acá para que
quede registro de la decisión: el botón "Factura" ya es la forma correcta de registrar
estos ingresos, sin necesidad de crear una cotización artificial para "jalar" el monto.

## 3. Filtro del dashboard por empresa (Facturado + Costo + Utilidad) — CONFIRMADO, con costo adicional

Esta es la pieza central que Oldemar pidió cotizar (min. 17:45–18:19, decisión
explícita en min. 32:30). Hoy el dashboard tiene:

- Métricas generales (Zona 1) que suman **todas** las empresas.
- "Desglose por empresa" (Zona 4) que sí separa por empresa, pero **solo** muestra
  Facturado y Cotizado — no Costo ni Utilidad por empresa individual (esos solo
  existen a nivel general, sumando las 4 empresas).

Lo que pidió Oldemar: poder entrar, elegir una empresa (ej. "Panamá"), y ver
Facturado/Costo/Utilidad **de esa empresa sola**, manteniendo también la vista general
consolidada de las 4 (no reemplazarla, agregarla).

**Qué implica construir:**
- Selector de empresa en el dashboard (ya existe el patrón de filtro por empresa en
  otras pantallas — `costos-filtros.tsx`, `clientes-filtros.tsx` — se puede replicar).
- Recalcular, cuando hay una empresa seleccionada, las mismas métricas que hoy son
  generales (Facturado del mes, Costos del mes, ISR, Utilidad neta) pero acotadas a
  esa empresa.
- Decidir si el filtro reemplaza temporalmente las Zonas 1/2 (vista "modo empresa") o
  si se agrega como una sección nueva debajo del desglose ya existente — vale la pena
  confirmar con Oldemar en la reunión del viernes cuál prefiere visualmente, antes de
  construir, con un mockup rápido o dos opciones lado a lado.

**Complejidad: M.** No requiere cambios de modelo de datos — todos los campos
necesarios (`empresaId` en Documento y en CostoOperativo) ya existen. Es
principalmente lógica de agregación condicional + UI del filtro.

## 4. Costo del período visible junto a "Tasa de conversión" — mencionado, no confirmado del todo

Oldemar pidió (min. 13:37) ver el costo operativo del mes junto al indicador de tasa
de conversión, para monitorear gasto real vs. lo que él presupuestó para la operación
ese mes. Esto tiene dos partes distintas:

- **Mostrar el costo del mes ahí mismo** (dato que el dashboard ya calcula, solo
  falta mostrarlo en esa tarjeta). Complejidad: **S** — no es un dato nuevo, es
  reubicar/agregar un dato ya calculado a una tarjeta existente. Se puede incluir junto
  con el punto 3 sin mucho costo adicional.
- **Comparar contra un presupuesto mensual definido por Oldemar** — esto sí es una
  funcionalidad nueva de verdad: implica un campo de "presupuesto mensual" configurable
  (¿por empresa? ¿general?), y una barra o indicador de "cuánto llevas gastado vs. tu
  presupuesto". Oldemar lo mencionó como idea suelta en la llamada ("si yo defino un
  presupuesto..."), no como algo que pidió formalmente construir. **Recomendación:
  confirmar con él en la reunión del viernes si de verdad quiere esto ahora, antes de
  cotizarlo** — tal como dice el CLAUDE.md del proyecto, no inventar alcance a partir de
  una idea mencionada de pasada.

## 5. Segmentación financiera por cliente (Facturado + Costo + Utilidad por cliente) — a futuro, el propio Oldemar lo baja de prioridad

Oldemar explicó (min. 20:53–22:34) que, aunque tiene pocos clientes por empresa (ej.
la Corporación tiene solo 2: CMI y "Emergent Call"), el volumen entre ellos varía
mucho (ej. un futuro cliente como Pantaleón podría representar mucho más volumen que
los otros 5-6 combinados) — y quiere poder identificar cuál cliente es realmente
rentable y cuál podría estar "en números rojos" dentro de una empresa que en general
se ve bien.

Él mismo fue explícito: **"no me urge"**, es una idea que se le fue ocurriendo en la
llamada, y "lo podríamos ver luego". Se incluye acá para no perder el punto, pero
como la fase siguiente después del filtro por empresa (punto 3), no en el mismo
paquete.

**Por qué es más complejo que el filtro por empresa — ojo con esto al cotizar:**
- "Facturado por cliente" ya es posible hoy sin cambios de modelo — `Documento` ya
  tiene `clienteId`.
- **"Costo por cliente" NO es posible hoy** — `CostoOperativo` solo se registra por
  empresa (`empresaId`), nunca por cliente. Para calcular utilidad por cliente hace
  falta:
  1. Agregar un `clienteId` **opcional** a `CostoOperativo` (nullable — un costo
     general de la empresa, como combustible o nómina, no tiene por qué atribuirse a
     un cliente específico).
  2. Definir con Oldemar qué pasa con los costos que **no** se pueden atribuir a un
     solo cliente — ¿se excluyen de "utilidad por cliente"? ¿se prorratean entre todos
     los clientes activos de esa empresa? Esto es una decisión de negocio, no técnica,
     y hay que resolverla con él antes de construir, no asumirla.
  3. Actualizar el formulario de registrar costo (`costo-form-dialog.tsx`) para poder
     elegir cliente opcionalmente.

**Complejidad: L.** Migración de base de datos + decisión de negocio pendiente +
nueva UI de filtro/selector por cliente en el dashboard.

## 6. Dominio propio — acción de Jean, no de código

Oldemar necesita que su equipo (empezando por Cleiber, ver punto 7) pueda acceder sin
depender de que Jean cree cada usuario manualmente. Hoy eso está bloqueado porque
Clerk exige un dominio propio conectado para habilitar invitaciones por correo (ver
memoria `pendiente_dominio_clerk_invitaciones`).

Acordado en la llamada (min. 30:33–31:49):
- Es una suscripción **anual**, pago único por año.
- Jean paga con su tarjeta, Oldemar le transfiere el equivalente — no hay
  notificación de pago directa a Oldemar.
- Jean se comprometió a **cotizar opciones en distintas plataformas** (Namecheap,
  Google Domains/Squarespace, GoDaddy, etc.) antes de comprar, para conseguir el mejor
  precio, y enviarle las alternativas a Oldemar para que elija.

**Esto no es un ítem de desarrollo — es una tarea pendiente de investigación de
precios or parte de Jean**, fuera de este documento técnico. Una vez comprado el
dominio, conectar a Vercel + Clerk sí habilita el flujo normal de invitaciones (en vez
del bootstrap manual que se usó para Oldemar).

## 7. Agregar a Cleiber de León Palma como usuario — acción inmediata, no cotización

Pedido explícito y ya con correo confirmado (min. 40:50–41:30): acceso individual de
Cleiber, limitado **solo** a Servicios Generales TPM (no a las otras 3 empresas).
Como el dominio propio (punto 6) todavía no está resuelto, el flujo normal de
invitación de Clerk sigue bloqueado — así que esto se haría con el mismo patrón que se
usó para dar acceso a Oldemar: crear el usuario directamente vía la API de Clerk +
vincularlo en la base de datos con `rol: MIEMBRO` y una sola `UsuarioEmpresa` (TPM),
usando una ruta temporal protegida por secreto que se borra apenas se confirma el
acceso — mismo patrón de seguridad ya usado antes (contraseña generada en el momento,
nunca hardcodeada, nunca committeada).

**Este punto no necesita cotización — es una tarea operativa que se puede hacer en
cuanto Jean tenga luz verde y el correo de Cleiber** (ya lo tiene: ver transcript).

## 8. Reunión presencial del viernes — logística, no técnico

Pendiente confirmar hora (preliminarmente tipo almuerzo, mismo formato que la reunión
anterior). Es donde se van a refinar y dar luz verde a los puntos 3, 4 y 5 de este
documento, siguiendo la misma metodología que ya usan: platicar → Jean toma nota →
arma un plan → lo refinan juntos → ejecuta.

---

## Resumen para la reunión del viernes

Orden sugerido de prioridad, según lo que el propio Oldemar transmitió como urgencia:

1. **Punto 1** (ajustes de formato) — cerrar antes de la reunión, gratis, ya iba a
   pasar de todas formas.
2. **Punto 7** (usuario de Cleiber) — cerrar en cuanto haya luz verde, no depende de
   nada más.
3. **Punto 6** (dominio) — Jean cotiza opciones y las envía antes de o durante la
   reunión.
4. **Punto 3** (filtro por empresa: Facturado/Costo/Utilidad) — el ítem principal a
   cotizar y confirmar en la reunión.
5. **Punto 4** (costo visible junto a tasa de conversión) — confirmar con Oldemar si
   solo quiere el dato visible (barato) o también el presupuesto configurable (más
   grande), antes de cotizar.
6. **Punto 5** (segmentación por cliente) — mencionar que quedó anotado, pero que es
   la fase siguiente después del punto 3, no del mismo paquete — el propio Oldemar dijo
   que no le urge.
