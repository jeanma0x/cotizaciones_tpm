"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { actualizarEmpresa } from "@/app/(app)/empresas/actions";
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
import { type EmpresaInput, empresaSchema } from "@/lib/validations/empresa";

type Empresa = {
  id: string;
  nombre: string;
  nit: string | null;
  direccion: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  moneda: string;
};

export function EmpresaFormDialog({
  empresa,
  trigger,
}: {
  empresa: Empresa;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmpresaInput>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nombre: empresa.nombre,
      nit: empresa.nit ?? "",
      direccion: empresa.direccion ?? "",
      contacto: empresa.contacto ?? "",
      telefono: empresa.telefono ?? "",
      email: empresa.email ?? "",
      moneda: empresa.moneda === "USD" ? "USD" : "GTQ",
    },
  });

  async function onSubmit(datos: EmpresaInput) {
    try {
      await actualizarEmpresa(empresa.id, datos);
      toast.success("Empresa actualizada");
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
          <DialogTitle>Editar empresa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
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
            <Label htmlFor="contacto">Contacto de servicio</Label>
            <Input id="contacto" {...register("contacto")} />
            <p className="text-xs text-muted-foreground">
              Persona de contacto de esta empresa — aparece en el documento exportado
              junto al correlativo.
            </p>
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="moneda">Moneda</Label>
            <Select
              items={{ GTQ: "GTQ — Quetzales", USD: "USD — Dólares" }}
              value={watch("moneda")}
              onValueChange={(v) => setValue("moneda", v as "GTQ" | "USD")}
            >
              <SelectTrigger id="moneda" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GTQ">GTQ — Quetzales</SelectItem>
                <SelectItem value="USD">USD — Dólares</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
