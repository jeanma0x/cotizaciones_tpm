# Sistema de diseño

**Esta identidad visual ya fue mostrada al cliente** en una demo funcional y en una
propuesta formal de 22 páginas — le gustó y fue parte de lo que lo convenció de firmar.
No es un punto de partida para "inspirarse" — es el sistema a seguir. Generar una
paleta nueva, usar los defaults de shadcn/ui sin personalizar, o diseñar algo que se
vea a un dashboard de SaaS genérico sería un paso atrás respecto a lo que el cliente ya
aprobó.

## Por qué esta dirección visual (para no perderla al iterar)

Oldemar es dueño de una empresa de transporte y logística. El lenguaje visual se
inspira deliberadamente en **manifiestos de carga y documentos de embarque** (waybills):
etiquetas en mayúsculas, números de correlativo como si fueran un sello o tag de carga,
tipografía monoespaciada para datos, colores de señalización de carretera (ámbar) sobre
una base seria y confiable (azul marino). Esto es coherente con el negocio real del
cliente — no es una decoración genérica.

## Tokens de color

```css
--paper:       #F6F4EF;  /* fondo general, tipo papel de manifiesto */
--ink:         #1B2430;  /* texto principal */
--navy:        #16324F;  /* color de marca — sidebar, encabezados, elementos primarios */
--navy-2:      #1F425F;  /* hover sobre navy */
--amber:       #E2963A;  /* acento — el color de señalización, usar con moderación */
--amber-deep:  #C97B22;  /* hover sobre ámbar, y estados "en negociación" */
--line:        #DAD3C4;  /* bordes, separadores */
--muted:       #6B6459;  /* texto secundario */
--success:     #4B7A5B;  /* estado "Aceptada" */
--success-bg:  #E7EFE9;
--danger:      #B5503A;  /* estado "Rechazada" */
--danger-bg:   #F5E7E2;
```

Configurar estos como CSS variables globales y como `colors` extendidos en
`tailwind.config.ts` — no usar valores hex sueltos en los componentes.

## Logo

El cliente tiene un logo real: **un engranaje azul**. Usarlo (una vez el cliente lo
envíe en buena resolución — ver `CLAUDE.md`) en el sidebar, en el encabezado de los
documentos exportados, y como favicon. Mientras no llegue el archivo real, usar el
ícono de engranaje de `lucide-react` (`Cog` o `Settings`) en `--amber` sobre `--navy`
como placeholder — no diseñar un logo nuevo desde cero; mejorar/vectorizar el logo real
es trabajo de Fase 3, explícitamente fuera de este alcance (ver `scope.md`).

## Tipografía

- **Texto de interfaz:** system font stack (`-apple-system, BlinkMacSystemFont, "Segoe
  UI", Roboto, ...`) — no cargar una fuente web nueva, mantiene la app liviana y
  consistente entre plataformas.
- **Datos y correlativos:** monoespaciada (`ui-monospace, SFMono-Regular, Menlo,
  Consolas, "Courier New", monospace`) — se usa específicamente para números de
  correlativo, montos, y fechas, dando la sensación de un dato "sellado", no editorial.
- **Etiquetas de campo:** mayúsculas con letter-spacing (ej. `CANTIDAD`, `DESCRIPCIÓN`,
  `ESTADO`) — esto imita directamente la convención que ya usan los documentos actuales
  del cliente (ver los PDFs de referencia en `business-context.md`), no es un capricho
  estético.

## El elemento de firma visual: el correlativo como "tag" de carga

El correlativo de cada documento se muestra dentro de una etiqueta con **borde
punteado**, fuente monoespaciada y peso alto — como una etiqueta de manifiesto de
carga. Este es el elemento distintivo que se repite en el dashboard (cada fila) y en el
documento exportado (encabezado). No reemplazar por un badge genérico de shadcn sin
esta textura.

```css
.correlativo-tag {
  display: inline-block;
  border: 1.5px dashed var(--navy);
  border-radius: 4px;
  padding: 6px 12px;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--navy);
}
```

## Layout general

- **Sidebar fijo** en `--navy`, con el logo/marca arriba, navegación debajo (Panel,
  Nueva cotización, Clientes, Servicios, Empresas y usuarios, Configuración), y un pie
  de sidebar discreto.
- **Contenido principal** sobre fondo `--paper`, con tarjetas de borde sutil
  (`1px solid var(--line)`) en vez de sombras pesadas — mantiene la sensación de papel/
  documento, no de "panel de SaaS flotante".
- Ítem de navegación activo: fondo `--amber` con texto oscuro, no un simple subrayado —
  da peso visual claro a dónde está parado el usuario.

## Iconografía (lucide-react)

Elegir íconos con relación directa al negocio, evitando el paquete genérico de
"dashboard" (gráficas de barra, engranajes decorativos sin sentido, cohetes, etc.):

| Sección | Ícono sugerido |
| --- | --- |
| Panel | `LayoutGrid` o `ClipboardList` |
| Nueva cotización/factura | `FilePlus` |
| Clientes | `Users` o `Building2` |
| Servicios | `Truck` o `PackageCheck` |
| Empresas y usuarios | `Building` + `ShieldCheck` |
| Estado "Enviada" | `Send` |
| Estado "Aceptada" | `CheckCircle2` |
| Estado "Rechazada" | `XCircle` |
| Duplicar | `Copy` |
| Exportar/Imprimir | `Printer` o `Download` |

## Qué evitar explícitamente

- Gradientes decorativos, glassmorphism, o sombras pesadas — no es la identidad de este
  negocio.
- Paletas moradas/azul-violeta genéricas de "producto SaaS de IA" — el cliente es una
  empresa de transporte, no una startup de software.
- Ilustraciones stock genéricas (gente en laptops, cohetes, formas abstractas
  flotantes).
- Cualquier texto en inglés en la interfaz — el cliente y su equipo trabajan en
  español.
- Componentes de shadcn/ui usados "tal cual salen de la caja" sin aplicar los tokens de
  arriba — deben sentirse parte de este sistema, no genéricos.

## Estados de documento — colores fijos

| Estado | Color texto | Color fondo |
| --- | --- | --- |
| Borrador | `--muted` | `#EDEAE2` |
| Enviada | `#2F5A78` | `#E4EDF2` |
| En negociación | `--amber-deep` | `#FBEEDD` |
| Aceptada | `--success` | `--success-bg` |
| Rechazada | `--danger` | `--danger-bg` |
| Vencida | `#8A4B3A` | `#F1E7DE` |
| Facturada | `--navy` | `#E2E8ED` |

Mantener estos colores exactos — ya se mostraron al cliente en la demo y en las
capturas de la propuesta firmada.

## Modo claro y oscuro

El sistema debe soportar ambos modos, con un selector accesible desde el pie del
sidebar (junto al usuario). **El modo oscuro no es "invertir los colores"** — es una
paleta hermana que mantiene la misma identidad (navy como color de marca, ámbar como
acento, tipografía monoespaciada para datos) pero pensada para fondo oscuro desde cero.

```css
:root[data-theme="dark"] {
  --paper:       #131A24;  /* fondo general oscuro, no negro puro */
  --ink:         #E9E4DA;  /* texto principal, tono papel/hueso, no blanco puro */
  --navy:        #2A4A6B;  /* la marca se aclara un paso para mantener contraste en fondo oscuro */
  --navy-2:      #35597F;
  --amber:       #E2963A;  /* el ámbar se mantiene igual — sigue funcionando sobre oscuro */
  --amber-deep:  #F0AC5C;  /* hover del ámbar se aclara en vez de oscurecer, en modo oscuro */
  --line:        #2E3944;  /* bordes sutiles sobre fondo oscuro */
  --muted:       #9B9488;
  --success:     #6FA080;
  --success-bg:  #1C2E24;
  --danger:      #D17B60;
  --danger-bg:   #34211C;
  --sidebar-bg:  #0D1420;  /* el sidebar en modo oscuro es un tono aún más oscuro que el fondo principal, para mantener la jerarquía navy=marca */
}
```

Reglas de implementación:

- Usar `next-themes` (o el mecanismo de tema de shadcn/ui) con `data-theme` en `<html>`,
  persistido en `localStorage` — no depender solo de `prefers-color-scheme` del sistema,
  el usuario debe poder elegir explícitamente.
- **El sidebar sigue siendo el elemento "ancla" de marca en ambos modos** — en claro es
  `--navy` sólido; en oscuro, un tono aún más oscuro que el fondo principal
  (`--sidebar-bg`), nunca el mismo color que el contenido — debe seguir leyéndose como
  "la estructura fija de la app", no mezclarse con el contenido.
- El logo/ícono placeholder (`Cog` de lucide-react) se mantiene en `--amber` sobre el
  sidebar en ambos modos — el ámbar es el único color que no cambia entre temas,
  precisamente para que siga siendo reconocible como "la marca" sin importar el tema.
- Los colores de estado de documento (tabla de abajo) tienen su propia versión oscura
  ya definida arriba (`--success-bg`, `--danger-bg`, etc.) — no reusar los de modo claro
  sobre fondo oscuro, se pierde el contraste.

## Movimiento e interacción (motion)

Hasta ahora no había ninguna especificación de movimiento — por eso no había ninguna
transición implementada. El movimiento en este sistema es **funcional y discreto**, no
decorativo — refuerza que algo cambió de estado, nunca llama la atención sobre sí mismo.
Nada de animaciones tipo landing page de producto.

**Duraciones y easing estándar** (definir como utilidades de Tailwind/CSS variables,
usar siempre las mismas, nunca valores sueltos por componente):

```css
--motion-fast:    120ms;  /* hover, focus, cambios de color */
--motion-normal:  200ms;  /* aparición de elementos, expansión de filas */
--motion-slow:    320ms;  /* transición de página, modales */
--motion-ease:    cubic-bezier(0.2, 0, 0, 1);  /* ease-out — entra rápido, frena suave */
```

**Dónde sí debe haber movimiento:**

- **Hover/focus de botones y filas de tabla**: transición de color de fondo/borde en
  `--motion-fast`, nunca instantáneo ni con `transition: all` (afecta layout, se ve
  tosco — transicionar solo `color`, `background-color`, `border-color`).
- **Filas de tabla al agregarse/quitarse** (ítems de un documento, ej. "+ Renglón"):
  fade + slide vertical corto en `--motion-normal`, para que agregar/quitar un renglón
  se sienta intencional, no un salto brusco de layout.
- **Cambio de estado de un documento** (badge de estado): al cambiar, un fade breve del
  badge nuevo — refuerza visualmente que "esto acaba de cambiar", útil justamente para
  el caso de uso de trazabilidad que le importa a Oldemar.
- **Números del dashboard**: al cargar el panel, los valores numéricos de las tarjetas
  (total, monto, etc.) pueden animarse contando hacia el valor final en ~400-600ms — es
  el único lugar donde un poco de "espectáculo" es apropiado, porque es la primera
  pantalla que Oldemar ve y vale la pena que se sienta viva.
- **Sidebar → ítem activo**: transición de fondo al cambiar de sección en
  `--motion-fast`, no un salto seco.
- **Toasts/confirmaciones** (ej. "Cotización guardada"): entran con slide+fade desde
  abajo, en `--motion-normal`, se retiran solas a los 3-4 segundos.

**Dónde NO debe haber movimiento:**

- Nada de animación de entrada en la carga inicial de una página completa (spinners
  largos, fade-in de toda la pantalla) — la app debe sentirse instantánea, no un show.
- Nada de parallax, hover 3D, ni transformaciones de escala grandes en tarjetas.
- Respetar `prefers-reduced-motion: reduce` — si el usuario lo tiene activado en su
  sistema, desactivar las transiciones no esenciales (dejar solo cambios de color
  instantáneos).

## Selector de tipo de documento — botones tipo "pill", nunca un `<select>`

La elección entre Cotización / Propuesta / Factura debe ser un grupo de botones tipo
"pill" (bordeados, el activo con fondo `--navy` y texto blanco) — el mismo patrón que
ya se le mostró a Oldemar en la propuesta que firmó. Un `<select>` nativo para esto es
un retroceso respecto a lo que él ya vio y aprobó, no una simplificación válida.

```css
.pill-group { display: flex; gap: 8px; flex-wrap: wrap; }
.pill {
  padding: 9px 16px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: transparent;
  font-size: 13px;
  transition: background-color var(--motion-fast) var(--motion-ease),
              color var(--motion-fast) var(--motion-ease);
}
.pill[data-active="true"] { background: var(--navy); color: #fff; border-color: var(--navy); }
```

Todo botón de acción debe tener un ícono de `lucide-react` (ver tabla de iconografía) —
**esto no es opcional ni cosmético**: sin íconos, una tabla con puros botones de texto
con borde se ve igual en cualquier sistema, es una de las razones principales por las
que la interfaz se percibe genérica.

Tres niveles de jerarquía, sin excepción:

| Nivel | Uso | Estilo |
| --- | --- | --- |
| Primario | Una sola acción principal por pantalla (Crear cotización, Guardar) | Fondo `--navy` sólido, texto blanco, ícono incluido |
| Secundario | Acciones de apoyo (Editar, + Renglón, + Nota) | Borde `--line`, fondo transparente, texto `--ink`, ícono incluido |
| Destructivo/atención | Desactivar, Eliminar, Rechazar | Texto/borde en `--danger`, nunca el mismo peso visual que Editar |

`Editar` y `Desactivar` **nunca deben verse idénticos** — si hoy se ven iguales (como en
las capturas actuales), es la señal más clara de que la jerarquía no se está aplicando.

## Buscadores y filtros — patrón obligatorio en toda vista de listado

Cualquier pantalla que muestre una tabla (Documentos, Clientes, Servicios) debe incluir
un campo de búsqueda con ícono `Search` de lucide-react a la izquierda del texto, estilo
consistente con el que ya existe en la pantalla de Documentos — **no es opcional para
Clientes y Servicios solo porque la tabla es corta ahora**; con datos reales de
producción, esas tablas van a crecer, y el patrón debe estar desde ya.

## Formularios — agrupación obligatoria en `.form-section`

Todo campo de formulario debe vivir dentro de una tarjeta `.form-section` (fondo
blanco/paper, borde `1px solid var(--line)`, padding consistente) agrupando campos
relacionados — nunca campos sueltos flotando directo sobre el fondo de la página. Esto
ya estaba implícito en "Layout general" arriba, pero se hace explícito acá porque es
uno de los gaps más notorios de la primera implementación: la sección de ítems sí tenía
tarjeta, pero los campos de encabezado del formulario (tipo, empresa, cliente, fecha)
no.
