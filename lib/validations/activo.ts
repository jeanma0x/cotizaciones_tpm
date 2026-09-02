import { z } from "zod";

export const TIPO_ACTIVO_LABELS = {
  CABEZAL: "Cabezal",
  FURGON_SECO: "Furgón seco",
  FURGON_REFRIGERADO: "Furgón refrigerado",
  PLATAFORMA: "Plataforma",
  LOWBOY: "Lowboy",
  CISTERNA: "Cisterna",
  CAMION: "Camión",
  CAMION_C3: "Camión C3",
  CAMION_C2: "Camión C2",
  PORTACONTENEDOR: "Porta contenedor",
  OTRO: "Otro",
} as const;

export const activoSchema = z
  .object({
    empresaId: z.string().min(1, "Seleccioná una empresa"),
    tipo: z.enum([
      "CABEZAL",
      "FURGON_SECO",
      "FURGON_REFRIGERADO",
      "PLATAFORMA",
      "LOWBOY",
      "CISTERNA",
      "CAMION",
      "CAMION_C3",
      "CAMION_C2",
      "PORTACONTENEDOR",
      "OTRO",
    ]),
    // Solo aplica (y se exige, ver refine abajo) cuando tipo = OTRO — el
    // texto específico que escribe el usuario (ej. "Maquinaria de soldar"),
    // para poder filtrarlo después como si fuera un tipo más. Mismo criterio
    // que CostoOperativo.categoriaOtroDetalle en lib/validations/costo.ts.
    tipoOtroDetalle: z.string().trim().optional().or(z.literal("")),
    placa: z.string().trim().optional().or(z.literal("")),
    // Reemplaza el concepto de "año" — pedido explícito del cliente (ver
    // docs/fase3-clientes-proyectos-costos-activos.md).
    modelo: z.string().trim().optional().or(z.literal("")),
    // Marca y descripción: feedback de Oldemar sobre el módulo ya
    // entregado (no estaban en el alcance original de Fase 3.5).
    marca: z.string().trim().optional().or(z.literal("")),
    descripcion: z.string().trim().optional().or(z.literal("")),
    costo: z.coerce
      .number({ message: "Costo inválido" })
      .nonnegative("El costo no puede ser negativo"),
    valor: z.coerce
      .number({ message: "Valor inválido" })
      .nonnegative("El valor no puede ser negativo"),
    activo: z.boolean().default(true),
  })
  .refine((datos) => datos.tipo !== "OTRO" || Boolean(datos.tipoOtroDetalle), {
    message: "Escribí a qué tipo corresponde",
    path: ["tipoOtroDetalle"],
  });

export type ActivoInput = z.infer<typeof activoSchema>;
export type ActivoFormValues = z.input<typeof activoSchema>;
