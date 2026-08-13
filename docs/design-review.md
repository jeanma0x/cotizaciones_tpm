# Revisión de diseño — fin de Fase 6

Este documento nace de una revisión real contra 5 capturas del sistema en Fase 6
(Panel, Nuevo documento, Documentos, Clientes, Servicios). El diagnóstico: **la
funcionalidad avanza bien, pero el sistema de diseño de `design-system.md` no se está
aplicando de forma consistente**, y por eso se percibe genérico — no es un problema de
"le falta pulido", son gaps concretos y corregibles.

**No pasar al Día 7 (pruebas y cierre) hasta que este checklist esté en cero.** El
criterio de salida del Día 6 en `plan-de-construccion.md` dice explícitamente "aplicar
el sistema de diseño de forma consistente en todas las pantallas" — este documento es
la verificación de que eso se cumplió.

Dos secciones nuevas se agregaron a `design-system.md` como resultado de esta revisión
(Modo claro/oscuro, Movimiento) — no existían antes, así que no es que se hayan
ignorado; hay que implementarlas ahora por primera vez.

## Crítico — bloquea el cierre de Fase 6

- [ ] **Falta el ícono de marca en el sidebar.** Solo aparece el texto "TPM SERVICIOS
  GENERALES". Agregar el ícono `Cog` de lucide-react en `--amber` sobre el navy del
  sidebar, como especifica `design-system.md` → sección Logo.
- [ ] **Navegación incompleta.** El sidebar no muestra "Empresas y usuarios" ni
  "Configuración". Si ya están construidas, es un bug de navegación — agregarlas al
  menú. Si no están construidas, el Día 6 no está completo (ver `plan-de-construccion.md`,
  criterio de salida: "el socio, con su propio usuario, entra y solo ve la empresa
  asignada — en todas las pantallas").
- [ ] **El selector de "Tipo de documento" es un `<select>` nativo.** Debe ser un grupo
  de botones tipo pill (Cotización | Propuesta | Factura), como se le mostró a Oldemar
  en la propuesta firmada. Ver `design-system.md` → "Selector de tipo de documento".
  Este es el retroceso más visible de toda la revisión — es literalmente algo que el
  cliente ya vio y aprobó, y ahora se ve distinto a como se lo vendieron.
- [ ] **Clientes y Servicios no tienen buscador.** La propuesta que se le mostró a
  Oldemar vendía explícitamente "buscar por nombre o NIT" como una de las páginas
  centrales de valor. Agregar el mismo patrón de búsqueda que ya existe en Documentos.
  Ver `design-system.md` → "Buscadores y filtros".

## Alto — corregir antes de dar por cerrada la Fase 6

- [ ] **Los campos de encabezado del formulario de documento no están agrupados en una
  tarjeta.** Tipo, Empresa, Cliente, Fecha, Oferta válida hasta, Condiciones de pago:
  todos sueltos directo sobre el fondo. Solo la sección de "ÍTEMS" tiene el tratamiento
  de tarjeta correcto. Agrupar en `.form-section` — ver `design-system.md` →
  "Formularios".
- [ ] **Cero iconografía en toda la interfaz.** Ningún ítem del sidebar, ningún botón
  (Editar, Activar, Desactivar, + Renglón, + Nota, Nuevo documento, Nuevo cliente,
  Nuevo servicio) tiene ícono. Aplicar la tabla completa de `design-system.md` →
  "Iconografía", y el nuevo requisito explícito en "Botones — jerarquía y uso de
  íconos obligatorio" (todo botón de acción lleva ícono, sin excepción).
- [ ] **Editar y Desactivar se ven idénticos.** Mismo borde, mismo peso, ninguna
  diferencia de color. Aplicar la jerarquía de 3 niveles (primario/secundario/
  destructivo) de `design-system.md` → "Botones". Desactivar debe usar tono
  `--danger`, nunca el mismo estilo neutro que Editar.
- [ ] **Dashboard insuficiente para 4 empresas.** Ya se actualizó `scope.md` con el
  detalle exacto de qué agregar: desglose por empresa, desglose por tipo de documento,
  listado de documentos recientes, y una visualización de distribución por estado
  (Recharts). Implementar esas 4 piezas nuevas.

## Medio — no bloquea el cierre, pero corregir en esta misma pasada ya que se está

tocando diseño

- [ ] **Modo oscuro no implementado.** No existía especificación antes de esta
  revisión — ya está en `design-system.md` → "Modo claro y oscuro", con la paleta
  completa y las reglas de implementación (usar `next-themes` o el mecanismo de tema
  de shadcn, selector en el pie del sidebar, persistido en `localStorage`).
- [ ] **Cero transiciones/animación en toda la interfaz.** Tampoco existía
  especificación antes. Ver `design-system.md` → "Movimiento e interacción", con
  duraciones, easing, y la lista explícita de dónde sí y dónde no debe haber
  movimiento. Prestar atención particular a la animación de números en las tarjetas
  del dashboard — es la primera impresión que tiene Oldemar cada vez que entra.

## Cómo verificar que quedó corregido (antes de decir "listo")

Para cada ítem del checklist, la verificación no es "¿ya no se ve tan plano?" (subjetivo
y fácil de auto-engañarse) sino algo concreto y observable:

1. ¿El sidebar tiene un ícono visible junto al texto de marca? Sí/No.
2. ¿Los 6 ítems de navegación completos están en el menú (Panel, Nuevo documento,
   Documentos, Clientes, Servicios, Empresas y usuarios, Configuración)? Contarlos.
3. ¿El selector de tipo de documento son botones, no un dropdown? Verificar el HTML
   renderizado, no solo la vista.
4. ¿Hay un `<input>` de búsqueda visible arriba de la tabla en Clientes y en Servicios?
5. ¿Cada botón de acción tiene un `<svg>` de lucide-react antes o junto al texto?
6. ¿Cambiar el tema (claro/oscuro) desde el selector persiste al recargar la página?
7. ¿Agregar un renglón nuevo a un documento produce una transición visible, no un salto
   instantáneo?

Si la respuesta a cualquiera de estas 7 preguntas es "no" o "no estoy seguro", ese punto
no está terminado todavía.
