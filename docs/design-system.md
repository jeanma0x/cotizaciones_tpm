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

## Arquitectura de tokens — dos capas, no valores sueltos

Un sistema de diseño maduro nunca usa un color directamente en un componente — usa
**tokens primitivos** (la paleta cruda, con toda su escala de tonos) y **tokens
semánticos** (qué significa cada color en este producto, que apuntan a un primitivo).
Esto es lo que permite que el modo oscuro sea "remapear la capa semántica a otros
primitivos" en vez de reescribir cada componente.

**Capa 1 — Primitivos** (la escala completa, nunca se usan directo en un componente):

```css
--navy-50:  #EAF0F5;  --navy-100: #C7D6E3;  --navy-300: #6D93B2;
--navy-500: #2A4A6B;  --navy-700: #1F425F;  --navy-900: #16324F;

--amber-100: #FBEEDD;  --amber-300: #F0AC5C;
--amber-500: #E2963A;  --amber-700: #C97B22;

--paper-0:   #FFFFFF;  --paper-50:  #F6F4EF;  --paper-900: #131A24;
--ink-100:   #E9E4DA;  --ink-500:   #6B6459;  --ink-900:   #1B2430;

--line-200:  #DAD3C4;  --line-800:  #2E3944;

--success-100: #E7EFE9; --success-500: #4B7A5B; --success-dark-100: #1C2E24; --success-dark-500: #6FA080;
--danger-100:  #F5E7E2; --danger-500:  #B5503A; --danger-dark-100:  #34211C; --danger-dark-500:  #D17B60;
```

**Capa 2 — Semánticos** (esto es lo que se usa en componentes; en modo claro y oscuro
apuntan a primitivos distintos, pero el nombre semántico no cambia nunca):

```css
:root[data-theme="light"] {
  --color-brand:          var(--navy-900);
  --color-brand-hover:    var(--navy-700);
  --color-accent:         var(--amber-500);
  --color-accent-hover:   var(--amber-700);
  --color-surface:        var(--paper-0);
  --color-surface-sunken: var(--paper-50);
  --sidebar:        var(--navy-900);   /* el sidebar es marca fija, no una superficie de contenido — no cambia de familia entre temas */
  --color-border:         var(--line-200);
  --color-text-primary:   var(--ink-900);
  --color-text-secondary: var(--ink-500);
  --color-success:        var(--success-500);
  --color-success-bg:     var(--success-100);
  --color-danger:         var(--danger-500);
  --color-danger-bg:      var(--danger-100);
}

:root[data-theme="dark"] {
  --color-brand:          var(--navy-500);
  --color-brand-hover:    var(--navy-300);
  --color-accent:         var(--amber-500);   /* el ámbar no cambia entre temas — es el ancla de marca */
  --color-accent-hover:   var(--amber-300);
  --color-surface:        var(--paper-900);
  --color-surface-sunken: #0D1420;
  --sidebar:        #0D1420;            /* mismo valor que surface-sunken en oscuro por coincidencia numérica, pero es un token independiente — no reusar surface-sunken en el componente, referenciar --sidebar explícitamente */
  --color-border:         var(--line-800);
  --color-text-primary:   var(--ink-100);
  --color-text-secondary: #9B9488;
  --color-success:        var(--success-dark-500);
  --color-success-bg:     var(--success-dark-100);
  --color-danger:         var(--danger-dark-500);
  --color-danger-bg:      var(--danger-dark-100);
}
```

**Corrección importante:** el sidebar usa `--sidebar`, no `--color-surface-sunken`
— son tokens distintos aunque en modo oscuro compartan el mismo valor numérico. El
sidebar es el ancla de marca (siempre navy, en ambos temas) — nunca debe quedar
mapeado al mismo token que el fondo de contenido general, aunque en algún tema
coincidan en valor. Si en el futuro se ajusta el tono del fondo de contenido, el
sidebar no debe moverse con él.

Como el fondo del sidebar queda fijo en navy en ambos temas (a diferencia de
`--color-text-primary`, que sí cambia entre temas), el texto sobre el sidebar necesita
sus propios tokens fijos, no los de contenido general:

```css
--sidebar-foreground: var(--paper-0);   /* blanco fijo en ambos temas — el fondo del sidebar nunca es lo bastante claro para necesitar texto oscuro */
--sidebar-border:      /* navy-700 en claro, line-800 en oscuro — el sidebar no hereda el borde de las tarjetas de contenido */
```

Usar siempre `bg-sidebar` / `text-sidebar-foreground` / `border-sidebar-border` en el
componente del sidebar — nunca los tokens de superficie de contenido
(`--color-text-primary`, `--color-border`) ahí, aunque visualmente en algún momento
coincidan por casualidad.

**Regla no negociable:** ningún componente referencia `--navy-900` o `--amber-500`
directamente. Todo componente usa `--color-brand`, `--color-accent`, etc. Esto es lo
que hace posible agregar un tercer tema (o ajustar el contraste de uno solo) sin tocar
componentes.

## Escala tipográfica (modular, no tamaños sueltos)

```css
--text-xs:   0.75rem;   /* 12px — captions, metadata de tabla */    line-height: 1.4;
--text-sm:   0.8125rem; /* 13px — texto secundario, celdas */       line-height: 1.5;
--text-base: 0.875rem;  /* 14px — cuerpo por defecto */             line-height: 1.55;
--text-lg:   1rem;      /* 16px — texto enfatizado, labels de formulario */ line-height: 1.5;
--text-xl:   1.25rem;   /* 20px — títulos de sección */             line-height: 1.3;
--text-2xl:  1.5rem;    /* 24px — títulos de página */              line-height: 1.25;
--text-3xl:  2rem;      /* 32px — cifras hero del dashboard */      line-height: 1.15;
```

Declarar estos como el `fontSize` extendido en `tailwind.config.ts` — nunca escribir
`text-[13px]` o `text-[22px]` arbitrario en un componente. Si un tamaño no está en esta
escala, la pregunta correcta es "¿a cuál de estos se parece más", no "agrego uno nuevo".

## Sistema de espaciado — grid de 4px

Tailwind ya trae una escala de 4px de base (`p-1` = 4px, `p-2` = 8px, `p-4` = 16px,
etc.) — la regla acá es **usarla siempre**, y nunca un valor arbitrario
(`p-[22px]`, `gap-[18px]`). Si algo no encaja exactamente en la escala, se redondea al
valor más cercano de la escala, no se inventa un valor intermedio. Esto es lo que da la
sensación de "todo alineado" que distingue una interfaz cuidada de una que se ve
"casi bien".

## Elevación — sombras con propósito, reservadas para overlays

La regla de "evitar sombras pesadas" (sección de arriba) aplica a **superficies
estáticas** (tarjetas, tablas) — esas siguen usando solo borde, nunca sombra. Pero los
elementos que **flotan sobre el contenido** (dropdowns, popovers, modales, el Sheet
lateral, el Command palette) sí necesitan una sombra deliberada para comunicar
profundidad — si no, se leen "pegados" al contenido en vez de flotando sobre él.

```css
--shadow-sm: 0 1px 2px rgba(27, 36, 48, 0.06);   /* dropdowns, tooltips */
--shadow-md: 0 4px 12px rgba(27, 36, 48, 0.10);  /* popovers, Sheet lateral */
--shadow-lg: 0 12px 32px rgba(27, 36, 48, 0.18); /* modales, Command palette */
```

Nunca aplicar `--shadow-md` o `--shadow-lg` a una tarjeta que vive en el flujo normal
del layout (eso sí sería el "genérico de dashboard" que se quiere evitar) — la sombra
es exclusiva de lo que se superpone al contenido.

## Accesibilidad — no es una fase aparte, es un requisito de cada componente

- **Contraste mínimo WCAG AA** (4.5:1 para texto normal, 3:1 para texto grande/UI) en
  cada combinación texto/fondo de la capa semántica de arriba. Verificar
  específicamente `--color-text-secondary` sobre `--color-surface` en ambos temas — es
  la combinación que más fácil falla por accidente al ajustar una paleta.
- **`focus-visible` en todo elemento interactivo**, con un anillo de foco consistente
  (`--color-accent` con offset), nunca `outline: none` sin reemplazo.
- **Todo botón de solo-ícono lleva `aria-label`** y un `Tooltip` visible (ver sección de
  componentes) — un ícono sin texto ni label es invisible para un lector de pantalla y
  ambiguo para cualquier usuario nuevo.
- **Orden de tabulación lógico**, `Escape` cierra Sheet/Dialog/Command, y el Command
  palette es alcanzable por teclado (`Cmd/Ctrl+K`) sin depender del mouse.
- Respetar `prefers-reduced-motion` (ya especificado en la sección de Movimiento).

## Container queries — componentes que se adaptan a su espacio, no solo al viewport

Con el patrón de `Sheet` (panel lateral) ya incorporado, un mismo componente —por
ejemplo, la tarjeta de resumen de un documento— puede vivir a ancho completo en una
página o angosto dentro del panel lateral. Diseñarlo para reaccionar a **su propio
contenedor**, no al viewport completo:

```css
.stat-cards-grid { container-type: inline-size; }

@container (min-width: 480px) {
  .stat-card { flex-direction: row; align-items: center; }
}
@container (max-width: 479px) {
  .stat-card { flex-direction: column; align-items: flex-start; }
}
```

Aplicar esto en las tarjetas del dashboard y en la vista resumen de un documento dentro
del `Sheet` — son los dos lugares donde el mismo componente aparece en más de un
contexto de ancho.

## Interacciones optimistas — la app responde antes de que el servidor confirme

Con Server Actions como base (ya definido en `architecture.md`), usar `useOptimistic`
de React para las acciones frecuentes y de bajo riesgo: cambiar el estado de un
documento, agregar un renglón, marcar un cliente como inactivo. La interfaz se
actualiza al instante; si el servidor responde con error, se revierte con un toast
(`sonner`) explicando qué pasó. Esto es lo que hace que una app se sienta "rápida" de
verdad, más allá de cualquier animación — la percepción de velocidad importa tanto como
la velocidad real.

```tsx
const [estadoOptimista, setEstadoOptimista] = useOptimistic(documento.estado);

async function cambiarEstado(nuevoEstado: EstadoDocumento) {
  setEstadoOptimista(nuevoEstado); // se ve al instante
  try {
    await actualizarEstadoAction(documento.id, nuevoEstado); // confirma en servidor
  } catch {
    toast.error("No se pudo actualizar el estado, intentá de nuevo.");
    // useOptimistic revierte solo al fallar la transición
  }
}
```

## Transiciones de página nativas — verificar vigencia antes de implementar

La View Transitions API del navegador (transiciones nativas al cambiar de ruta, sin
librería) es una técnica de vanguardia real para que navegar de la lista de documentos
a un documento específico se sienta continuo. **Nota importante:** mi información
sobre el nivel de soporte actual en Next.js y en los navegadores objetivo llega solo
hasta enero de 2026 — verificá con la documentación actual de Next.js si el soporte ya
es estable antes de comprometerte a usarla como base de una transición crítica. Si para
el momento de implementar todavía es experimental o el soporte de navegadores es
parcial, usar `motion` (`AnimatePresence` + `layout`, ya recomendado arriba) como
alternativa robusta — el efecto percibido es similar y no depende de soporte nativo.

## Logo

El cliente tiene un logo real: **un engranaje azul**. Usarlo (una vez el cliente lo
envíe en buena resolución — ver `CLAUDE.md`) en el sidebar, en el encabezado de los
documentos exportados, y como favicon. Mientras no llegue el archivo real, usar el
ícono de engranaje de `lucide-react` (`Cog` o `Settings`) en `--color-accent` sobre
`--sidebar` como placeholder — no diseñar un logo nuevo desde
cero; mejorar/vectorizar el logo real es trabajo de Fase 3, explícitamente fuera de
este alcance (ver `scope.md`).

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
- Usar siempre la escala tipográfica de arriba (`--text-xs` a `--text-3xl`) — nunca un
  tamaño arbitrario.

## El elemento de firma visual: el correlativo como "tag" de carga

El correlativo de cada documento se muestra dentro de una etiqueta con **borde
punteado**, fuente monoespaciada y peso alto — como una etiqueta de manifiesto de
carga. Este es el elemento distintivo que se repite en el dashboard (cada fila) y en el
documento exportado (encabezado). No reemplazar por un badge genérico de shadcn sin
esta textura.

```css
.correlativo-tag {
  display: inline-block;
  border: 1.5px dashed var(--color-brand);
  border-radius: 4px;
  padding: var(--space-2) var(--space-3);
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--color-brand);
}
```

## Layout general

- **Sidebar fijo** en `--sidebar` (navy sólido, el ancla de marca en ambos
  temas — nunca `--color-surface-sunken`), con el logo/marca arriba, navegación debajo
  (Panel, Nueva cotización, Clientes, Servicios, Empresas, Usuarios — rutas separadas,
  ver `architecture.md`), y un pie de sidebar discreto (usuario + selector de tema).
- **Contenido principal** sobre `--color-surface-sunken` a nivel de página, con
  tarjetas en `--color-surface` y borde sutil (`1px solid var(--color-border)`) en vez
  de sombras pesadas — mantiene la sensación de papel/documento, no de "panel de SaaS
  flotante". Ver "Elevación" arriba: sombra solo en overlays, nunca en estas tarjetas.
- Ítem de navegación activo: fondo `--color-accent` con texto oscuro, no un simple
  subrayado — da peso visual claro a dónde está parado el usuario.
- Usar CSS Grid (no combinaciones de flex anidadas) para el shell de la app y para la
  grilla de tarjetas del dashboard — más robusto al agregar/quitar tarjetas.

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

## Panel / dashboard — layout y estilo de gráficos

El panel tiene 7 zonas (ver `scope.md`) — el error más fácil de cometer es tratarlas
como bloques del mismo peso visual en una grilla uniforme. No lo son: la Zona 1
(estado ahora) y la Zona 3 (atención requerida) son las que Oldemar necesita ver en
menos de 3 segundos; el resto es exploración cuando él quiera profundizar.

- **Zona 1** ocupa el ancho completo arriba, con las 3 cifras notablemente más grandes
  que cualquier otro texto del panel (`--text-3xl`) — no del mismo tamaño que las
  cifras de las zonas de desglose más abajo.
- **Zona 3 (atención requerida)** nunca es una tarjeta más — dale un borde de
  `--color-accent` o un fondo `--color-danger-bg` sutil si hay ítems pendientes, para
  que se distinga del resto incluso sin leer el contenido. Si no hay nada pendiente,
  mostrar un estado positivo explícito ("Todo al día — nada requiere tu atención"),
  no ocultar la zona.
- El resto de zonas (4-7) sí puede vivir en una grilla más pareja, con container
  queries (ya especificado arriba) para que se reacomoden según el ancho disponible.

**Gráficos (Recharts) — nunca los colores default de la librería:**

- Usar exclusivamente los tokens semánticos de este documento para series de datos —
  nunca la paleta arcoíris default de Recharts. Para el desglose por empresa (4
  series), en vez de 4 colores arbitrarios, usar variaciones de `--color-brand` en
  distintos tonos (navy-300, navy-500, navy-700, navy-900) + `--color-accent` para
  destacar una sola serie a la vez si hace falta resaltar algo — mantiene la disciplina
  de paleta incluso en los gráficos, que es justo donde más se nota cuando un sistema
  "se sale" de su propia identidad.
- Tooltips de Recharts reestilizados para que coincidan con las tarjetas del sistema
  (`--color-surface`, borde `--color-border`, `--shadow-sm`) — el tooltip default de
  Recharts es blanco genérico con sombra dura, se nota inmediatamente si se deja así.
- Ejes y grillas de fondo en `--color-border` muy sutil, nunca negro puro — un gráfico
  con líneas de grilla marcadas se lee "genérico de librería" al instante.
- `isAnimationActive` y `animationDuration` explícitos (ver sección de Librerías) —
  confirmar que no queden desactivados por accidente.

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

| Estado | Token de texto | Token de fondo | Valor claro (referencia) |
| --- | --- | --- | --- |
| Borrador | `--color-text-secondary` | tono neutro propio | `#6B6459` / `#EDEAE2` |
| Enviada | tono propio | tono propio | `#2F5A78` / `#E4EDF2` |
| En negociación | `--color-accent-hover` | tono propio | `#C97B22` / `#FBEEDD` |
| Aceptada | `--color-success` | `--color-success-bg` | — (ya en la capa semántica) |
| Rechazada | `--color-danger` | `--color-danger-bg` | — (ya en la capa semántica) |
| Vencida | tono propio | tono propio | `#8A4B3A` / `#F1E7DE` |
| Facturada | `--color-brand` | tono propio | `#16324F` / `#E2E8ED` |

Los estados que no mapean 1:1 a un semántico ya existente (Enviada, Vencida) llevan su
propio par de tokens (`--color-status-enviada`, `--color-status-vencida`, etc.),
definidos igual en ambas capas de tema — no forzarlos dentro de `success`/`danger` solo
por reutilizar. Mantener los valores exactos de referencia — ya se mostraron al cliente
en la demo y en las capturas de la propuesta firmada; solo se reorganiza cómo se
nombran los tokens, no los colores en sí.

## Modo claro y oscuro

El sistema debe soportar ambos modos, con un selector accesible desde el pie del
sidebar (junto al usuario). Los valores de cada modo ya están definidos en
"Arquitectura de tokens" (arriba) — la capa semántica (`--color-brand`,
`--color-surface`, etc.) es la que cambia según `data-theme`, la capa primitiva no se
toca. **El modo oscuro no es "invertir los colores"** — por eso existe como un mapeo
semántico distinto, no como una transformación automática de los primitivos.

Reglas de implementación:

- Usar `next-themes` (o el mecanismo de tema de shadcn/ui) con `data-theme` en `<html>`,
  persistido en `localStorage` — no depender solo de `prefers-color-scheme` del sistema,
  el usuario debe poder elegir explícitamente.
- **El sidebar sigue siendo el elemento "ancla" de marca en ambos modos** — usa
  `--sidebar`, que es navy sólido en claro y un navy casi negro en oscuro
  (`#0D1420`) — nunca el mismo token que el fondo de contenido (`--color-surface-sunken`),
  aunque en oscuro coincidan en valor numérico. Debe seguir leyéndose como "la
  estructura fija de la app", no mezclarse con el contenido.
- El logo/ícono placeholder (`Cog` de lucide-react) usa siempre `--color-accent` —
  es el único token que no cambia de valor entre temas, precisamente para que la marca
  se reconozca igual sin importar el tema activo.
- Verificar contraste real (ver sección de Accesibilidad) en ambos temas antes de dar
  por cerrada la implementación — no asumir que "si se ve bien en claro, en oscuro
  también".

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

## Librerías a usar — no reinventar animación con CSS suelto

La sección anterior define *cuándo* debe haber movimiento y con qué duración/easing.
Esta sección define **con qué herramienta se implementa cada caso** — usar la
herramienta correcta para cada trabajo es lo que distingue una interfaz cuidada de una
con transiciones genéricas de `transition-colors` puestas a mano en todos lados.

| Necesidad | Librería | Por qué esta y no CSS a mano |
| --- | --- | --- |
| Agregar/quitar renglones, notas, anexos | `@formkit/auto-animate` | Una sola línea (`autoAnimate(parentRef)`) anima automáticamente cualquier inserción/eliminación/reordenamiento dentro de un contenedor — es literalmente la herramienta hecha para este caso exacto, no hace falta escribir keyframes. |
| Contador animado en las tarjetas del dashboard | `motion` (antes `framer-motion`) — `animate()` o `useSpring` | Contar de 0 al valor real con easing correcto es más prolijo con Motion que con un `setInterval` casero. |
| Apertura/cierre de modales, diálogos, popovers, dropdowns | `tailwindcss-animate` (plugin) + los `data-state` que ya expone Radix/shadcn | shadcn/ui ya está construido sobre Radix, que expone `data-state="open | closed"` — con el plugin de Tailwind estas animaciones salen casi gratis, sin JS adicional. Confirmar que el plugin esté instalado y declarado en `tailwind.config.ts` (a veces se omite en un `create-next-app` + shadcn manual). |
| Transiciones de página / vista de detalle de un documento | `motion` — `AnimatePresence` + `layout` | Para que abrir un documento desde la tabla se sienta como una transición fluida (no un salto entre pantallas), usar animación de layout compartido de Motion. |
| Notificaciones ("Cotización guardada", "Cliente creado") | `sonner` | Es el estándar que el propio shadcn/ui recomienda para toasts — animación de entrada/salida ya resuelta, no construir un sistema de notificaciones propio. |
| Estados de carga (mientras carga el panel o una tabla) | `Skeleton` de shadcn/ui | Nunca una pantalla en blanco ni un spinner genérico — el esqueleto gris pulsante es el estándar actual de producto serio y ya viene con shadcn. |
| Gráficos del dashboard (distribución por estado, por empresa) | Recharts con `isAnimationActive` y `animationDuration` explícitos | Recharts ya trae animación de entrada — solo hay que asegurarse de que esté activada (a veces se desactiva por accidente para "simplificar"), no es necesario ningún código adicional. |

Instalación (agregar al proyecto, no dejarlo para "después"):

```bash
npm install motion @formkit/auto-animate sonner
npm install -D tailwindcss-animate
```

## Patrones de componente que dan sensación de producto pulido

Más allá de animación, aprovechar estos componentes de shadcn/ui que muy probablemente
no se usaron todavía (el stack los tiene disponibles, pero no se aprovechan solo por
instalar shadcn — hay que pedirlos explícitamente):

- **`Sheet`** — para una vista rápida de un documento (abrir un panel lateral con el
  resumen, sin salir de la tabla de Documentos). Le da al sistema una sensación de
  "rapidez" que una navegación de página completa no da.
- **`Command`** (cmdk, incluido en shadcn) — una paleta de comandos con `Cmd+K` /
  `Ctrl+K` para buscar rápido entre clientes, documentos y navegación general. Es un
  detalle que un producto de nivel senior tiene y uno genérico no — barato de agregar,
  alto impacto percibido.
- **`Tooltip`** — en cualquier botón que sea solo ícono (sin texto), para que nunca
  quede ambiguo qué hace.
- **`Skeleton`** — ver tabla arriba.

No es necesario implementar los 4 de una vez si el tiempo apreta — pero si se
implementa solo uno además de las animaciones, que sea el `Command` de búsqueda global:
es el que más "se siente premium" con menos esfuerzo relativo.

## Selector de tipo de documento — botones tipo "pill", nunca un `<select>`

La elección entre Cotización / Propuesta / Factura debe ser un grupo de botones tipo
"pill" (bordeados, el activo con fondo `--color-brand` y texto blanco) — el mismo
patrón que ya se le mostró a Oldemar en la propuesta que firmó. Un `<select>` nativo
para esto es un retroceso respecto a lo que él ya vio y aprobó, no una simplificación
válida.

```css
.pill-group { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.pill {
  padding: var(--space-2) var(--space-4);
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: transparent;
  font-size: var(--text-sm);
  transition: background-color var(--motion-fast) var(--motion-ease),
              color var(--motion-fast) var(--motion-ease);
}
.pill[data-active="true"] {
  background: var(--color-brand);
  color: var(--color-surface);
  border-color: var(--color-brand);
}
```

## Botones — jerarquía y uso de íconos obligatorio

Todo botón de acción debe tener un ícono de `lucide-react` (ver tabla de iconografía) —
**esto no es opcional ni cosmético**: sin íconos, una tabla con puros botones de texto
con borde se ve igual en cualquier sistema, es una de las razones principales por las
que la interfaz se percibe genérica.

Tres niveles de jerarquía, sin excepción:

| Nivel | Uso | Estilo |
| --- | --- | --- |
| Primario | Una sola acción principal por pantalla (Crear cotización, Guardar) | Fondo `--color-brand` sólido, texto `--color-surface`, ícono incluido |
| Secundario | Acciones de apoyo (Editar, + Renglón, + Nota) | Borde `--color-border`, fondo transparente, texto `--color-text-primary`, ícono incluido |
| Destructivo/atención | Desactivar, Eliminar, Rechazar | Texto/borde en `--color-danger`, nunca el mismo peso visual que Editar |

`Editar` y `Desactivar` **nunca deben verse idénticos** — si hoy se ven iguales (como en
las capturas actuales), es la señal más clara de que la jerarquía no se está aplicando.

## Buscadores y filtros — patrón obligatorio en toda vista de listado

Cualquier pantalla que muestre una tabla (Documentos, Clientes, Servicios) debe incluir
un campo de búsqueda con ícono `Search` de lucide-react a la izquierda del texto, estilo
consistente con el que ya existe en la pantalla de Documentos — **no es opcional para
Clientes y Servicios solo porque la tabla es corta ahora**; con datos reales de
producción, esas tablas van a crecer, y el patrón debe estar desde ya.

## Formularios — agrupación obligatoria en `.form-section`

Todo campo de formulario debe vivir dentro de una tarjeta `.form-section`
(`background: var(--color-surface)`, borde `1px solid var(--color-border)`, padding
consistente con el sistema de espaciado) agrupando campos relacionados — nunca campos
sueltos flotando directo sobre el fondo de la página. Esto
ya estaba implícito en "Layout general" arriba, pero se hace explícito acá porque es
uno de los gaps más notorios de la primera implementación: la sección de ítems sí tenía
tarjeta, pero los campos de encabezado del formulario (tipo, empresa, cliente, fecha)
no.
