"use client";

import { FolderKanbanIcon, PencilIcon, PlusIcon, PowerIcon, PowerOffIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  actualizarProyecto,
  alternarActivoProyecto,
  crearProyecto,
} from "@/app/(app)/clientes/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type FilaProyecto = { id: string; nombre: string; activo: boolean };

// Fase 3.3 — catálogo de Proyectos por cliente. Vive como acción por fila en
// Clientes (no un módulo de nivel superior propio): un proyecto siempre
// pertenece a un solo cliente y en la práctica va a haber pocos por cliente,
// igual que Contactos ya se maneja inline en ClienteFormDialog.
export function ProyectosClienteSheet({
  clienteId,
  clienteNombre,
  proyectos,
}: {
  clienteId: string;
  clienteNombre: string;
  proyectos: FilaProyecto[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");

  function agregar() {
    const nombre = nombreNuevo.trim();
    if (!nombre) return;
    startTransition(async () => {
      try {
        await crearProyecto({ clienteId, nombre, activo: true });
        setNombreNuevo("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocurrió un error");
      }
    });
  }

  function guardarNombre(proyecto: FilaProyecto) {
    const nombre = nombreEditado.trim();
    if (!nombre) return;
    startTransition(async () => {
      try {
        await actualizarProyecto(proyecto.id, { clienteId, nombre, activo: proyecto.activo });
        setEditandoId(null);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocurrió un error");
      }
    });
  }

  function alternar(id: string) {
    startTransition(async () => {
      try {
        await alternarActivoProyecto(id);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocurrió un error");
      }
    });
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm">
            <FolderKanbanIcon className="h-4 w-4" />
            Proyectos
            {proyectos.length > 0 && (
              <Badge variant="outline" className="ml-1">
                {proyectos.length}
              </Badge>
            )}
          </Button>
        }
      />
      <SheetContent className="flex flex-col gap-4 overflow-y-auto p-4">
        <SheetHeader className="p-0">
          <SheetTitle>Proyectos de {clienteNombre}</SheetTitle>
        </SheetHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Nombre del proyecto nuevo"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregar()}
          />
          <Button type="button" onClick={agregar} disabled={isPending || !nombreNuevo.trim()}>
            <PlusIcon className="h-4 w-4" />
            Agregar
          </Button>
        </div>

        {proyectos.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Este cliente todavía no tiene proyectos — se pueden asociar a Costos y a
            Documentos una vez creados acá.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {proyectos.map((proyecto) => (
            <div
              key={proyecto.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5"
            >
              {editandoId === proyecto.id ? (
                <Input
                  autoFocus
                  value={nombreEditado}
                  onChange={(e) => setNombreEditado(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && guardarNombre(proyecto)}
                  className="h-8"
                />
              ) : (
                <span className="min-w-0 flex-1 truncate font-medium">{proyecto.nombre}</span>
              )}

              <div className="flex shrink-0 items-center gap-1.5">
                <Badge variant={proyecto.activo ? "default" : "outline"}>
                  {proyecto.activo ? "Activo" : "Inactivo"}
                </Badge>
                {editandoId === proyecto.id ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      onClick={() => guardarNombre(proyecto)}
                      aria-label="Guardar nombre"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditandoId(null)}
                      aria-label="Cancelar edición"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setEditandoId(proyecto.id);
                      setNombreEditado(proyecto.nombre);
                    }}
                    aria-label="Renombrar proyecto"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => alternar(proyecto.id)}
                  aria-label={proyecto.activo ? "Desactivar proyecto" : "Activar proyecto"}
                >
                  {proyecto.activo ? (
                    <PowerOffIcon className="h-3.5 w-3.5 text-danger" />
                  ) : (
                    <PowerIcon className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
