"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { actualizarServicio, crearServicio } from "@/app/(app)/servicios/actions";
import { ConfirmarDuplicadoDialog } from "@/components/app/confirmar-duplicado-dialog";
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
import { esErrorDuplicado, mensajeDuplicado } from "@/lib/duplicado";
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
  empresaActivaId = null,
}: {
  empresas: Empresa[];
  servicio?: Servicio;
  trigger: React.ReactNode;
  // Fase 3.2 — selector de empresa global. Solo relevante al crear.
  empresaActivaId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const esEdicion = Boolean(servicio);
  const [duplicado, setDuplicado] = useState<{ mensaje: string; datos: ServicioInput } | null>(
    null,
  );
  const [confirmandoDuplicado, setConfirmandoDuplicado] = useState(false);

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
      empresaId: servicio?.empresaId ?? empresaActivaId ?? empresas[0]?.id ?? "",
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
      router.refresh();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "Ocurrió un error";
      if (!esEdicion && esErrorDuplicado(mensaje)) {
        setDuplicado({ mensaje: mensajeDuplicado(mensaje), datos });
        return;
      }
      toast.error(mensaje);
    }
  }

  async function confirmarCrearDuplicado() {
    if (!duplicado) return;
    setConfirmandoDuplicado(true);
    try {
      await crearServicio({ ...duplicado.datos, confirmarDuplicado: true });
      toast.success("Servicio creado");
      reset();
      setDuplicado(null);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error");
    } finally {
      setConfirmandoDuplicado(false);
    }
  }

  return (
    <>
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
              <CheckIcon className="h-4 w-4" />
              {esEdicion ? "Guardar cambios" : "Crear servicio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <ConfirmarDuplicadoDialog
      open={Boolean(duplicado)}
      mensaje={duplicado?.mensaje ?? ""}
      pendiente={confirmandoDuplicado}
      onConfirm={confirmarCrearDuplicado}
      onCancel={() => setDuplicado(null)}
    />
    </>
  );
}
