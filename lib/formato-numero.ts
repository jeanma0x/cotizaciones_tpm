// Compartido por las gráficas del panel — un valor grande en el eje o en una
// etiqueta de barra ("1500.00") se lee peor que su forma compacta ("1.5k").
// Antes vivía duplicado dentro de tendencia-mensual-chart.tsx; movido acá
// para reusarlo también en costos-categoria-chart.tsx (montos) sin copiar la
// función.
export function formatearCompacto(valor: number) {
  if (valor === 0) return "0";
  if (Math.abs(valor) >= 1000) {
    return `${(valor / 1000).toFixed(valor % 1000 === 0 ? 0 : 1)}k`;
  }
  return String(valor);
}

// Separador de miles + 2 decimales fijos (ej. 1234567.89 → "1,234,567.89") —
// pedido explícito de Oldemar para que cualquier monto en el sistema se lea
// como cifra de dinero, no como número crudo. Antes solo vivía en
// documento-imprimible.tsx (el PDF exportado); movido acá para aplicarlo
// también en las tablas/formularios que antes usaban toFixed(2) sin separador.
export function formatearMonto(valor: number) {
  return valor.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
