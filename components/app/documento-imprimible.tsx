import type { Prisma } from "@prisma/client";
import { totalEnLetras } from "@/lib/numero-a-letras";
import { PORTADA_INSTITUCIONAL } from "@/lib/portada-institucional";

const TIPO_LABELS: Record<string, string> = {
  COTIZACION: "Cotización",
  PROPUESTA: "Propuesta de servicios",
  FACTURA: "Factura",
};

// timeZone: "UTC" (no la zona horaria de Guatemala) — estos campos (fecha
// del documento, fecha de aceptación) son fechas de calendario puras: vienen
// de un <input type="date"> como "2026-08-18", y Date las interpreta como
// medianoche UTC. Para mostrar ese mismo día sin importar dónde corra el
// proceso, hay que leerlas en la MISMA zona en la que se guardaron (UTC) —
// pinearlas a America/Guatemala (UTC-6) las corre un día hacia atrás, que es
// justo el bug que esto corrige (detectado en desarrollo local, donde el
// proceso corre en America/Guatemala; en producción/Vercel, que corre en
// UTC, coincidía por casualidad).
function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-GT", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

type DocumentoConDecimal = Prisma.DocumentoGetPayload<{
  include: {
    empresa: true;
    cliente: true;
    items: true;
    firmante: true;
  };
}>;

// Compartido entre la página completa (/documentos/[id]/imprimir) y el modal
// (documento-imprimir-dialog.tsx). Los campos Decimal de Prisma (subtotal,
// descuento, total, cantidad, precioUnitario) se convierten a number ANTES
// de llegar acá — un Decimal no es un objeto plano y no puede cruzar el
// límite Server → Client Component (el modal es "use client"), por eso
// `serializarDocumento` existe: se llama una sola vez en cada página, justo
// después del fetch, antes de que el dato llegue a cualquier componente.
export type DocumentoImprimibleData = Omit<
  DocumentoConDecimal,
  "subtotal" | "descuento" | "total" | "items"
> & {
  subtotal: number;
  descuento: number;
  total: number;
  items: (Omit<DocumentoConDecimal["items"][number], "cantidad" | "precioUnitario"> & {
    cantidad: number;
    precioUnitario: number;
  })[];
};

type ItemConDecimal = { cantidad: Prisma.Decimal; precioUnitario: Prisma.Decimal };
type ConDecimales = {
  subtotal: Prisma.Decimal;
  descuento: Prisma.Decimal;
  total: Prisma.Decimal;
  items: ItemConDecimal[];
};

// Genérico sobre T: preserva la forma exacta de `cliente` (y cualquier otro
// campo) del caller — la página completa incluye `cliente.contactos`, esta
// función no necesita saberlo, solo convierte los Decimal a number.
type Serializado<T extends ConDecimales> = Omit<
  T,
  "subtotal" | "descuento" | "total" | "items"
> & {
  subtotal: number;
  descuento: number;
  total: number;
  items: (Omit<T["items"][number], "cantidad" | "precioUnitario"> & {
    cantidad: number;
    precioUnitario: number;
  })[];
};

export function serializarDocumento<T extends ConDecimales>(documento: T): Serializado<T> {
  // El cast es seguro: el objeto en runtime tiene exactamente esta forma
  // (mismos campos que T, solo con los 3 Decimal + los de cada ítem ya
  // convertidos a number) — TypeScript no puede verificar un spread
  // genérico así de preciso por sí solo.
  return {
    ...documento,
    subtotal: Number(documento.subtotal),
    descuento: Number(documento.descuento),
    total: Number(documento.total),
    items: documento.items.map((item) => ({
      ...item,
      cantidad: Number(item.cantidad),
      precioUnitario: Number(item.precioUnitario),
    })),
  } as unknown as Serializado<T>;
}

export function DocumentoImprimible({ documento }: { documento: DocumentoImprimibleData }) {
  const notas = Array.isArray(documento.notas)
    ? (documento.notas as { titulo: string; texto: string }[])
    : [];
  const anexos = Array.isArray(documento.anexos)
    ? (documento.anexos as string[])
    : [];
  const moneda = documento.empresa.moneda === "USD" ? "USD" : "GTQ";
  const tipoLabel = TIPO_LABELS[documento.tipo];

  return (
    <>
      {documento.estado === "BORRADOR" && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center"
        >
          <span className="rotate-[-30deg] font-mono text-[10rem] font-black text-danger/10 select-none">
            BORRADOR
          </span>
        </div>
      )}

      <div className="documento-imprimible relative mx-auto max-w-3xl bg-surface px-10 py-12 text-text-primary shadow-sm print:shadow-none">
        {documento.tipo === "PROPUESTA" && (
          <section className="page-break-after mb-12 flex flex-col gap-7">
            <div className="flex flex-col items-center gap-3 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático de marca, no necesita optimización de next/image */}
              <img
                src="/marca/svg/logo-color.svg"
                alt="Servicios Generales TPM"
                className="h-20 w-auto"
              />
              <h1 className="font-mono text-2xl font-extrabold text-brand">
                {documento.empresa.nombre}
              </h1>
              <p className="text-sm font-medium uppercase tracking-widest text-accent-hover">
                {tipoLabel}
              </p>
            </div>
            {PORTADA_INSTITUCIONAL.map((seccion) => (
              <div key={seccion.titulo}>
                <h2 className="mb-1.5 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand">
                  <span className="h-px w-4 bg-accent" />
                  {seccion.titulo}
                </h2>
                {seccion.texto && (
                  <p className="text-sm leading-relaxed">{seccion.texto}</p>
                )}
                {seccion.lista && (
                  <ol className="list-decimal pl-5 text-sm leading-relaxed marker:font-mono marker:text-accent-hover">
                    {seccion.lista.map((punto) => (
                      <li key={punto}>{punto}</li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </section>
        )}

        <header className="encabezado-firma mb-6 flex flex-col items-center gap-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático de marca, no necesita optimización de next/image */}
          <img
            src="/marca/svg/logo-color.svg"
            alt="Servicios Generales TPM"
            className="h-14 w-auto"
          />
          <h1 className="font-mono text-xl font-extrabold text-brand">
            {documento.empresa.nombre}
          </h1>
          <p className="text-xs font-medium uppercase tracking-widest text-accent-hover">
            {tipoLabel}
          </p>
        </header>

        <table className="encabezado-firma mb-4 w-full border-collapse text-sm">
          <tbody>
            <tr>
              <td className="w-1/2 border border-border bg-muted/40 p-2.5 align-top">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Contacto de servicio
                </p>
                <p className="font-medium">{documento.empresa.contacto ?? "—"}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {[documento.empresa.telefono, documento.empresa.email]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </td>
              <td className="w-1/2 border border-border bg-muted/40 p-2.5 align-top">
                <span className="correlativo-tag">TPM-{documento.correlativo}</span>
              </td>
            </tr>
            <tr>
              <td className="border border-border p-2.5 align-top">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Cliente
                </p>
                <p className="font-medium">{documento.cliente?.nombre ?? "—"}</p>
              </td>
              <td className="border border-border p-2.5 align-top">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  NIT
                </p>
                <p className="font-mono">{documento.cliente?.nit ?? "—"}</p>
              </td>
            </tr>
            <tr>
              <td className="border border-border p-2.5 align-top">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Fecha
                </p>
                <p className="font-mono">{formatearFecha(documento.fecha)}</p>
              </td>
              <td className="border border-border p-2.5 align-top">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Dirección
                </p>
                <p>{documento.cliente?.direccion ?? "—"}</p>
              </td>
            </tr>
            {/* Una sola fila con las dos columnas cuando hay condiciones de
                pago (mismo patrón que Cliente/NIT y Fecha/Dirección arriba)
                en vez de dos filas colSpan=2 separadas — ahorra una fila
                completa de la tabla en documentos cortos, sin quitar nada:
                Oldemar pidió que el PDF ocupe menos hojas cuando el
                contenido lo permite. */}
            <tr>
              <td className="border border-border p-2.5 align-top">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Condiciones de pago
                </p>
                <p>{documento.condicionesPago || "—"}</p>
              </td>
              <td className="border border-border p-2.5 align-top">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Oferta válida hasta
                </p>
                <p className="font-mono">
                  {documento.vigenciaDias ?? "—"} días a partir de la fecha
                </p>
              </td>
            </tr>
            <tr>
              <td className="border border-border bg-muted/40 p-2.5 align-top">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Descripción general
                </p>
              </td>
              <td className="border border-border p-2.5 align-top whitespace-pre-wrap">
                {documento.descripcionGeneral || "—"}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="encabezado-seccion mb-3 border-l-4 border-accent bg-brand px-3 py-2 text-xs font-bold uppercase tracking-widest text-surface">
          Detalle de servicios
        </div>

        <table className="mb-4 w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-border bg-brand p-2 text-left text-xs uppercase tracking-wide text-surface">
                Cantidad
              </th>
              <th className="border border-border bg-brand p-2 text-left text-xs uppercase tracking-wide text-surface">
                Descripción
              </th>
              <th className="border border-border bg-brand p-2 text-left text-xs uppercase tracking-wide text-surface">
                Precio unitario
              </th>
              <th className="border border-border bg-brand p-2 text-left text-xs uppercase tracking-wide text-surface">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {documento.items.map((item, i) => (
              <tr
                key={item.id}
                className={`item-imprimible ${i % 2 === 1 ? "bg-muted/30" : ""}`}
              >
                <td className="border border-border p-2 align-top font-mono">
                  {Number(item.cantidad)}
                </td>
                <td className="border border-border p-2 align-top whitespace-pre-wrap">
                  {item.descripcion}
                </td>
                <td className="border border-border p-2 align-top font-mono">
                  {Number(item.precioUnitario).toFixed(2)}
                </td>
                <td className="border border-border p-2 align-top font-mono">
                  {(Number(item.cantidad) * Number(item.precioUnitario)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mb-4 flex justify-end">
          <div className="flex w-72 flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">
                {moneda} {Number(documento.subtotal).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Descuento</span>
              <span className="font-mono">
                {moneda} {Number(documento.descuento).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-t border-brand pt-1 text-base font-semibold text-brand">
              <span>Total</span>
              <span className="font-mono">
                {moneda} {Number(documento.total).toFixed(2)}
              </span>
            </div>
            <p className="mt-2 rounded border border-dashed border-border bg-muted/40 p-2 text-right text-xs italic text-muted-foreground">
              {totalEnLetras(Number(documento.total), moneda)}
            </p>
          </div>
        </div>

        {notas.length > 0 && (
          <div className="mb-4">
            <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand">
              <span className="h-px w-4 bg-accent" />
              Notas
            </h2>
            <div className="flex flex-col gap-2 text-sm">
              {notas.map((nota, i) => (
                <div key={i} className="nota-imprimible">
                  <p className="font-medium">{nota.titulo}</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">{nota.texto}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {documento.tipo === "PROPUESTA" && anexos.length > 0 && (
          <div className="mb-4">
            <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand">
              <span className="h-px w-4 bg-accent" />
              Anexos
            </h2>
            <ul className="list-disc pl-5 text-sm">
              {anexos.map((anexo, i) => (
                <li key={i}>{anexo}</li>
              ))}
            </ul>
          </div>
        )}

        {/* mt-8: separación antes del pie, solo un respiro visual, no
            necesita ser tan generosa como el espacio de firma en sí.
            gap-12: el espacio real donde se firma a mano encima de la línea
            punteada de abajo — se deja más generoso a propósito, no se toca
            tanto como mt-8 (ver docs/design-system.md: nada de contenido
            cortado ni de firma sin espacio real para escribir). */}
        <footer className="encabezado-firma mt-8 flex flex-col gap-12 text-sm">
          <div className="border-t border-border pt-3 text-center font-mono text-xs text-muted-foreground">
            {documento.empresa.nombre} ·{" "}
            {[documento.empresa.direccion, documento.empresa.telefono, documento.empresa.email]
              .filter(Boolean)
              .join(" · ")}
          </div>

          <div className="grid grid-cols-2 gap-10 text-center">
            <div>
              {/* h-14 fijo en AMBAS columnas (con o sin imagen/firmante) —
                  así las dos líneas punteadas quedan a la misma altura sin
                  importar si esta columna tiene imagen o no. Solo la imagen
                  va arriba de la línea; el nombre del firmante se movió
                  abajo, junto con la etiqueta, igual que el responsable. */}
              <div className="flex h-14 items-end justify-center">
                {documento.firmante?.firma && (
                  // eslint-disable-next-line @next/next/no-img-element -- data URI cargado por el usuario, no un asset estático
                  <img
                    src={documento.firmante.firma}
                    alt={`Firma de ${documento.firmante.nombre}`}
                    className="h-14 object-contain"
                  />
                )}
              </div>
              <div className="mb-1 border-t border-dashed border-brand pt-2 text-xs">
                {documento.firmante?.firma ? (
                  <p className="font-medium text-text-primary">{documento.firmante.nombre}</p>
                ) : (
                  <span className="uppercase tracking-wide text-muted-foreground">Firma</span>
                )}
              </div>
            </div>
            <div>
              {/* Mismo h-14 que la columna de Firma, siempre vacío — es el
                  espacio para que el cliente firme a mano o digitalmente de
                  su lado. El nombre/fecha (cuando existen) reemplazan la
                  etiqueta genérica de abajo, nunca ocupan este espacio. */}
              <div className="h-14" />
              <div className="mb-1 border-t border-dashed border-brand pt-2 text-xs">
                {documento.nombreResponsable || documento.fechaAceptacion ? (
                  <div className="normal-case">
                    {documento.nombreResponsable && (
                      <p className="font-medium text-text-primary">
                        {documento.nombreResponsable}
                      </p>
                    )}
                    {documento.fechaAceptacion && (
                      <p className="text-muted-foreground">
                        {formatearFecha(documento.fechaAceptacion)}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="uppercase tracking-wide text-muted-foreground">
                    Nombre de responsable y fecha de aceptación
                  </span>
                )}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
