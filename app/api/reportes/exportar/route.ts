import { NextRequest } from "next/server";
import { getEmpresasPermitidas } from "@/lib/auth";
import { construirExcel } from "@/lib/exportar-excel";
import { rangoFechaPorDefecto } from "@/lib/rango-fecha";
import { obtenerDetalleReporte } from "@/lib/reportes/detalle";

// Excel/CSV pedido en docs/fase3-clientes-proyectos-costos-activos.md
// ("Módulo de Reportes"): una tabla plana de los datos del período —
// documentos y costos mezclados en las mismas filas, columnas fecha/
// cliente/proyecto/tipo/monto — para que el contador la manipule
// directamente en Excel, no un archivo distinto por sección del reporte.
export async function GET(request: NextRequest) {
  let empresasPermitidas: string[];
  try {
    empresasPermitidas = await getEmpresasPermitidas();
  } catch {
    return new Response("No autenticado", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const desdeStr = searchParams.get("desde") ?? undefined;
  const hastaStr = searchParams.get("hasta") ?? undefined;
  const empresaId = searchParams.get("empresaId");
  const clienteId = searchParams.get("clienteId") ?? undefined;
  const proyectoId = searchParams.get("proyectoId") ?? undefined;
  const { desde, hasta } = rangoFechaPorDefecto(desdeStr, hastaStr);

  const empresaIds =
    empresaId && empresasPermitidas.includes(empresaId) ? [empresaId] : empresasPermitidas;

  const { documentos, costos } = await obtenerDetalleReporte({
    empresaIds,
    desde,
    hasta,
    clienteId,
    proyectoId,
  });

  type Fila = {
    fecha: Date;
    cliente: string;
    proyecto: string;
    tipo: string;
    moneda: string;
    monto: number;
  };

  const filas: Fila[] = [
    ...documentos.map((d) => ({
      fecha: d.fecha,
      cliente: d.clienteNombre,
      proyecto: d.proyectoNombre ?? "",
      tipo: d.tipoLabel,
      moneda: d.moneda,
      monto: d.total,
    })),
    ...costos.map((c) => ({
      fecha: c.fecha,
      cliente: c.clienteNombre ?? "",
      proyecto: c.proyectoNombre ?? "",
      tipo: `Costo · ${c.categoriaLabel}`,
      moneda: c.moneda,
      monto: -c.monto, // negativo: distingue de un vistazo lo facturado de lo gastado
    })),
  ].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  const buffer = await construirExcel({
    hoja: "Reporte",
    columnas: [
      { header: "Fecha", key: "fecha", valor: (f) => f.fecha.toISOString().slice(0, 10) },
      { header: "Cliente", key: "cliente", valor: (f) => f.cliente },
      { header: "Proyecto", key: "proyecto", valor: (f) => f.proyecto },
      { header: "Tipo", key: "tipo", valor: (f) => f.tipo },
      { header: "Moneda", key: "moneda", valor: (f) => f.moneda },
      { header: "Monto", key: "monto", tipo: "moneda", valor: (f) => f.monto },
    ],
    filas,
  });

  const nombreArchivo = `reporte_${desdeStr ?? "mes-actual"}_a_${hastaStr ?? "hoy"}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
