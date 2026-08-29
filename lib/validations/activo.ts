import { z } from "zod";

export const TIPO_ACTIVO_LABELS = {
  CAMION: "Camión",
  MAQUINARIA_SOLDAR: "Maquinaria de soldar",
  EQUIPO_ARRASTRE: "Equipo de arrastre",
  FURGON_O_PLATAFORMA: "Furgón o plataforma",
  OTRO: "Otro",
} as const;

export const CATEGORIA_FURGON_LABELS = {
  PORTACONTENEDOR_40: "Portacontenedor 40'",
  PORTACONTENEDOR_20: "Portacontenedor 20'",
  PLATAFORMA: "Plataforma",
  CISTERNA: "Cisterna",
  FURGON_SECO: "Furgón seco",
  FURGON_REFRIGERADO: "Furgón refrigerado",
  LOWBOY: "Lowboy",
} as const;

export const activoSchema = z
  .object({
    empresaId: z.string().min(1, "Seleccioná una empresa"),
    tipo: z.enum([
      "CAMION",
      "MAQUINARIA_SOLDAR",
      "EQUIPO_ARRASTRE",
      "FURGON_O_PLATAFORMA",
      "OTRO",
    ]),
    // Solo aplica cuando tipo = FURGON_O_PLATAFORMA — ver refine abajo y
    // comentario en schema.prisma.
    categoria: z
      .enum([
        "PORTACONTENEDOR_40",
        "PORTACONTENEDOR_20",
        "PLATAFORMA",
        "CISTERNA",
        "FURGON_SECO",
        "FURGON_REFRIGERADO",
        "LOWBOY",
      ])
      .optional()
      .or(z.literal("")),
    placa: z.string().trim().optional().or(z.literal("")),
    // Reemplaza el concepto de "año" — pedido explícito del cliente (ver
    // docs/fase3-clientes-proyectos-costos-activos.md).
    modelo: z.string().trim().optional().or(z.literal("")),
    costo: z.coerce
      .number({ message: "Costo inválido" })
      .nonnegative("El costo no puede ser negativo"),
    valor: z.coerce
      .number({ message: "Valor inválido" })
      .nonnegative("El valor no puede ser negativo"),
    activo: z.boolean().default(true),
  })
  .refine((datos) => datos.tipo !== "FURGON_O_PLATAFORMA" || Boolean(datos.categoria), {
    message: "Elegí una categoría para furgón/plataforma",
    path: ["categoria"],
  });

export type ActivoInput = z.infer<typeof activoSchema>;
export type ActivoFormValues = z.input<typeof activoSchema>;
