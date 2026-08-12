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
|---|---|
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
|---|---|---|
| Borrador | `--muted` | `#EDEAE2` |
| Enviada | `#2F5A78` | `#E4EDF2` |
| En negociación | `--amber-deep` | `#FBEEDD` |
| Aceptada | `--success` | `--success-bg` |
| Rechazada | `--danger` | `--danger-bg` |
| Vencida | `#8A4B3A` | `#F1E7DE` |
| Facturada | `--navy` | `#E2E8ED` |

Mantener estos colores exactos — ya se mostraron al cliente en la demo y en las
capturas de la propuesta firmada.
