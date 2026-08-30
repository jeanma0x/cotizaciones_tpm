"use client";

// Par de <input type="date"> Desde/Hasta en línea (barra de filtros) — antes
// duplicado a mano en costos-filtros.tsx, ahora reusado ahí y en los 4
// filtros de reporte nuevos. Puramente controlado: no decide cómo se
// persiste el valor (query string, estado local, etc.), eso queda en quien
// lo usa — solo estandariza el input y el min/max cruzado entre ambos
// campos (no dejar elegir un "hasta" anterior al "desde" y viceversa).
//
// No reemplaza el layout vertical de exportar-costos-dialog.tsx (etiquetas
// visibles "Desde"/"Hasta" apiladas dentro de un diálogo) — es un contexto
// visual distinto, forzar el mismo componente ahí no valía la complejidad.
export function RangoFechaInput({
  desde,
  hasta,
  onDesdeChange,
  onHastaChange,
  idPrefix,
}: {
  desde: string;
  hasta: string;
  onDesdeChange: (valor: string) => void;
  onHastaChange: (valor: string) => void;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        id={`${idPrefix}-desde`}
        type="date"
        aria-label="Desde"
        value={desde}
        max={hasta || undefined}
        onChange={(e) => onDesdeChange(e.target.value)}
        className="h-8 cursor-pointer rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <span className="text-sm text-muted-foreground">a</span>
      <input
        id={`${idPrefix}-hasta`}
        type="date"
        aria-label="Hasta"
        value={hasta}
        min={desde || undefined}
        onChange={(e) => onHastaChange(e.target.value)}
        className="h-8 cursor-pointer rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  );
}
