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
