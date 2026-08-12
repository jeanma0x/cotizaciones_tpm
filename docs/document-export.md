# Documentos exportables (cotización, propuesta, factura)

Este es el requisito que el cliente pidió de forma más específica y explícita en
llamada, después de ver una versión anterior del sistema — leerlo completo antes de
tocar el componente de vista imprimible.

## El pedido original del cliente (contexto textual)

> "Esta parte me gustaría que quedara abajo de donde dice oferta válida hasta y que
> diga descripción general y en la siguiente celda a la derecha el espacio para
> redactar. Esto para no perder la cuadrícula de la cotización."
>
> "Además que en algunos casos se comparten cotizaciones que llevan bastante detalle en
> la descripción de cada ítem y necesito que la celda se vaya agrandando y corriendo
> hacia abajo. A la vez que se pueda ir agregando más ítems y que el pie de página se
> vaya desplazando para abajo. [...] Como las celdas se agrandan ya que están en un
> formato de Excel."

Traducción a requisitos concretos abajo.

## Estructura del documento, en orden

1. **Membrete** — nombre de la empresa (la que emite el documento, una de las 4),
   centrado, usando el logo real cuando esté disponible.
2. **Tabla de datos** (una sola tabla continua — "la cuadrícula" que el cliente no
   quiere perder):
   - Fila: Contacto de servicio (izquierda) | Etiqueta de correlativo (derecha, ver
     `design-system.md`)
   - Fila: Cliente + NIT
   - Fila: Fecha + Dirección
   - Fila: Condiciones de pago (si aplica)
   - Fila: Oferta válida hasta
   - **Fila nueva, inmediatamente después de la anterior:** `Descripción general` en la
     celda izquierda (etiqueta) y un espacio de texto libre en la celda derecha — este
     es el campo que antes vivía como un título centrado dentro de la tabla de ítems, y
     que ahora se movió aquí por pedido explícito del cliente. **No dejarlo como un
     bloque separado fuera de la tabla** — debe ser una fila más de la misma tabla de
     datos, para no romper la cuadrícula.
3. **Encabezado de sección** antes de la tabla de ítems — un separador visual (título o
   franja de color) que indique claramente que empieza el detalle de servicios, para
   diferenciarlo de la tabla de datos de arriba.
4. **Tabla de ítems**: columnas Cantidad, Descripción, Precio unitario, Total.
   - La celda de **Descripción es un `<textarea>` de altura automática** (autosize) o
     un `<div contentEditable>` con `white-space: pre-wrap` — nunca un `<input>` de una
     sola línea ni un texto con `overflow: hidden` / truncado. Debe poder contener
     varios párrafos, igual que en el Excel que ya usa el cliente.
   - Cada renglón puede agregarse o quitarse dinámicamente. Al agregar contenido largo
     a una descripción, la fila crece en altura — nunca se trunca ni se scrollea dentro
     de la celda.
5. Subtotal, Descuento, Total, **Total en letras** (ver algoritmo abajo).
6. Notas (lista editable de título + texto).
7. Anexos (solo en Propuesta).
8. Pie de página: datos de contacto de la empresa que emite.
9. Bloque de firma (Firma / Nombre de responsable / Fecha de aceptación).

## Comportamiento de altura y paginación

- **El documento NO tiene una altura fija de una sola página.** A medida que se agregan
  ítems o las descripciones crecen, el documento debe fluir a tantas páginas como haga
  falta — exactamente como ya sucede en el Excel de referencia que usa el cliente hoy
  (que llega a documentos de varias páginas con 20-30 ítems detallados).
- El pie de página (firma, contacto) **se desplaza hacia abajo** según la cantidad de
  contenido — no es un elemento con posición fija (`position: fixed` o `sticky`) al
  final de la primera página.
- Para la exportación a PDF (vía impresión del navegador, ver `architecture.md`), usar
  una hoja `@media print` que permita que las filas de la tabla de ítems se dividan
  entre páginas de forma natural (`page-break-inside: avoid` solo en el encabezado y en
  el bloque de firma, para que esos dos no se corten a la mitad — el resto del
  documento sí puede partirse entre páginas sin problema).

## Total en letras (conversión de número a texto en español)

Ya existe una implementación de referencia probada — reutilizarla en vez de escribir
una nueva desde cero:

```typescript
// lib/numero-a-letras.ts

const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const DIECES = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const DECENAS = ['veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function palabraDecena(n: number): string {
  if (n < 10) return UNIDADES[n];
  if (n < 20) return DIECES[n - 10];
  const d = Math.floor(n / 10), u = n % 10;
  if (n < 30) return u === 0 ? 'veinte' : 'veinti' + UNIDADES[u];
  return u === 0 ? DECENAS[d - 2] : `${DECENAS[d - 2]} y ${UNIDADES[u]}`;
}

function palabraCentena(n: number): string {
  if (n < 100) return palabraDecena(n);
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100), r = n % 100;
  const cWord = c === 1 ? 'ciento' : CENTENAS[c - 1];
  return r === 0 ? cWord : `${cWord} ${palabraDecena(r)}`;
}

function palabraMiles(n: number): string {
  if (n < 1000) return palabraCentena(n);
  const m = Math.floor(n / 1000), r = n % 1000;
  const mWord = m === 1 ? 'mil' : `${palabraCentena(m)} mil`;
  return r === 0 ? mWord : `${mWord} ${palabraCentena(r)}`;
}

export function numeroALetras(n: number): string {
  n = Math.floor(n);
  if (n === 0) return 'cero';
  if (n < 1_000_000) return palabraMiles(n);
  const mm = Math.floor(n / 1_000_000), r = n % 1_000_000;
  const mmWord = mm === 1 ? 'un millón' : `${palabraMiles(mm)} millones`;
  return r === 0 ? mmWord : `${mmWord} ${palabraMiles(r)}`;
}

export function totalEnLetras(monto: number, moneda: 'GTQ' | 'USD' = 'GTQ'): string {
  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  const letras = numeroALetras(entero);
  const cap = letras.charAt(0).toUpperCase() + letras.slice(1);
  const nombreMoneda = moneda === 'USD' ? 'dólares' : 'quetzales';
  return `${cap} ${nombreMoneda} con ${String(centavos).padStart(2, '0')}/100`;
}
```

Nota: la empresa "Estados Unidos" probablemente factura en USD — confirmar con el
cliente qué moneda usa cada una de las 4 empresas (campo `moneda` ya contemplado en
`Empresa`, ver `data-model.md`) y ajustar el texto de "Total en letras" (dólares vs.
quetzales) según corresponda.

## Envío por correo / WhatsApp

Generar un borrador de mensaje (asunto + cuerpo prellenado) usando un enlace `mailto:`
para correo y `https://wa.me/` para WhatsApp. **Ninguna de las dos plataformas permite
adjuntar un archivo automáticamente desde un enlace externo** — esto es una limitación
inherente de esos protocolos, no un defecto del sistema. El usuario descarga/exporta el
PDF primero y lo adjunta manualmente antes de enviar. Comunicar esto en la interfaz
(un texto de ayuda breve junto a los botones de envío), no ocultarlo.
