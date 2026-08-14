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
