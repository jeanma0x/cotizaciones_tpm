"use client";

import { CopyIcon, DownloadIcon, MailIcon, MessageCircleIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VolverLink } from "@/components/app/volver-link";

function soloDigitos(valor: string | null | undefined) {
  return (valor ?? "").replace(/\D/g, "");
}

// Fase 3.6 — el navegador sugiere document.title como nombre de archivo al
// "Guardar como PDF", así que sin esto todos los documentos se exportaban
// con el título genérico de la app ("Servicios Generales TPM"), sin forma
// de distinguir uno de otro en la carpeta de Descargas. Se restaura el
// título original en "afterprint" (no con un setTimeout arbitrario):
// window.print() no es garantizadamente síncrono en todos los navegadores,
// así que hay que esperar a que el diálogo de impresión realmente cierre.
function nombreArchivoPdf(correlativo: number, tipoLabel: string, clienteNombre: string) {
  return [`TPM-${correlativo}`, tipoLabel, clienteNombre].filter(Boolean).join(" - ");
}

// timeZone: "UTC" — ver el mismo comentario en documento-imprimible.tsx.
// "fecha" es una fecha de calendario pura guardada como medianoche UTC;
// leerla de vuelta en UTC es lo que reproduce el mismo día que se escribió,
// sin importar en qué zona horaria corra el proceso.
function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-GT", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

type Contacto = { id: string; nombre: string; email: string };

export function DocumentoImprimirToolbar({
  documentoId,
  correlativo,
  tipoLabel,
  empresaNombre,
  empresaEmail,
  empresaTelefono,
  clienteNombre,
  clienteTelefono,
  clienteEmail,
  contactos,
  moneda,
  total,
  vigenciaDias,
  condicionesPago,
  fecha,
  empresaCodigoPais,
  clienteCodigoPais,
  dentroDeModal = false,
}: {
  documentoId: string;
  correlativo: number;
  tipoLabel: string;
  empresaNombre: string;
  empresaEmail: string | null;
  empresaTelefono: string | null;
  clienteNombre: string;
  clienteTelefono: string | null;
  clienteEmail: string | null;
  contactos: Contacto[];
  moneda: string;
  total: number;
  vigenciaDias: number | null;
  condicionesPago: string | null;
  fecha: Date;
  // wa.me exige el número completo con código de país — Cliente.telefono
  // nunca lo incluye. El del cliente (si lo tiene) gana sobre el de su
  // empresa — ver comentario en schema.prisma.
  empresaCodigoPais: string;
  clienteCodigoPais: string | null;
  // El modal ya tiene su propia X de cierre (Dialog) — "Volver al documento"
  // y el párrafo de ayuda no aplican ahí, solo en la página completa.
  dentroDeModal?: boolean;
}) {
  // Empieza con un solo destinatario (el primer contacto, o el correo suelto
  // del cliente) — Oldemar/Jean pidieron NO precargar todos los contactos de
  // una, sino poder ir agregando desde acá los que hagan falta ese mes (caso
  // CMI: no siempre se manda a los 4 destinatarios a la vez).
  const [destinatario, setDestinatario] = useState(
    contactos[0]?.email ?? clienteEmail ?? "",
  );

  function agregarContacto(email: string | null) {
    // El Select dispara onValueChange(null) en un paso intermedio al elegir
    // una opción cuando su `value` controlado no coincide con ningún item
    // (acá siempre vale "" a propósito, para que quede vacío después de
    // agregar) — ignorar esos null, no son una elección real del usuario.
    if (!email) return;
    const yaIncluido = destinatario
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .includes(email.toLowerCase());
    if (yaIncluido) return;
    setDestinatario((actual) => (actual.trim() ? `${actual.trim()}, ${email}` : email));
  }

  const asuntoTexto = `${tipoLabel} TPM-${correlativo} (${empresaNombre})`;
  const cuerpoTexto = [
    `Hola ${clienteNombre},`,
    "",
    `Le compartimos la ${tipoLabel.toLowerCase()} TPM-${correlativo} de ${empresaNombre}, adjunta en este correo.`,
    "",
    "Resumen:",
    `- Total: ${moneda} ${total.toFixed(2)}`,
    vigenciaDias ? `- Oferta válida por ${vigenciaDias} días a partir del ${formatearFecha(fecha)}.` : null,
    condicionesPago ? `- Condiciones de pago: ${condicionesPago}` : null,
    "",
    "Cualquier consulta, quedamos atentos.",
    "",
    "Saludos,",
    empresaNombre,
    [empresaTelefono, empresaEmail].filter(Boolean).join(" · "),
  ]
    .filter((linea) => linea !== null)
    .join("\n");

  const paramsCorreo = new URLSearchParams();
  paramsCorreo.set("subject", asuntoTexto);
  paramsCorreo.set("body", cuerpoTexto);
  if (empresaEmail) paramsCorreo.set("cc", empresaEmail);
  const mailtoHref = `mailto:${destinatario.trim()}?${paramsCorreo.toString()}`;

  // mailto: solo funciona si el sistema operativo tiene un cliente de correo
  // configurado (Mail, Outlook) — sin eso, el navegador no tiene con qué
  // abrirlo y queda en about:blank. Gmail web compose es el respaldo real
  // para quien no lo tiene configurado (el correo de la empresa ya es
  // @gmail.com) — funciona con solo tener sesión iniciada en el navegador.
  const paramsGmail = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: destinatario.trim(),
    su: asuntoTexto,
    body: cuerpoTexto,
  });
  if (empresaEmail) paramsGmail.set("cc", empresaEmail);
  const gmailHref = `https://mail.google.com/mail/?${paramsGmail.toString()}`;

  async function copiarDatosCorreo() {
    const texto = `Para: ${destinatario.trim()}\nAsunto: ${asuntoTexto}\n\n${cuerpoTexto}`;
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Datos del correo copiados");
    } catch {
      toast.error("No se pudo copiar — copiá manualmente");
    }
  }

  function imprimir() {
    const tituloOriginal = document.title;
    document.title = nombreArchivoPdf(correlativo, tipoLabel, clienteNombre);
    function restaurarTitulo() {
      document.title = tituloOriginal;
      window.removeEventListener("afterprint", restaurarTitulo);
    }
    window.addEventListener("afterprint", restaurarTitulo);
    window.print();
  }

  const codigoPais = (clienteCodigoPais || empresaCodigoPais).replace(/\D/g, "");
  const telefono = soloDigitos(clienteTelefono);
  const telefonoConCodigo = telefono ? `${codigoPais}${telefono}` : "";
  const textoWhatsapp = [
    `Hola ${clienteNombre}, te comparto la ${tipoLabel.toLowerCase()} TPM-${correlativo} de ${empresaNombre}.`,
    `Total: ${moneda} ${total.toFixed(2)}${vigenciaDias ? ` · válida ${vigenciaDias} días` : ""}.`,
    "Adjunto el PDF a continuación.",
  ].join("\n");
  const whatsappHref = telefonoConCodigo
    ? `https://wa.me/${telefonoConCodigo}?text=${encodeURIComponent(textoWhatsapp)}`
    : `https://wa.me/?text=${encodeURIComponent(textoWhatsapp)}`;

  const contactosDisponibles = contactos.filter(
    (c) => !destinatario.split(",").map((d) => d.trim().toLowerCase()).includes(c.email.toLowerCase()),
  );

  return (
    <div className="no-imprimir sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/95 px-6 py-3 backdrop-blur">
      {dentroDeModal ? (
        <p className="text-xs text-muted-foreground">
          Exportá el PDF primero y adjuntalo manualmente al correo o WhatsApp.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <VolverLink href={`/documentos/${documentoId}`} label="Volver al documento" />
          <p className="text-xs text-muted-foreground">
            Exportá el PDF primero y adjuntalo manualmente al correo o WhatsApp. Ninguna de
            las dos plataformas permite adjuntar archivos automáticamente desde un enlace
            externo.
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="text"
          value={destinatario}
          onChange={(e) => setDestinatario(e.target.value)}
          placeholder="correo@destinatario.com"
          className="w-64"
        />
        {contactosDisponibles.length > 0 && (
          <Select
            items={Object.fromEntries(contactosDisponibles.map((c) => [c.email, `${c.nombre} <${c.email}>`]))}
            value=""
            onValueChange={(v) => agregarContacto(v as string | null)}
          >
            <SelectTrigger className="w-44">
              <PlusIcon className="h-3.5 w-3.5" />
              <SelectValue placeholder="Agregar" />
            </SelectTrigger>
            <SelectContent>
              {contactosDisponibles.map((c) => (
                <SelectItem key={c.id} value={c.email}>
                  {c.nombre} &lt;{c.email}&gt;
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {/* target="_blank", igual que WhatsApp abajo: sin esto, en Chrome el
            mailto: intenta navegar la MISMA pestaña mientras el sistema
            operativo decide qué hacer, y si no hay un cliente de correo
            configurado, esa pestaña se queda en about:blank — perdiendo la
            vista de impresión activa. Con target="_blank" el intento fallido
            queda aislado en una pestaña descartable, no en la que el usuario
            está usando. */}
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href={mailtoHref} target="_blank" rel="noopener noreferrer" />}
        >
          <MailIcon className="h-4 w-4" />
          Correo
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href={gmailHref} target="_blank" rel="noopener noreferrer" />}
        >
          <MailIcon className="h-4 w-4" />
          Gmail
        </Button>
        <Button variant="outline" size="sm" onClick={copiarDatosCorreo}>
          <CopyIcon className="h-4 w-4" />
          Copiar
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href={whatsappHref} target="_blank" rel="noopener noreferrer" />}
        >
          <MessageCircleIcon className="h-4 w-4" />
          WhatsApp
        </Button>
        <Button size="sm" onClick={imprimir}>
          <DownloadIcon className="h-4 w-4" />
          Imprimir / Exportar PDF
        </Button>
      </div>
    </div>
  );
}
