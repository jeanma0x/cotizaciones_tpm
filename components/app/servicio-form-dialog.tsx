"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { actualizarServicio, crearServicio } from "@/app/(app)/servicios/actions";
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
  type ServicioFormValues,
  type ServicioInput,
  servicioSchema,
} from "@/lib/validations/servicio";

type Empresa = { id: string; nombre: string };

type Servicio = {
  id: string;
  empresaId: string;
  nombre: string;
  precioFijo: unknown;
  activo: boolean;
};

export function ServicioFormDialog({
  empresas,
  servicio,
  trigger,
}: {
  empresas: Empresa[];
  servicio?: Servicio;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const esEdicion = Boolean(servicio);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ServicioFormValues, unknown, ServicioInput>({
    resolver: zodResolver(servicioSchema),
    defaultValues: {
      empresaId: servicio?.empresaId ?? empresas[0]?.id ?? "",
      nombre: servicio?.nombre ?? "",
      precioFijo: servicio ? Number(servicio.precioFijo) : 0,
      activo: servicio?.activo ?? true,
    },
  });

  async function onSubmit(datos: ServicioInput) {
    try {
      if (esEdicion && servicio) {
        await actualizarServicio(servicio.id, datos);
        toast.success("Servicio actualizado");
      } else {
        await crearServicio(datos);
        toast.success("Servicio creado");
        reset();
      }
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
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
            <Label htmlFor="nombre">Nombre del servicio</Label>
            <Input id="nombre" {...register("nombre")} />
            {errors.nombre && (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="precioFijo">Precio fijo</Label>
            <Input
              id="precioFijo"
              type="number"
              step="0.01"
              {...register("precioFijo")}
            />
            {errors.precioFijo && (
              <p className="text-xs text-destructive">{errors.precioFijo.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {esEdicion ? "Guardar cambios" : "Crear servicio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
