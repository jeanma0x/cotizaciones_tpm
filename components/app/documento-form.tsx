"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import autoAnimate from "@formkit/auto-animate";
import {
  Building2Icon,
  CalendarIcon,
  CheckIcon,
  ListChecksIcon,
  PaperclipIcon,
  PenLineIcon,
  PlusIcon,
  StickyNoteIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  actualizarDocumento,
  crearDocumento,
} from "@/app/(app)/documentos/actions";
import Link from "next/link";
import { AutosizeTextarea } from "@/components/app/autosize-textarea";
import { ClienteCombobox } from "@/components/app/cliente-combobox";
import { FormSection } from "@/components/app/form-section";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
type Cliente = {
  id: string;
  empresaId: string;
  nombre: string;
  contacto: string | null;
  contactos: { id: string; nombre: string }[];
};
type Servicio = {
  id: string;
  empresaId: string;
  nombre: string;
  precioFijo: unknown;
};
// Solo usuarios que ya tienen una firma cargada llegan a esta lista (ver
// fetch en app/(app)/documentos/nuevo/page.tsx y .../[id]/editar/page.tsx) —
// nada que filtrar acá por "tiene firma o no".
type UsuarioFirmante = { id: string; nombre: string; empresaIds: string[] };

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
  firmanteUsuarioId: string | null;
  nombreResponsable: string | null;
  fechaAceptacion: Date | null;
};

function aFechaInput(fecha: Date) {
  return fecha.toISOString().slice(0, 10);
}

export function DocumentoForm({
  empresas,
  clientes,
  servicios,
  usuarios,
  documento,
  empresaActivaId = null,
}: {
  empresas: Empresa[];
  clientes: Cliente[];
  servicios: Servicio[];
  usuarios: UsuarioFirmante[];
  documento?: DocumentoExistente;
  // Fase 3.2 — selector de empresa global. Solo relevante al CREAR: si el
  // usuario ya tiene una empresa activa elegida, el campo se precarga con
  // ella y se bloquea (se cambia desde el selector global, no acá). Al
  // editar, `documento?.empresaId` siempre gana — la empresa de un
  // documento existente nunca cambia (ver actions.ts).
  empresaActivaId?: string | null;
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
      empresaId: documento?.empresaId ?? empresaActivaId ?? empresas[0]?.id ?? "",
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
      firmanteUsuarioId: documento?.firmanteUsuarioId ?? "",
      nombreResponsable: documento?.nombreResponsable ?? "",
      fechaAceptacion: documento?.fechaAceptacion
        ? aFechaInput(documento.fechaAceptacion)
        : "",
    },
  });

  const empresaId = watch("empresaId");
  const tipo = watch("tipo");
  const items = watch("items");
  const descuento = watch("descuento") ?? 0;
  const firmanteUsuarioId = watch("firmanteUsuarioId");
  const clienteId = watch("clienteId");

  const itemsArray = useFieldArray({ control, name: "items" });
  const notasArray = useFieldArray({ control, name: "notas" });
  const anexosArray = useFieldArray({
    control,
    name: "anexos" as never,
  });

  // Transición visible al agregar/quitar renglones, notas y anexos — ver
  // design-system.md "Movimiento e interacción" (@formkit/auto-animate).
  const itemsListRef = useRef<HTMLDivElement>(null);
  const notasListRef = useRef<HTMLDivElement>(null);
  const anexosListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (itemsListRef.current) autoAnimate(itemsListRef.current);
    if (notasListRef.current) autoAnimate(notasListRef.current);
    if (anexosListRef.current) autoAnimate(anexosListRef.current);
  }, []);

  const clientesDeEmpresa = useMemo(
    () => clientes.filter((c) => c.empresaId === empresaId),
    [clientes, empresaId],
  );
  const serviciosDeEmpresa = useMemo(
    () => servicios.filter((s) => s.empresaId === empresaId),
    [servicios, empresaId],
  );
  const usuariosDeEmpresa = useMemo(
    () => usuarios.filter((u) => u.empresaIds.includes(empresaId)),
    [usuarios, empresaId],
  );
  const empresaActual = empresas.find((e) => e.id === empresaId);
  const clienteActual = clientesDeEmpresa.find((c) => c.id === clienteId);
  // Nombres ya conocidos de ESTE cliente, para elegir rápido quién acepta el
  // documento — el contacto suelto (clientes tipo Individual) y/o la lista
  // de contactos (tipo Empresa, ver ContactoCliente). "Nombre de
  // responsable" nunca tiene por qué coincidir con quién firma del lado de
  // TPM: son personas distintas (quien firma = nuestro lado, responsable =
  // quien acepta del lado del cliente), por eso esta lista es independiente
  // de usuariosDeEmpresa/elegirFirmante.
  const contactosDelCliente = useMemo(() => {
    if (!clienteActual) return [];
    const nombres = [
      clienteActual.contacto,
      ...clienteActual.contactos.map((c) => c.nombre),
    ].filter((n): n is string => Boolean(n?.trim()));
    return Array.from(new Set(nombres));
  }, [clienteActual]);

  function elegirFirmante(usuarioId: string | null) {
    setValue("firmanteUsuarioId", usuarioId ?? "");
  }

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
      <FormSection title="Cliente y empresa" icon={Building2Icon}>
        <div className="mb-4 flex flex-col gap-1.5">
          <Label htmlFor="tipo">Tipo de documento</Label>
          <div className="pill-group" role="radiogroup" aria-label="Tipo de documento" id="tipo">
            {Object.entries(TIPO_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={tipo === value}
                data-active={tipo === value}
                className="pill"
                onClick={() => setValue("tipo", value as DocumentoFormValues["tipo"])}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="empresaId">Empresa</Label>
            <Select
              items={Object.fromEntries(empresas.map((e) => [e.id, e.nombre]))}
              value={empresaId}
              onValueChange={(v) => {
                setValue("empresaId", v as string);
                setValue("clienteId", "");
              }}
              disabled={esEdicion || empresas.length <= 1 || Boolean(empresaActivaId)}
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
        </div>
      </FormSection>

      <FormSection title="Detalles de la oferta" icon={CalendarIcon}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </FormSection>

      <FormSection
        title="Ítems"
        icon={ListChecksIcon}
        actions={
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
        }
      >
        <div ref={itemsListRef} className="flex flex-col gap-3">
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
                className="grid grid-cols-1 gap-2 border-b border-border pb-3 last:border-b-0 sm:grid-cols-[80px_1fr_140px_140px_36px] sm:items-start"
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
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Quitar renglón"
                        onClick={() => itemsArray.remove(index)}
                        disabled={itemsArray.fields.length <= 1}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <TooltipContent>Quitar renglón</TooltipContent>
                </Tooltip>
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
          <div className="flex w-full max-w-xs items-center justify-between gap-4 border-t border-border pt-1 font-semibold sm:w-64">
            <span>Total</span>
            <span className="font-mono">
              {empresaActual?.moneda} {total.toFixed(2)}
            </span>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Notas"
        icon={StickyNoteIcon}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => notasArray.append({ titulo: "", texto: "" })}
          >
            <PlusIcon className="h-4 w-4" />
            Nota
          </Button>
        }
      >
        <div ref={notasListRef} className="flex flex-col gap-3">
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
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Quitar nota"
                      onClick={() => notasArray.remove(index)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  }
                />
                <TooltipContent>Quitar nota</TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      </FormSection>

      {tipo === "PROPUESTA" && (
        <FormSection
          title="Anexos"
          icon={PaperclipIcon}
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => anexosArray.append("" as never)}
            >
              <PlusIcon className="h-4 w-4" />
              Anexo
            </Button>
          }
        >
          <div ref={anexosListRef} className="flex flex-col gap-2">
            {anexosArray.fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input {...register(`anexos.${index}` as const)} />
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Quitar anexo"
                        onClick={() => anexosArray.remove(index)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <TooltipContent>Quitar anexo</TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        </FormSection>
      )}

      <FormSection title="Firma" icon={PenLineIcon}>
        <p className="mb-4 text-sm text-muted-foreground">
          Elegí quién firma este documento para que el PDF ya salga con esa
          firma insertada, o dejalo en blanco para imprimir y firmar a mano
          como siempre.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firmanteUsuarioId">Quién firma</Label>
            <Select
              items={{
                ninguno: "Sin firma (firmar a mano)",
                ...Object.fromEntries(usuariosDeEmpresa.map((u) => [u.id, u.nombre])),
              }}
              value={firmanteUsuarioId || "ninguno"}
              onValueChange={(v) => elegirFirmante(v === "ninguno" ? null : (v as string))}
            >
              <SelectTrigger id="firmanteUsuarioId" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguno">Sin firma (firmar a mano)</SelectItem>
                {usuariosDeEmpresa.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {usuariosDeEmpresa.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nadie con acceso a esta empresa tiene una firma cargada
                todavía — se puede subir desde Usuarios.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombreResponsable">Nombre de responsable</Label>
            <div className="flex gap-2">
              <Input
                id="nombreResponsable"
                className="flex-1"
                {...register("nombreResponsable")}
              />
              {contactosDelCliente.length > 0 && (
                <Select
                  items={Object.fromEntries(contactosDelCliente.map((n) => [n, n]))}
                  value=""
                  onValueChange={(v) => v && setValue("nombreResponsable", v as string)}
                >
                  <SelectTrigger className="w-44 shrink-0">
                    <PlusIcon className="h-3.5 w-3.5" />
                    <SelectValue placeholder="Contacto del cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactosDelCliente.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fechaAceptacion">Fecha de aceptación</Label>
            <Input id="fechaAceptacion" type="date" {...register("fechaAceptacion")} />
          </div>
        </div>
      </FormSection>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={
            <Link href={documento ? `/documentos/${documento.id}` : "/documentos"} />
          }
        >
          <XIcon className="h-4 w-4" />
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || submitting}>
          <CheckIcon className="h-4 w-4" />
          {esEdicion ? "Guardar cambios" : `Crear ${TIPO_LABELS[tipo]?.toLowerCase()}`}
        </Button>
      </div>
    </form>
  );
}
