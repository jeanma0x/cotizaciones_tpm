import {
  CheckCircle2,
  Clock,
  FileText,
  Handshake,
  Receipt,
  Send,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Colores e íconos fijos por estado — ver la tabla exacta en
// docs/design-system.md. Ya se mostraron al cliente en la demo y en la
// propuesta firmada, no cambiar. Todo a través de la capa semántica de
// tokens (nunca un hex suelto ni un primitivo directo).
const ESTILOS_ESTADO: Record<
  string,
  { className: string; label: string; icon: typeof Send }
> = {
  BORRADOR: {
    className: "text-muted-foreground bg-muted",
    label: "Borrador",
    icon: FileText,
  },
  ENVIADA: {
    className: "text-status-enviada bg-status-enviada-bg",
    label: "Enviada",
    icon: Send,
  },
  EN_NEGOCIACION: {
    className: "text-accent-hover bg-accent/15",
    label: "En negociación",
    icon: Handshake,
  },
  ACEPTADA: {
    className: "text-success bg-success-bg",
    label: "Aceptada",
    icon: CheckCircle2,
  },
  RECHAZADA: {
    className: "text-danger bg-danger-bg",
    label: "Rechazada",
    icon: XCircle,
  },
  VENCIDA: {
    className: "text-status-vencida bg-status-vencida-bg",
    label: "Vencida",
    icon: Clock,
  },
  FACTURADA: {
    className: "text-brand bg-brand/10",
    label: "Facturada",
    icon: Receipt,
  },
};

export function EstadoBadge({ estado }: { estado: string }) {
  const estilo = ESTILOS_ESTADO[estado];
  if (!estilo) return <span className="text-sm">{estado}</span>;
  const Icon = estilo.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors duration-(--motion-normal)",
        estilo.className,
      )}
    >
      <Icon className="h-3 w-3" />
      {estilo.label}
    </span>
  );
}
