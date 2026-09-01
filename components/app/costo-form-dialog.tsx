"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
type Cliente = {
  id: string;
  empresaId: string;
  nombre: string;
  proyectos: { id: string; nombre: string; activo: boolean }[];
};

type Costo = {
  id: string;
  empresaId: string;
  clienteId: string | null;
  proyectoId: string | null;
  categoria: keyof typeof CATEGORIA_COSTO_LABELS;
  categoriaOtroDetalle: string | null;
  descripcion: string;
  monto: number;
  fechaGasto: string;
  updatedAt: string;
};

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

// Punto 6, Tanda 3 — advertencia visual (no bloqueante): un gasto a futuro sí
// puede ser legítimo (ej. una renovación de seguro ya pagada por adelantado),
// solo se avisa por si fue un error de tipeo en la fecha.
function esFechaFutura(fechaGasto: string) {
  if (!fechaGasto) return false;
  return fechaGasto > hoyISO();
}

export function CostoFormDialog({
  empresas,
  clientes,
  costo,
  trigger,
  empresaActivaId = null,
}: {
  empresas: Empresa[];
  clientes: Cliente[];
  costo?: Costo;
  trigger: React.ReactNode;
  // Fase 3.2 — selector de empresa global. Solo relevante al crear: precarga
  // y bloquea el campo con la empresa activa, igual que en DocumentoForm.
  empresaActivaId?: string | null;
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
      empresaId: costo?.empresaId ?? empresaActivaId ?? empresas[0]?.id ?? "",
      clienteId: costo?.clienteId ?? "",
      proyectoId: costo?.proyectoId ?? "",
      categoria: costo?.categoria ?? "COMBUSTIBLE",
      categoriaOtroDetalle: costo?.categoriaOtroDetalle ?? "",
      descripcion: costo?.descripcion ?? "",
      monto: costo?.monto ?? 0,
      fechaGasto: costo?.fechaGasto ?? hoyISO(),
    },
  });

  const empresaId = watch("empresaId");
  const clienteId = watch("clienteId");
  const categoria = watch("categoria");
  // Fase 3.3 — mismo criterio que DocumentoForm: solo clientes/proyectos de
  // la empresa/cliente elegidos, con el ya asociado siempre visible aunque
  // esté inactivo (para no perder la asociación existente al editar).
  const clientesDeEmpresa = useMemo(
    () => clientes.filter((c) => c.empresaId === empresaId),
    [clientes, empresaId],
  );
  const clienteActual = clientesDeEmpresa.find((c) => c.id === clienteId);
  const proyectosDelCliente = useMemo(() => {
    if (!clienteActual) return [];
    return clienteActual.proyectos.filter(
      (p) => p.activo || p.id === costo?.proyectoId,
    );
  }, [clienteActual, costo?.proyectoId]);

  async function onSubmit(datos: CostoOperativoInput) {
    try {
      if (esEdicion && costo) {
        await actualizarCostoOperativo(costo.id, costo.updatedAt, datos);
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

          {categoria === "OTRO" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoriaOtroDetalle">¿A qué categoría corresponde?</Label>
              <Input
                id="categoriaOtroDetalle"
                placeholder="Ej. Seguros, Multas…"
                {...register("categoriaOtroDetalle")}
              />
              {errors.categoriaOtroDetalle && (
                <p className="text-xs text-destructive">{errors.categoriaOtroDetalle.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Este texto queda disponible para filtrar más adelante, como si fuera una
                categoría más.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="clienteId">Cliente (opcional)</Label>
              <Select
                items={{
                  "": "Sin cliente específico",
                  ...Object.fromEntries(clientesDeEmpresa.map((c) => [c.id, c.nombre])),
                }}
                value={clienteId || ""}
                onValueChange={(v) => {
                  setValue("clienteId", v as string);
                  setValue("proyectoId", "");
                }}
              >
                <SelectTrigger id="clienteId" className="w-full">
                  <SelectValue placeholder="Sin cliente específico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin cliente específico</SelectItem>
                  {clientesDeEmpresa.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="proyectoId">Proyecto (opcional)</Label>
              <Select
                items={{
                  "": "Sin proyecto específico",
                  ...Object.fromEntries(proyectosDelCliente.map((p) => [p.id, p.nombre])),
                }}
                value={watch("proyectoId") || ""}
                onValueChange={(v) => setValue("proyectoId", v as string)}
                disabled={!clienteActual}
              >
                <SelectTrigger id="proyectoId" className="w-full">
                  <SelectValue placeholder="Sin proyecto específico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin proyecto específico</SelectItem>
                  {proyectosDelCliente.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              {!errors.fechaGasto && esFechaFutura(watch("fechaGasto") ?? "") && (
                <p className="text-xs text-muted-foreground">
                  Esta fecha es a futuro — revisala si no es a propósito (ej. un
                  gasto pagado por adelantado).
                </p>
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
