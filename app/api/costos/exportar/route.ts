import { NextRequest } from "next/server";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATEGORIA_COSTO_LABELS } from "@/lib/validations/costo";

// Ver comentario equivalente en app/api/documentos/exportar/route.ts — mismo
// formato RFC 4180 para que abra bien tanto en Excel como en Google Sheets.
function celda(valor: string | number) {
  const texto = String(valor);
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

export async function GET(request: NextRequest) {
  let empresasPermitidas: string[];
  try {
    empresasPermitidas = await getEmpresasPermitidas();
  } catch {
    return new Response("No autenticado", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const desdeStr = searchParams.get("desde");
  const hastaStr = searchParams.get("hasta");
  const empresaId = searchParams.get("empresaId");
  if (!desdeStr || !hastaStr) {
    return new Response("Faltan los parámetros 'desde' y 'hasta' (YYYY-MM-DD)", {
      status: 400,
    });
  }

  const desde = new Date(`${desdeStr}T00:00:00.000Z`);
  const hasta = new Date(`${hastaStr}T23:59:59.999Z`);
  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime()) || desde > hasta) {
    return new Response("Rango de fechas inválido", { status: 400 });
  }

  const costos = await db.costoOperativo.findMany({
    where: {
      empresaId:
        empresaId && empresasPermitidas.includes(empresaId)
          ? empresaId
          : { in: empresasPermitidas },
      fechaGasto: { gte: desde, lte: hasta },
    },
    include: { empresa: true },
    orderBy: [{ empresa: { nombre: "asc" } }, { fechaGasto: "asc" }],
  });

  const encabezado = ["Fecha", "Categoría", "Descripción", "Empresa", "Moneda", "Monto"];
  const filas = costos.map((c) =>
    [
      c.fechaGasto.toISOString().slice(0, 10),
      CATEGORIA_COSTO_LABELS[c.categoria],
      c.descripcion,
      c.empresa.nombre,
      c.empresa.moneda,
      Number(c.monto).toFixed(2),
    ]
      .map(celda)
      .join(","),
  );

  const csv = [encabezado.map(celda).join(","), ...filas].join("\r\n");
  const cuerpo = "﻿" + csv;

  return new Response(cuerpo, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="costos_${desdeStr}_a_${hastaStr}.csv"`,
    },
  });
}
