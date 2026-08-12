"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  actualizarDocumento,
  crearDocumento,
} from "@/app/(app)/documentos/actions";
import Link from "next/link";
import { AutosizeTextarea } from "@/components/app/autosize-textarea";
import { ClienteCombobox } from "@/components/app/cliente-combobox";
import { Button } from "@/components/ui/button";
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
  type DocumentoFormValues,
  type DocumentoInput,
  documentoSchema,
} from "@/lib/validations/documento";

const TIPO_LABELS: Record<string, string> = {
  COTIZACION: "Cotización",
  PROPUESTA: "Propuesta de servicios",
  FACTURA: "Factura",
};

type Empresa = { id: string; nombre: string; moneda: string };
type Cliente = { id: string; empresaId: string; nombre: string };
type Servicio = {
  id: string;
  empresaId: string;
  nombre: string;
  precioFijo: unknown;
};

type DocumentoExistente = {
  id: string;
  empresaId: string;
  tipo: string;
  clienteId: string | null;
  fecha: Date;
  vigenciaDias: number | null;
  condicionesPago: string | null;
  descripcionGeneral: string | null;
  descuento: unknown;
  notas: unknown;
  anexos: unknown;
  items: { cantidad: unknown; descripcion: string; precioUnitario: unknown }[];
};

function aFechaInput(fecha: Date) {
  return fecha.toISOString().slice(0, 10);
}

export function DocumentoForm({
  empresas,
  clientes,
  servicios,
  documento,
}: {
  empresas: Empresa[];
  clientes: Cliente[];
  servicios: Servicio[];
  documento?: DocumentoExistente;
}) {
  const esEdicion = Boolean(documento);
  const [submitting, setSubmitting] = useState(false);

  const notasIniciales = Array.isArray(documento?.notas)
    ? (documento.notas as { titulo: string; texto: string }[])
    : [];
  const anexosIniciales = Array.isArray(documento?.anexos)
    ? (documento.anexos as string[])
    : [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DocumentoFormValues, unknown, DocumentoInput>({
    resolver: zodResolver(documentoSchema),
    defaultValues: {
      empresaId: documento?.empresaId ?? empresas[0]?.id ?? "",
      tipo: (documento?.tipo as DocumentoFormValues["tipo"]) ?? "COTIZACION",
      clienteId: documento?.clienteId ?? "",
      fecha: documento ? aFechaInput(documento.fecha) : aFechaInput(new Date()),
      vigenciaDias: documento?.vigenciaDias ?? 15,
      condicionesPago: documento?.condicionesPago ?? "",
      descripcionGeneral: documento?.descripcionGeneral ?? "",
      descuento: documento ? Number(documento.descuento) : 0,
      items: documento
        ? documento.items.map((item) => ({
            cantidad: Number(item.cantidad),
            descripcion: item.descripcion,
            precioUnitario: Number(item.precioUnitario),
          }))
        : [{ cantidad: 1, descripcion: "", precioUnitario: 0 }],
      notas: notasIniciales,
      anexos: anexosIniciales,
    },
  });

  const empresaId = watch("empresaId");
  const tipo = watch("tipo");
  const items = watch("items");
  const descuento = watch("descuento") ?? 0;

  const itemsArray = useFieldArray({ control, name: "items" });
  const notasArray = useFieldArray({ control, name: "notas" });
  const anexosArray = useFieldArray({
    control,
    name: "anexos" as never,
  });

  const clientesDeEmpresa = useMemo(
    () => clientes.filter((c) => c.empresaId === empresaId),
    [clientes, empresaId],
  );
  const serviciosDeEmpresa = useMemo(
    () => servicios.filter((s) => s.empresaId === empresaId),
    [servicios, empresaId],
  );
  const empresaActual = empresas.find((e) => e.id === empresaId);

  const subtotal = (items ?? []).reduce(
    (acc, item) => acc + (Number(item?.cantidad) || 0) * (Number(item?.precioUnitario) || 0),
    0,
  );
  const total = subtotal - (Number(descuento) || 0);

  function agregarDesdeServicio(servicioId: string | null) {
    const servicio = serviciosDeEmpresa.find((s) => s.id === servicioId);
    if (!servicio) return;
    itemsArray.append({
      cantidad: 1,
      descripcion: servicio.nombre,
      precioUnitario: Number(servicio.precioFijo),
    });
  }

  async function onSubmit(datos: DocumentoInput) {
    setSubmitting(true);
    try {
      if (esEdicion && documento) {
        await actualizarDocumento(documento.id, datos);
      } else {
        await crearDocumento(datos);
      }
    } catch (error) {
      // redirect() de Next.js lanza un error especial que no debemos atrapar como falla.
      if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
      toast.error(error instanceof Error ? error.message : "Ocurrió un error");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="rounded border border-line bg-card p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tipo">Tipo de documento</Label>
            <Select
              items={TIPO_LABELS}
              value={tipo}
              onValueChange={(v) =>
                setValue("tipo", v as DocumentoFormValues["tipo"])
              }
            >
              <SelectTrigger id="tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="empresaId">Empresa</Label>
            <Select
              items={Object.fromEntries(empresas.map((e) => [e.id, e.nombre]))}
              value={empresaId}
              onValueChange={(v) => {
                setValue("empresaId", v as string);
                setValue("clienteId", "");
              }}
              disabled={esEdicion || empresas.length <= 1}
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
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="clienteId">Cliente</Label>
            <ClienteCombobox
              clientes={clientesDeEmpresa}
              value={watch("clienteId")}
              onValueChange={(v) => setValue("clienteId", v)}
            />
            {errors.clienteId && (
              <p className="text-xs text-destructive">{errors.clienteId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" type="date" {...register("fecha")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vigenciaDias">Oferta válida hasta (días)</Label>
            <Input id="vigenciaDias" type="number" {...register("vigenciaDias")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="condicionesPago">Condiciones de pago</Label>
            <Input id="condicionesPago" {...register("condicionesPago")} />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <Label htmlFor="descripcionGeneral">Descripción general</Label>
          <AutosizeTextarea
            id="descripcionGeneral"
            {...register("descripcionGeneral")}
          />
        </div>
      </div>

      <div className="rounded border border-line bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Ítems
          </h2>
          <div className="flex gap-2">
            {serviciosDeEmpresa.length > 0 && (
              <Select onValueChange={agregarDesdeServicio} value="">
                <SelectTrigger size="sm" className="w-56">
                  <SelectValue placeholder="Agregar del catálogo…" />
                </SelectTrigger>
                <SelectContent>
                  {serviciosDeEmpresa.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                itemsArray.append({ cantidad: 1, descripcion: "", precioUnitario: 0 })
              }
            >
              <PlusIcon className="h-4 w-4" />
              Renglón
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="hidden grid-cols-[80px_1fr_140px_140px_36px] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
            <span>Cantidad</span>
            <span>Descripción</span>
            <span>Precio unitario</span>
            <span>Total</span>
            <span />
          </div>
          {itemsArray.fields.map((field, index) => {
            const cantidad = Number(items?.[index]?.cantidad) || 0;
            const precio = Number(items?.[index]?.precioUnitario) || 0;
            return (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-2 border-b border-line pb-3 last:border-b-0 sm:grid-cols-[80px_1fr_140px_140px_36px] sm:items-start"
              >
                <Input
                  type="number"
                  step="1"
                  min="1"
                  {...register(`items.${index}.cantidad` as const)}
                />
                <AutosizeTextarea
                  {...register(`items.${index}.descripcion` as const)}
                />
                <Input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.precioUnitario` as const)}
                />
                <div className="flex h-8 items-center font-mono text-sm">
                  {(cantidad * precio).toFixed(2)}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => itemsArray.remove(index)}
                  disabled={itemsArray.fields.length <= 1}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
        {errors.items && !Array.isArray(errors.items) && (
          <p className="mt-2 text-xs text-destructive">{errors.items.message}</p>
        )}

        <div className="mt-4 flex flex-col items-end gap-1 text-sm">
          <div className="flex w-full max-w-xs items-center justify-between gap-4 sm:w-64">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono">
              {empresaActual?.moneda} {subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex w-full max-w-xs items-center justify-between gap-4 sm:w-64">
            <Label htmlFor="descuento" className="text-muted-foreground">
              Descuento
            </Label>
            <Input
              id="descuento"
              type="number"
              step="0.01"
              className="w-32"
              {...register("descuento")}
            />
          </div>
          <div className="flex w-full max-w-xs items-center justify-between gap-4 border-t border-line pt-1 font-semibold sm:w-64">
            <span>Total</span>
            <span className="font-mono">
              {empresaActual?.moneda} {total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded border border-line bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Notas
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => notasArray.append({ titulo: "", texto: "" })}
          >
            <PlusIcon className="h-4 w-4" />
            Nota
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {notasArray.fields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Título"
                className="sm:w-48"
                {...register(`notas.${index}.titulo` as const)}
              />
              <AutosizeTextarea
                placeholder="Texto"
                {...register(`notas.${index}.texto` as const)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => notasArray.remove(index)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {tipo === "PROPUESTA" && (
        <div className="rounded border border-line bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Anexos
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => anexosArray.append("" as never)}
            >
              <PlusIcon className="h-4 w-4" />
              Anexo
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {anexosArray.fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input {...register(`anexos.${index}` as const)} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => anexosArray.remove(index)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          render={
            <Link href={documento ? `/documentos/${documento.id}` : "/documentos"} />
          }
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || submitting}>
          {esEdicion ? "Guardar cambios" : `Crear ${TIPO_LABELS[tipo]?.toLowerCase()}`}
        </Button>
      </div>
    </form>
  );
}
