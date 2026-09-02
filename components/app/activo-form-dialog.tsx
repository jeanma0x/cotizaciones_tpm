"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { actualizarActivo, crearActivo } from "@/app/(app)/activos/actions";
import { AutosizeTextarea } from "@/components/app/autosize-textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parecePlacaValida } from "@/lib/formato-laxo";
import {
  type ActivoFormValues,
  type ActivoInput,
  activoSchema,
  TIPO_ACTIVO_LABELS,
} from "@/lib/validations/activo";

type Empresa = { id: string; nombre: string; moneda: string };

type Activo = {
  id: string;
  empresaId: string;
  tipo: keyof typeof TIPO_ACTIVO_LABELS;
  tipoOtroDetalle: string | null;
  placa: string | null;
  modelo: string | null;
  marca: string | null;
  descripcion: string | null;
  costo: unknown;
  valor: unknown;
  activo: boolean;
};

export function ActivoFormDialog({
  empresas,
  activo,
  trigger,
  empresaActivaId = null,
}: {
  empresas: Empresa[];
  activo?: Activo;
  trigger: React.ReactNode;
  // Fase 3.2 — selector de empresa global. Solo relevante al crear.
  empresaActivaId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const esEdicion = Boolean(activo);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ActivoFormValues, unknown, ActivoInput>({
    resolver: zodResolver(activoSchema),
    defaultValues: {
      empresaId: activo?.empresaId ?? empresaActivaId ?? empresas[0]?.id ?? "",
      tipo: activo?.tipo ?? "CAMION",
      tipoOtroDetalle: activo?.tipoOtroDetalle ?? "",
      placa: activo?.placa ?? "",
      modelo: activo?.modelo ?? "",
      marca: activo?.marca ?? "",
      descripcion: activo?.descripcion ?? "",
      costo: activo ? Number(activo.costo) : 0,
      valor: activo ? Number(activo.valor) : 0,
      activo: activo?.activo ?? true,
    },
  });

  const tipo = watch("tipo");
  const empresaId = watch("empresaId");
  const monedaActual = empresas.find((e) => e.id === empresaId)?.moneda ?? "";

  async function onSubmit(datos: ActivoInput) {
    try {
      if (esEdicion && activo) {
        await actualizarActivo(activo.id, datos);
        toast.success("Activo actualizado");
      } else {
        await crearActivo(datos);
        toast.success("Activo registrado");
        reset();
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar activo" : "Nuevo activo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="empresaId">Empresa</Label>
            <Select
              items={Object.fromEntries(empresas.map((e) => [e.id, e.nombre]))}
              value={empresaId}
              onValueChange={(v) => setValue("empresaId", v as string)}
              disabled={empresas.length <= 1 || (!esEdicion && Boolean(empresaActivaId))}
            >
              <SelectTrigger id="empresaId" className="w-full">
                <SelectValue placeholder="Seleccioná una empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.empresaId && (
              <p className="text-xs text-destructive">{errors.empresaId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              items={TIPO_ACTIVO_LABELS}
              value={tipo}
              onValueChange={(v) => {
                setValue("tipo", v as ActivoInput["tipo"]);
                // Placa/Marca/Modelo solo tienen sentido para los tipos que
                // son vehículos — "Otro" es el único que no lo es
                // necesariamente (ej. maquinaria de soldar), así que se
                // limpian para no arrastrar un valor que ya no aplica.
                if (v === "OTRO") {
                  setValue("placa", "");
                  setValue("marca", "");
                  setValue("modelo", "");
                }
              }}
            >
              <SelectTrigger id="tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_ACTIVO_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tipo === "OTRO" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tipoOtroDetalle">¿A qué tipo corresponde?</Label>
              <Input
                id="tipoOtroDetalle"
                placeholder="Ej. Maquinaria de soldar, Equipo de arrastre…"
                {...register("tipoOtroDetalle")}
              />
              {errors.tipoOtroDetalle && (
                <p className="text-xs text-destructive">{errors.tipoOtroDetalle.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Este texto queda disponible para filtrar más adelante, como si fuera un
                tipo más.
              </p>
            </div>
          )}

          {tipo !== "OTRO" && (
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="placa">Placa</Label>
                <Input id="placa" {...register("placa")} />
                {!parecePlacaValida(watch("placa") ?? "") && (
                  <p className="text-xs text-muted-foreground">
                    Se ve distinta a una placa usual — revisala si no es a propósito.
                  </p>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="marca">Marca</Label>
                <Input id="marca" {...register("marca")} />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="modelo">Modelo</Label>
                <Input id="modelo" {...register("modelo")} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <AutosizeTextarea id="descripcion" {...register("descripcion")} />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="costo">Costo{monedaActual ? ` (${monedaActual})` : ""}</Label>
              <Input id="costo" type="number" step="0.01" {...register("costo")} />
              {errors.costo && (
                <p className="text-xs text-destructive">{errors.costo.message}</p>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="valor">Valor actual{monedaActual ? ` (${monedaActual})` : ""}</Label>
              <Input id="valor" type="number" step="0.01" {...register("valor")} />
              {errors.valor && (
                <p className="text-xs text-destructive">{errors.valor.message}</p>
              )}
            </div>
          </div>
          <p className="-mt-1.5 text-xs text-muted-foreground">
            Costo: lo que costó adquirirlo o traerlo (incluyendo traslado, si vino del
            extranjero). Valor: cuánto vale hoy, ya operando.
          </p>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              <CheckIcon className="h-4 w-4" />
              {esEdicion ? "Guardar cambios" : "Registrar activo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
