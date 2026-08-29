import { Skeleton } from "@/components/ui/skeleton";

// Reusado por los loading.tsx de cada ruta principal (panel, documentos,
// clientes, costos, servicios, activos) — un solo skeleton genérico en vez
// de uno distinto por módulo, porque las 5 pantallas comparten exactamente
// el mismo layout (PageHeader + buscador + tabla). El shape imita ese
// layout real para que el salto de skeleton→contenido no cambie de tamaño.
export function TablaSkeleton({ filas = 6 }: { filas?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-6 py-5 shadow-sm">
        <div className="flex items-center gap-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-56" />
          </div>
        </div>
        <Skeleton className="h-8 w-28 shrink-0 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-full max-w-sm rounded-lg" />
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-4 border-b border-border px-4 py-3">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="ml-auto h-3.5 w-16" />
        </div>
        {Array.from({ length: filas }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="ml-auto h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
