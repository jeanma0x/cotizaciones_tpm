"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
  nombre: string;
  nit: string | null;
  direccion: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  activo: boolean;
};

export function ClienteFormDialog({
  empresas,
  cliente,
  trigger,
}: {
  empresas: Empresa[];
  cliente?: Cliente;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const esEdicion = Boolean(cliente);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ClienteFormValues, unknown, ClienteInput>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      empresaId: cliente?.empresaId ?? empresas[0]?.id ?? "",
      nombre: cliente?.nombre ?? "",
      nit: cliente?.nit ?? "",
      direccion: cliente?.direccion ?? "",
      contacto: cliente?.contacto ?? "",
      telefono: cliente?.telefono ?? "",
      email: cliente?.email ?? "",
      activo: cliente?.activo ?? true,
    },
  });

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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" {...register("telefono")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {esEdicion ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
