type FilaUtilidadProyecto = {
  id: string;
  clienteNombre: string;
  proyectoNombre: string;
  moneda: string;
  facturado: number;
  costos: number;
  utilidad: number;
};

// Fase 3.4 — cada fila es un solo proyecto, siempre con una única moneda
// (la de la empresa de su cliente): a diferencia de otras zonas del panel,
// acá nunca hay riesgo de mezclar GTQ/USD porque no se suman filas entre sí,
// cada una se lee de forma independiente.
export function UtilidadProyectoTable({ data }: { data: FilaUtilidadProyecto[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ningún proyecto coincide con estos filtros todavía.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-2">Cliente</th>
            <th className="py-2 pr-2">Proyecto</th>
            <th className="py-2 pr-2 text-right">Facturado</th>
            <th className="py-2 pr-2 text-right">Costos</th>
            <th className="py-2 pr-2 text-right">Utilidad</th>
          </tr>
        </thead>
        <tbody>
          {data.map((fila) => (
            <tr key={fila.id} className="border-b border-border last:border-b-0">
              <td className="py-2 pr-2">{fila.clienteNombre}</td>
              <td className="py-2 pr-2">{fila.proyectoNombre}</td>
              <td className="py-2 pr-2 text-right font-mono text-brand dark:text-brand-hover">
                {fila.moneda} {fila.facturado.toFixed(2)}
              </td>
              <td className="py-2 pr-2 text-right font-mono text-status-enviada">
                {fila.moneda} {fila.costos.toFixed(2)}
              </td>
              <td
                className={`py-2 pr-2 text-right font-mono font-semibold ${
                  fila.utilidad < 0 ? "text-danger" : "text-success"
                }`}
              >
                {fila.moneda} {fila.utilidad.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
