"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { actualizarCostoOperativo, crearCostoOperativo } from "@/app/(app)/costos/actions";
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
import {
  CATEGORIA_COSTO_LABELS,
  type CostoOperativoFormValues,
  type CostoOperativoInput,
  costoOperativoSchema,
} from "@/lib/validations/costo";

type Empresa = { id: string; nombre: string };

type Costo = {
  id: string;
  empresaId: string;
  categoria: keyof typeof CATEGORIA_COSTO_LABELS;
  descripcion: string;
  monto: number;
  fechaGasto: string;
};

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export function CostoFormDialog({
  empresas,
  costo,
  trigger,
}: {
  empresas: Empresa[];
  costo?: Costo;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const esEdicion = Boolean(costo);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CostoOperativoFormValues, unknown, CostoOperativoInput>({
    resolver: zodResolver(costoOperativoSchema),
    defaultValues: {
      empresaId: costo?.empresaId ?? empresas[0]?.id ?? "",
      categoria: costo?.categoria ?? "COMBUSTIBLE",
      descripcion: costo?.descripcion ?? "",
      monto: costo?.monto ?? 0,
      fechaGasto: costo?.fechaGasto ?? hoyISO(),
    },
  });

  async function onSubmit(datos: CostoOperativoInput) {
    try {
      if (esEdicion && costo) {
        await actualizarCostoOperativo(costo.id, datos);
        toast.success("Costo actualizado");
      } else {
        await crearCostoOperativo(datos);
        toast.success("Costo registrado");
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
          <DialogTitle>{esEdicion ? "Editar costo" : "Nuevo costo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="empresaId">Empresa</Label>
            <Select
              items={Object.fromEntries(empresas.map((e) => [e.id, e.nombre]))}
              value={watch("empresaId")}
              onValueChange={(v) => setValue("empresaId", v as string)}
              disabled={empresas.length <= 1}
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
            <Label htmlFor="categoria">Categoría</Label>
            <Select
              items={CATEGORIA_COSTO_LABELS}
              value={watch("categoria")}
              onValueChange={(v) =>
                setValue("categoria", v as CostoOperativoInput["categoria"])
              }
            >
              <SelectTrigger id="categoria" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIA_COSTO_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input id="descripcion" {...register("descripcion")} />
            {errors.descripcion && (
              <p className="text-xs text-destructive">{errors.descripcion.message}</p>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="monto">Monto</Label>
              <Input id="monto" type="number" step="0.01" {...register("monto")} />
              {errors.monto && (
                <p className="text-xs text-destructive">{errors.monto.message}</p>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="fechaGasto">Fecha del gasto</Label>
              <Input id="fechaGasto" type="date" {...register("fechaGasto")} />
              {errors.fechaGasto && (
                <p className="text-xs text-destructive">{errors.fechaGasto.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              <CheckIcon className="h-4 w-4" />
              {esEdicion ? "Guardar cambios" : "Registrar costo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
