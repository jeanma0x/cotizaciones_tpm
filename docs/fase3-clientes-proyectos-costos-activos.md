# Fase 3 — Clientes, Proyectos, Costos y Activos

Esta fase fue cotizada y aprobada por separado (Q6,000, pago único) a partir de una
reunión con el cliente el 25 de agosto de 2026. **No es una ampliación silenciosa de
`scope.md`** — es un contrato nuevo, con su propio alcance cerrado. Todo lo que ya
existe (cotizaciones, propuestas, facturas, catálogos, las 4 empresas, usuarios y
permisos) sigue tal cual está — esta fase se construye **encima** de eso, sin romperlo.

**Regla central de esta fase, sin excepción: nada de lo que ya funciona en producción
puede quebrarse.** Cada paso de esta fase incluye una verificación explícita de que el
sistema existente sigue intacto, no solo de que lo nuevo funciona.

## Por qué existe esta fase (contexto del cliente)

El cliente fue explícito en la reunión: hoy no tiene forma de saber, con números
reales, cuánta utilidad le está dejando cada proyecto — cruza ingresos (lo que
factura) contra gastos (lo que le cuesta operar) solo de memoria o en Excel aparte.
Esta fase existe para resolver exactamente eso, más un control de sus activos
(camiones, maquinaria) que hoy tampoco tiene en ningún sistema.

## Alcance contratado (los 6 módulos de la cotización aprobada)

1. **Clientes y Proyectos** — nueva entidad Proyecto, ligada a un Cliente. KPIs de
   utilidad y gasto cruzados por proyecto, filtros por cliente/proyecto/empresa/fecha
   en el panel.
2. **Costos por Cliente/Proyecto** — el módulo de Costos ya existe (formulario "Nuevo
   costo" con Empresa, Categoría, Descripción, Monto, Fecha del gasto); se le agrega
   la asociación a Cliente/Proyecto.
3. **Campo "Proyecto" en documentos** — cotizaciones y facturas pueden asociarse a un
   proyecto específico del cliente, no solo al cliente en general.
4. **Selector de empresa global** — elegir la empresa activa una sola vez y que todos
   los módulos se filtren automáticamente por ella.
5. **Módulo de Activos** — registro de camiones, maquinaria y equipo por empresa.
6. **Nombre de PDF con correlativo** — ajuste puntual en la exportación.

Además, sin costo adicional: revisar que el cálculo de ISR estimado que ya existe en
el panel esté funcionando correctamente (no es una funcionalidad nueva de esta fase,
es una verificación).

## Modelo de datos — qué se agrega

```prisma
model Proyecto {
  id         String   @id @default(cuid())
  clienteId  String
  cliente    Cliente  @relation(fields: [clienteId], references: [id], onDelete: Cascade)
  nombre     String
  activo     Boolean  @default(true)
  createdAt  DateTime @default(now())

  documentos Documento[]
  costos     CostoOperativo[]

  @@index([clienteId])
  @@map("proyectos")
}
```

Cambios sobre modelos existentes (ver `data-model.md` para el resto de cada modelo,
esto es solo lo que se agrega):

- **`CostoOperativo`** (ya existe en producción): agregar `proyectoId String?` (opcional — un costo puede
  quedar asociado solo al cliente en general, sin un proyecto específico) y
  `clienteId String?`. La `fecha` que ya existe en el formulario ("Fecha del gasto")
  **es la fecha de devengo** — el mes al que pertenece contablemente el gasto, no la
  fecha en que el proveedor lo factura o lo cierra. Ejemplo real del cliente: un
  crédito de combustible solicitado en agosto pero facturado por el proveedor en
  septiembre debe seguir contando como gasto de agosto. No agregar un campo nuevo para
  esto — ya existe el campo correcto, solo asegurarse de que todas las agregaciones
  (KPIs, filtros por mes) usen esta fecha, nunca una fecha de cierre/pago.
- **`Documento`** (ya existe): agregar `proyectoId String?` (opcional). Validar que el
  `proyectoId`, si se envía, pertenezca al mismo `clienteId` del documento — un
  documento no puede asociarse a un proyecto de un cliente distinto.
- **`Activo`** (nuevo):

```prisma
enum TipoActivo {
  CAMION
  MAQUINARIA_SOLDAR
  EQUIPO_ARRASTRE
  FURGON_O_PLATAFORMA
  OTRO
}

enum CategoriaFurgon {
  PORTACONTENEDOR_40
  PORTACONTENEDOR_20
  PLATAFORMA
  CISTERNA
  FURGON_SECO
  FURGON_REFRIGERADO
  LOWBOY
}

model Activo {
  id         String            @id @default(cuid())
  empresaId  String
  empresa    Empresa           @relation(fields: [empresaId], references: [id])
  tipo       TipoActivo
  categoria  CategoriaFurgon?  // solo aplica cuando tipo = FURGON_O_PLATAFORMA
  placa      String?
  modelo     String?           // reemplaza el concepto de "año" — el cliente pidió "Modelo"
  costo      Decimal           @db.Decimal(12, 2)
  valor      Decimal           @db.Decimal(12, 2)
  activo     Boolean           @default(true)
  createdAt  DateTime          @default(now())

  @@index([empresaId])
  @@map("activos")
}
```

  Nota conceptual del cliente, dejarla reflejada en la UI (no solo en el modelo): un
  equipo traído del extranjero tiene un costo de traslado inicial, pero una vez que
  está operando en Guatemala pasa a existir como un Activo con su propio valor — el
  costo de traerlo no es un gasto recurrente, es parte del costo de adquisición de
  ese activo.

## El cambio más delicado de esta fase: selector de empresa global

Esto no es solo una pieza de interfaz — es un cambio transversal que toca cada
consulta del sistema. Extender el patrón de `security.md`:

- La "empresa activa" se guarda como preferencia del usuario (puede vivir en el
  cliente — localStorage o cookie — pero **nunca se confía en ese valor para
  autorización**).
- Cada Server Action y cada query sigue llamando a `assertAccesoEmpresa(empresaId)`
  con la empresa que el cliente dice tener activa — si esa empresa no está entre las
  permitidas para el usuario (`getEmpresasPermitidas()`), se rechaza, sin importar qué
  mande el cliente. El selector global es una comodidad de navegación, no un atajo de
  seguridad.
- Todos los módulos existentes (Panel, Documentos, Clientes, Servicios) y los nuevos
  de esta fase (Costos, Activos, Proyectos) leen la misma empresa activa — no debe
  quedar ningún módulo con su propio selector de empresa suelto, como el que hoy
  existe solo dentro del formulario de "Nuevo documento".

## KPIs nuevos del panel

- Utilidad por proyecto = suma de documentos facturados de ese proyecto − suma de
  costos de ese proyecto (usando la fecha de devengo del costo, no la de pago).
- Desglose de "facturado" vs. "pendiente de cobro" — el panel ya distingue
  "Facturado (histórico)"; agregar la contraparte de lo que está Aceptado pero aún no
  pasó a Facturada.
- Filtros combinables por cliente, proyecto, empresa y rango de fecha.

## Explícitamente fuera de esta fase (no construir sin confirmarlo aparte)

- Integración real con proveedores (de combustible o cualquier otro) — los costos se
  siguen registrando manualmente.
- Depreciación automática de activos con el tiempo — por ahora solo costo y valor
  estáticos, editables a mano.
- Cualquier exportación contable formal (balances, estados de resultados) — los KPIs
  de esta fase son para uso interno del panel, no un módulo contable completo.

## Plan de implementación por fases

Mismo criterio que `plan-de-construccion.md` usó para la Fase 2: no construir todo de
una sola vez, confirmar cada criterio de salida antes de seguir, y en **cada** fase
correr una verificación de regresión ademas de la verificación de lo nuevo.

**Verificación de regresión (correr esto después de CADA fase, no solo al final):**
login funciona, se puede crear una cotización/propuesta/factura de cada tipo, el
aislamiento entre empresas sigue intacto (un usuario `MIEMBRO` no ve otra empresa), el
panel carga sin errores, y el diseño (sidebar, tema claro/oscuro, animaciones) sigue
como estaba.

### Fase 3.1 — Modelo de datos

Migración de Prisma con `Proyecto`, la extensión de `CostoOperativo` y `Documento`, y el nuevo
modelo `Activo`. Mostrar el `schema.prisma` completo y esperar confirmación antes de
migrar contra la base de datos de producción — mismo cuidado que en la Fase 2.
**Criterio de salida:** migración aplicada sin error, datos existentes intactos
(ningún documento o costo previo perdió información).

### Fase 3.2 — Selector de empresa global

Es la base de la que dependen las fases siguientes — hacerla temprano. Reemplazar
cualquier selector de empresa local (como el que hoy vive solo en "Nuevo documento")
por uno global que todos los módulos existentes ya respeten.
**Criterio de salida:** cambiar la empresa activa desde un solo lugar filtra Panel,
Documentos, Clientes y Servicios a la vez, sin tener que volver a elegirla en cada
módulo.

### Fase 3.3 — Costos y Documentos con Cliente/Proyecto

Agregar los campos de asociación al formulario de Costos (ya existente) y al de Nuevo
documento. Catálogo de Proyectos por cliente (crear/editar proyectos).
**Criterio de salida:** se puede crear un proyecto para un cliente, asociarle un costo
y una cotización, y ambos quedan correctamente ligados a ese proyecto.

### Fase 3.4 — KPIs de utilidad cruzada en el panel

Depende de que 3.1–3.3 ya estén funcionando con datos reales de prueba.
**Criterio de salida:** el panel muestra utilidad por proyecto (facturado menos
costos) y permite filtrar por cliente/proyecto/empresa/fecha.

### Fase 3.5 — Módulo de Activos

Pantalla nueva completa: listado, alta, edición, catálogo de categorías. Aplicar el
mismo sistema de diseño ya establecido (`design-system.md`) — íconos, tarjetas,
buscador, nada de tablas genéricas sin el tratamiento visual que ya tiene el resto del
sistema.
**Criterio de salida:** se puede registrar un camión y un furgón con su categoría,
costo, valor y modelo, y aparecen correctamente segmentados por empresa.

### Fase 3.6 — Ajustes finales

Nombre del PDF exportado con el correlativo incluido. Verificación del cálculo de ISR
estimado ya existente (confirmar la regla exacta que aplica y que el monto calculado
sea correcto).
**Criterio de salida:** el archivo descargado incluye el correlativo en el nombre; el
cálculo de ISR fue revisado y confirmado (o corregido, si se encontró un error).

## Verificación final antes de decir que la fase está lista

Con Playwright, capturas de las pantallas nuevas y de las que ya existían (para
confirmar que no cambiaron de forma no intencional), y un reporte fase por fase —
mismo formato que ya se usó en la Fase 2: qué se hizo, qué se verificó, qué quedó
pendiente y por qué. No dar por cerrada la fase completa hasta que las 6 verificaciones
de regresión (una por cada sub-fase) hayan pasado.
