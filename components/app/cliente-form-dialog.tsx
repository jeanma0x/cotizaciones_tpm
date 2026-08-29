"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { actualizarCliente, crearCliente } from "@/app/(app)/clientes/actions";
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
  type ClienteFormValues,
  type ClienteInput,
  clienteSchema,
} from "@/lib/validations/cliente";

type Empresa = { id: string; nombre: string };

type Cliente = {
  id: string;
  empresaId: string;
  tipo: "INDIVIDUAL" | "EMPRESA";
  nombre: string;
  nit: string | null;
  direccion: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  codigoPais: string | null;
  activo: boolean;
  contactos: { id: string; nombre: string; email: string }[];
};

const TIPO_LABELS = { INDIVIDUAL: "Individual", EMPRESA: "Empresa" } as const;

export function ClienteFormDialog({
  empresas,
  cliente,
  trigger,
  empresaActivaId = null,
}: {
  empresas: Empresa[];
  cliente?: Cliente;
  trigger: React.ReactNode;
  // Fase 3.2 — selector de empresa global. Solo relevante al crear.
  empresaActivaId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const esEdicion = Boolean(cliente);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ClienteFormValues, unknown, ClienteInput>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      empresaId: cliente?.empresaId ?? empresaActivaId ?? empresas[0]?.id ?? "",
      tipo: cliente?.tipo ?? "INDIVIDUAL",
      nombre: cliente?.nombre ?? "",
      nit: cliente?.nit ?? "",
      direccion: cliente?.direccion ?? "",
      contacto: cliente?.contacto ?? "",
      telefono: cliente?.telefono ?? "",
      email: cliente?.email ?? "",
      codigoPais: cliente?.codigoPais ?? "",
      activo: cliente?.activo ?? true,
      contactos: cliente?.contactos ?? [],
    },
  });

  const tipo = watch("tipo");
  const contactosArray = useFieldArray({ control, name: "contactos" });

  async function onSubmit(datos: ClienteInput) {
    try {
      if (esEdicion && cliente) {
        await actualizarCliente(cliente.id, datos);
        toast.success("Cliente actualizado");
      } else {
        await crearCliente(datos);
        toast.success("Cliente creado");
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
          <DialogTitle>{esEdicion ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
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
            <Label htmlFor="tipo">Tipo de cliente</Label>
            {/* Individual: un solo correo/contacto (el flujo de siempre).
                Empresa: clientes corporativos como CMI, donde cada mes la
                cotización va a un destinatario distinto bajo el mismo NIT —
                ver sección de contactos más abajo. Pedido de Oldemar,
                reunión 14/08. */}
            <div className="pill-group" role="radiogroup" aria-label="Tipo de cliente" id="tipo">
              {Object.entries(TIPO_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={tipo === value}
                  data-active={tipo === value}
                  className="pill"
                  onClick={() => setValue("tipo", value as ClienteFormValues["tipo"])}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...register("nombre")} />
            {errors.nombre && (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nit">NIT</Label>
            <Input id="nit" {...register("nit")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" {...register("direccion")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contacto">Contacto</Label>
            <Input id="contacto" {...register("contacto")} />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" {...register("telefono")} />
            </div>
            <div className="flex w-36 flex-col gap-1.5">
              <Label htmlFor="codigoPais">Cód. país</Label>
              <Input id="codigoPais" placeholder="usa el de la empresa" {...register("codigoPais")} />
              {errors.codigoPais && (
                <p className="text-xs text-destructive">{errors.codigoPais.message}</p>
              )}
            </div>
          </div>
          <p className="-mt-1.5 text-xs text-muted-foreground">
            Dejalo vacío para usar el código de país de la empresa — solo llenalo si el
            WhatsApp real de este cliente es de otro país (sin &quot;+&quot;, ej. 502).
          </p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {tipo === "EMPRESA" && (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Contactos (destinatarios)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => contactosArray.append({ nombre: "", email: "" })}
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Agregar
                </Button>
              </div>
              {contactosArray.fields.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Sin contactos todavía — se usará el correo genérico de arriba.
                </p>
              )}
              {contactosArray.fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <Input
                    placeholder="Nombre"
                    className="flex-1"
                    {...register(`contactos.${index}.nombre` as const)}
                  />
                  <Input
                    placeholder="Correo"
                    type="email"
                    className="flex-1"
                    {...register(`contactos.${index}.email` as const)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Quitar contacto"
                    onClick={() => contactosArray.remove(index)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {errors.contactos && (
                <p className="text-xs text-destructive">
                  Revisá el nombre y correo de cada contacto.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              <CheckIcon className="h-4 w-4" />
              {esEdicion ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
