"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { invitarUsuario } from "@/app/(app)/usuarios/actions";
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
  type InvitacionFormValues,
  type InvitacionInput,
  invitacionSchema,
} from "@/lib/validations/usuario";

const ROLES = { MIEMBRO: "Miembro", SUPERUSUARIO: "Superusuario" };

export function InvitarUsuarioDialog({
  empresas,
}: {
  empresas: { id: string; nombre: string }[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InvitacionFormValues, unknown, InvitacionInput>({
    resolver: zodResolver(invitacionSchema),
    defaultValues: { email: "", rol: "MIEMBRO", empresaIds: [] },
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

  async function onSubmit(datos: InvitacionInput) {
    try {
      await invitarUsuario(datos);
      toast.success(`Invitación enviada a ${datos.email}`);
      reset();
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <UserPlusIcon className="h-4 w-4" />
            Invitar usuario
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Invitar usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rol">Rol</Label>
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
            <Label>Empresas</Label>
            <div className="flex flex-col gap-2 rounded border border-line p-2">
              {empresas.map((empresa) => (
                <label
                  key={empresa.id}
                  className="flex items-center gap-2 text-sm"
                >
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
            <p className="text-xs text-muted-foreground">
              Si es superusuario, igual seleccioná las empresas a las que debería
              tener acceso.
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Enviar invitación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
