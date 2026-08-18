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
    // dark:text-brand-hover — --color-brand (navy-500 en oscuro) como texto
    // sobre este fondo falla contraste AA (~2.3:1 medido); navy-300 sí pasa.
    className: "text-brand bg-brand/10 dark:text-brand-hover",
    label: "Facturada",
    icon: Receipt,
  },
};

// Usado también por DocumentoEstadoForm (línea de tiempo del historial) para
// que el ícono/color de cada paso sea exactamente el mismo que el badge —
// nunca una paleta paralela.
export function getEstiloEstado(estado: string) {
  return ESTILOS_ESTADO[estado];
}

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
