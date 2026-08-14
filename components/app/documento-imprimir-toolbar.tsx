"use client";

import { DownloadIcon, MailIcon, MessageCircleIcon } from "lucide-react";
import { useState } from "react";
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

type Contacto = { id: string; nombre: string; email: string };

export function DocumentoImprimirToolbar({
  documentoId,
  correlativo,
  tipoLabel,
  empresaNombre,
  empresaEmail,
  clienteNombre,
  clienteTelefono,
  clienteEmail,
  contactos,
  dentroDeModal = false,
}: {
  documentoId: string;
  correlativo: number;
  tipoLabel: string;
  empresaNombre: string;
  empresaEmail: string | null;
  clienteNombre: string;
  clienteTelefono: string | null;
  clienteEmail: string | null;
  contactos: Contacto[];
  // El modal ya tiene su propia X de cierre (Dialog) — "Volver al documento"
  // y el párrafo de ayuda no aplican ahí, solo en la página completa.
  dentroDeModal?: boolean;
}) {
  // Si es cliente EMPRESA con contactos cargados, se elige uno (ej. CMI: 4
  // destinatarios distintos según el mes/servicio). Si no, se usa el correo
  // suelto del cliente. En ambos casos queda editable — Oldemar pidió poder
  // corregirlo a mano antes de enviar (ej. un correo genérico de relleno).
  const [destinatario, setDestinatario] = useState(
    contactos[0]?.email ?? clienteEmail ?? "",
  );

  const asunto = encodeURIComponent(`${tipoLabel} TPM-${correlativo} (${empresaNombre})`);
  const cuerpo = encodeURIComponent(
    `Hola ${clienteNombre},\n\nAdjunto la ${tipoLabel.toLowerCase()} TPM-${correlativo}.\n\nSaludos,\n${empresaNombre}`,
  );
  const paramsCorreo = new URLSearchParams();
  paramsCorreo.set("subject", decodeURIComponent(asunto));
  paramsCorreo.set("body", decodeURIComponent(cuerpo));
  if (empresaEmail) paramsCorreo.set("cc", empresaEmail);
  const mailtoHref = `mailto:${destinatario.trim()}?${paramsCorreo.toString()}`;

  const telefono = soloDigitos(clienteTelefono);
  const textoWhatsapp = encodeURIComponent(
    `Hola ${clienteNombre}, te comparto la ${tipoLabel.toLowerCase()} TPM-${correlativo}.`,
  );
  const whatsappHref = telefono
    ? `https://wa.me/${telefono}?text=${textoWhatsapp}`
    : `https://wa.me/?text=${textoWhatsapp}`;

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
        {contactos.length > 1 && (
          <Select
            items={Object.fromEntries(contactos.map((c) => [c.email, `${c.nombre} <${c.email}>`]))}
            value={contactos.some((c) => c.email === destinatario) ? destinatario : ""}
            onValueChange={(v) => setDestinatario(v as string)}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Elegir destinatario" />
            </SelectTrigger>
            <SelectContent>
              {contactos.map((c) => (
                <SelectItem key={c.id} value={c.email}>
                  {c.nombre} &lt;{c.email}&gt;
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          type="email"
          value={destinatario}
          onChange={(e) => setDestinatario(e.target.value)}
          placeholder="correo@destinatario.com"
          className="w-56"
        />
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
          render={<a href={whatsappHref} target="_blank" rel="noopener noreferrer" />}
        >
          <MessageCircleIcon className="h-4 w-4" />
          WhatsApp
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <DownloadIcon className="h-4 w-4" />
          Imprimir / Exportar PDF
        </Button>
      </div>
    </div>
  );
}
