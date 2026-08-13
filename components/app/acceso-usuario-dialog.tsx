"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { actualizarAccesoUsuario } from "@/app/(app)/usuarios/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type AccesoUsuarioFormValues,
  type AccesoUsuarioInput,
  accesoUsuarioSchema,
} from "@/lib/validations/usuario";

const ROLES = { MIEMBRO: "Miembro", SUPERUSUARIO: "Superusuario" };

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  empresas: { empresaId: string }[];
};

export function AccesoUsuarioDialog({
  usuario,
  empresas,
  trigger,
}: {
  usuario: Usuario;
  empresas: { id: string; nombre: string }[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<AccesoUsuarioFormValues, unknown, AccesoUsuarioInput>({
    resolver: zodResolver(accesoUsuarioSchema),
    defaultValues: {
      rol: usuario.rol === "SUPERUSUARIO" ? "SUPERUSUARIO" : "MIEMBRO",
      empresaIds: usuario.empresas.map((e) => e.empresaId),
    },
  });

  const rol = watch("rol");
  const empresaIds = watch("empresaIds");

  function alternarEmpresa(id: string, checked: boolean) {
    const actuales = empresaIds ?? [];
    setValue(
      "empresaIds",
      checked ? [...actuales, id] : actuales.filter((e) => e !== id),
    );
  }

  async function onSubmit(datos: AccesoUsuarioInput) {
    try {
      await actualizarAccesoUsuario(usuario.id, datos);
      toast.success("Acceso actualizado");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Acceso de {usuario.nombre}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="rol">
              Rol
            </label>
            <Select
              items={ROLES}
              value={rol}
              onValueChange={(v) => setValue("rol", v as "SUPERUSUARIO" | "MIEMBRO")}
            >
              <SelectTrigger id="rol" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MIEMBRO">Miembro</SelectItem>
                <SelectItem value="SUPERUSUARIO">Superusuario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Empresas</span>
            <div className="flex flex-col gap-2 rounded border border-border p-2">
              {empresas.map((empresa) => (
                <label key={empresa.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={(empresaIds ?? []).includes(empresa.id)}
                    onCheckedChange={(checked) =>
                      alternarEmpresa(empresa.id, checked === true)
                    }
                  />
                  {empresa.nombre}
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              <CheckIcon className="h-4 w-4" />
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
