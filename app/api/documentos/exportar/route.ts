import { NextRequest } from "next/server";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";

const TIPO_LABELS: Record<string, string> = {
  COTIZACION: "Cotización",
  PROPUESTA: "Propuesta de servicios",
  FACTURA: "Factura",
};

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  EN_NEGOCIACION: "En negociación",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
  VENCIDA: "Vencida",
  FACTURADA: "Facturada",
};

// Regla de un solo campo separador para todo el CSV: si el valor trae coma,
// comilla o salto de línea, se envuelve entre comillas dobles (duplicando las
// comillas internas) — formato estándar RFC 4180, lo que abre bien tanto
// Excel como Google Sheets.
function celda(valor: string | number) {
  const texto = String(valor);
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

export async function GET(request: NextRequest) {
  // Punto 3, ronda de cierre de huecos: Oldemar/su contador necesitan poder
  // sacar el mes para conciliar contra Digifact. Nunca cruza empresas fuera
  // de las permitidas para quien pide la descarga (ver docs/security.md).
  let empresasPermitidas: string[];
  try {
    empresasPermitidas = await getEmpresasPermitidas();
  } catch {
    return new Response("No autenticado", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const desdeStr = searchParams.get("desde");
  const hastaStr = searchParams.get("hasta");
  if (!desdeStr || !hastaStr) {
    return new Response("Faltan los parámetros 'desde' y 'hasta' (YYYY-MM-DD)", {
      status: 400,
    });
  }

  const desde = new Date(`${desdeStr}T00:00:00.000Z`);
  // Fin de día inclusive: si "hasta" es 2026-08-31, cubre hasta las 23:59:59
  // de ese día, no lo excluye por comparar contra medianoche.
  const hasta = new Date(`${hastaStr}T23:59:59.999Z`);
  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime()) || desde > hasta) {
    return new Response("Rango de fechas inválido", { status: 400 });
  }

  const documentos = await db.documento.findMany({
    where: {
      empresaId: { in: empresasPermitidas },
      fecha: { gte: desde, lte: hasta },
      // Mismo criterio que el export de Costos: un documento anulado (ver
      // comentario en schema.prisma) no debería colarse en un export
      // contable, que existe justo para conciliar contra Digifact.
      anulado: false,
    },
    include: { empresa: true, cliente: true },
    orderBy: [{ empresa: { nombre: "asc" } }, { fecha: "asc" }, { correlativo: "asc" }],
  });

  const encabezado = [
    "Correlativo",
    "Tipo",
    "Empresa",
    "Cliente",
    "Fecha",
    "Moneda",
    "Total",
    "Estado",
  ];
  const filas = documentos.map((doc) =>
    [
      `TPM-${doc.correlativo}`,
      TIPO_LABELS[doc.tipo] ?? doc.tipo,
      doc.empresa.nombre,
      doc.cliente?.nombre ?? "—",
      doc.fecha.toISOString().slice(0, 10),
      doc.empresa.moneda,
      Number(doc.total).toFixed(2),
      ESTADO_LABELS[doc.estado] ?? doc.estado,
    ]
      .map(celda)
      .join(","),
  );

  const csv = [encabezado.map(celda).join(","), ...filas].join("\r\n");
  // BOM UTF-8: sin esto, Excel en Windows interpreta el archivo como
  // Latin-1 y rompe los acentos/ñ de nombres de cliente y empresa.
  const cuerpo = "﻿" + csv;

  return new Response(cuerpo, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="documentos_${desdeStr}_a_${hastaStr}.csv"`,
    },
  });
}
