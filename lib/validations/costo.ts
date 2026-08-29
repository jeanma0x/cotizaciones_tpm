import { z } from "zod";

export const CATEGORIA_COSTO_LABELS = {
  COMBUSTIBLE: "Combustible",
  PLANILLA: "Planilla",
  PROVEEDORES: "Proveedores",
  PREDIO: "Predio",
  LUZ: "Luz",
  CONSUMIBLES: "Consumibles",
  OTRO: "Otro",
} as const;

export const costoOperativoSchema = z.object({
  empresaId: z.string().min(1, "Seleccioná una empresa"),
  categoria: z.enum([
    "COMBUSTIBLE",
    "PLANILLA",
    "PROVEEDORES",
    "PREDIO",
    "LUZ",
    "CONSUMIBLES",
    "OTRO",
  ]),
  // Fase 3.3 — ambos opcionales: un costo puede quedar sin asociar a ningún
  // cliente/proyecto (costo general de la empresa, ej. planilla), asociado
  // solo al cliente en general, o a un proyecto específico de ese cliente.
  clienteId: z.string().optional().or(z.literal("")),
  proyectoId: z.string().optional().or(z.literal("")),
  descripcion: z.string().trim().min(1, "La descripción es obligatoria"),
  monto: z.coerce
    .number({ message: "Monto inválido" })
    .positive("El monto debe ser mayor a 0"),
  // Fecha a la que corresponde el gasto (no cuándo se registró) — ver
  // comentario en schema.prisma sobre el caso del reporte de julio que llega
  // en agosto.
  fechaGasto: z.string().min(1, "La fecha es obligatoria"),
});

export type CostoOperativoInput = z.infer<typeof costoOperativoSchema>;
export type CostoOperativoFormValues = z.input<typeof costoOperativoSchema>;
