import { auth } from "@clerk/nextjs/server";
import { Cog } from "lucide-react";
import { notFound } from "next/navigation";
import { DocumentoImprimirToolbar } from "@/components/app/documento-imprimir-toolbar";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";
import { totalEnLetras } from "@/lib/numero-a-letras";
import { PORTADA_INSTITUCIONAL } from "@/lib/portada-institucional";

const TIPO_LABELS: Record<string, string> = {
  COTIZACION: "Cotización",
  PROPUESTA: "Propuesta de servicios",
  FACTURA: "Factura",
};

function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-GT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ImprimirDocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth.protect({ unauthenticatedUrl: "/sign-in" });

  const { id } = await params;
  const empresasPermitidas = await getEmpresasPermitidas();

  const documento = await db.documento.findUnique({
    where: { id },
    include: {
      empresa: true,
      cliente: true,
      items: { orderBy: { orden: "asc" } },
    },
  });
  if (!documento || !empresasPermitidas.includes(documento.empresaId)) {
    notFound();
  }

  const notas = Array.isArray(documento.notas)
    ? (documento.notas as { titulo: string; texto: string }[])
    : [];
  const anexos = Array.isArray(documento.anexos)
    ? (documento.anexos as string[])
    : [];
  const moneda = documento.empresa.moneda === "USD" ? "USD" : "GTQ";
  const tipoLabel = TIPO_LABELS[documento.tipo];

  return (
    // data-theme="light" fijo: un documento exportado (cotización/propuesta/
    // factura) tiene que verse siempre igual sin importar el modo claro/oscuro
    // que tenga activo quien lo esté viendo en la app.
    <div data-theme="light" className="fondo-imprimible min-h-screen bg-[#EAE6DC]">
      <DocumentoImprimirToolbar
        documentoId={documento.id}
        correlativo={documento.correlativo}
        tipoLabel={tipoLabel}
        empresaNombre={documento.empresa.nombre}
        clienteNombre={documento.cliente?.nombre ?? "cliente"}
        clienteTelefono={documento.cliente?.telefono ?? null}
      />

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
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand">
                <Cog className="h-7 w-7 text-accent" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Servicios Generales TPM
                </p>
                <h1 className="font-mono text-2xl font-extrabold text-brand">
                  {documento.empresa.nombre}
                </h1>
              </div>
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
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand">
            <Cog className="h-6 w-6 text-accent" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Servicios Generales TPM
          </p>
          <h1 className="font-mono text-xl font-extrabold text-brand">
            {documento.empresa.nombre}
          </h1>
          <p className="text-xs font-medium uppercase tracking-widest text-accent-hover">
            {tipoLabel}
          </p>
        </header>

        <table className="encabezado-firma mb-6 w-full border-collapse text-sm">
          <tbody>
            <tr>
              <td className="w-1/2 border border-border bg-muted/40 p-3 align-top">
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
              <td className="w-1/2 border border-border bg-muted/40 p-3 align-top">
                <span className="correlativo-tag">TPM-{documento.correlativo}</span>
              </td>
            </tr>
            <tr>
              <td className="border border-border p-3 align-top">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Cliente
                </p>
                <p className="font-medium">{documento.cliente?.nombre ?? "—"}</p>
              </td>
              <td className="border border-border p-3 align-top">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  NIT
                </p>
                <p className="font-mono">{documento.cliente?.nit ?? "—"}</p>
              </td>
            </tr>
            <tr>
              <td className="border border-border p-3 align-top">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Fecha
                </p>
                <p className="font-mono">{formatearFecha(documento.fecha)}</p>
              </td>
              <td className="border border-border p-3 align-top">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Dirección
                </p>
                <p>{documento.cliente?.direccion ?? "—"}</p>
              </td>
            </tr>
            {documento.condicionesPago && (
              <tr>
                <td colSpan={2} className="border border-border p-3 align-top">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Condiciones de pago
                  </p>
                  <p>{documento.condicionesPago}</p>
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={2} className="border border-border p-3 align-top">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Oferta válida hasta
                </p>
                <p className="font-mono">
                  {documento.vigenciaDias ?? "—"} días a partir de la fecha
                </p>
              </td>
            </tr>
            <tr>
              <td className="border border-border bg-muted/40 p-3 align-top">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Descripción general
                </p>
              </td>
              <td className="border border-border p-3 align-top whitespace-pre-wrap">
                {documento.descripcionGeneral || "—"}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="encabezado-seccion mb-3 border-l-4 border-accent bg-brand px-3 py-2 text-xs font-bold uppercase tracking-widest text-surface">
          Detalle de servicios
        </div>

        <table className="mb-6 w-full border-collapse text-sm">
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

        <div className="mb-6 flex justify-end">
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
          <div className="mb-6">
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
          <div className="mb-6">
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

        <footer className="encabezado-firma mt-16 flex flex-col gap-16 text-sm">
          <div className="border-t border-border pt-3 text-center font-mono text-xs text-muted-foreground">
            {documento.empresa.nombre} ·{" "}
            {[documento.empresa.direccion, documento.empresa.telefono, documento.empresa.email]
              .filter(Boolean)
              .join(" · ")}
          </div>

          <div className="grid grid-cols-2 gap-10 text-center">
            <div>
              <div className="mb-1 border-t border-dashed border-brand pt-2 text-xs uppercase tracking-wide text-muted-foreground">
                Firma
              </div>
            </div>
            <div>
              <div className="mb-1 border-t border-dashed border-brand pt-2 text-xs uppercase tracking-wide text-muted-foreground">
                Nombre de responsable y fecha de aceptación
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
