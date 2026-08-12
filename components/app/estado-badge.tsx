import {
  CheckCircle2,
  Clock,
  FileText,
  Handshake,
  Receipt,
  Send,
  XCircle,
} from "lucide-react";

// Colores e íconos fijos por estado — ver la tabla exacta en
// docs/design-system.md. Ya se mostraron al cliente en la demo y en la
// propuesta firmada, no cambiar.
const ESTILOS_ESTADO: Record<
  string,
  { color: string; background: string; label: string; icon: typeof Send }
> = {
  BORRADOR: { color: "#6B6459", background: "#EDEAE2", label: "Borrador", icon: FileText },
  ENVIADA: { color: "#2F5A78", background: "#E4EDF2", label: "Enviada", icon: Send },
  EN_NEGOCIACION: {
    color: "#C97B22",
    background: "#FBEEDD",
    label: "En negociación",
    icon: Handshake,
  },
  ACEPTADA: {
    color: "#4B7A5B",
    background: "#E7EFE9",
    label: "Aceptada",
    icon: CheckCircle2,
  },
  RECHAZADA: { color: "#B5503A", background: "#F5E7E2", label: "Rechazada", icon: XCircle },
  VENCIDA: { color: "#8A4B3A", background: "#F1E7DE", label: "Vencida", icon: Clock },
  FACTURADA: { color: "#16324F", background: "#E2E8ED", label: "Facturada", icon: Receipt },
};

export function EstadoBadge({ estado }: { estado: string }) {
  const estilo = ESTILOS_ESTADO[estado];
  if (!estilo) return <span className="text-sm">{estado}</span>;
  const Icon = estilo.icon;

  return (
    <span
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium"
      style={{ color: estilo.color, backgroundColor: estilo.background }}
    >
      <Icon className="h-3 w-3" />
      {estilo.label}
    </span>
  );
}
