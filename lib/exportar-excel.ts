import ExcelJS from "exceljs";

export type ColumnaExcel<T> = {
  header: string;
  key: string;
  // "moneda" aplica formato de 2 decimales + separador de miles; "entero"
  // sin decimales; "texto" sin formato numérico. Default: "texto".
  tipo?: "moneda" | "entero" | "texto";
  valor: (fila: T) => string | number;
};

// Helper compartido por las 4 rutas de exportar de Reportes — arma un
// workbook de una sola hoja a partir de filas + definición de columnas.
// Pedido explícito del usuario: Excel real (con formato), no CSV plano
// como los exportadores que ya existen en Documentos/Costos.
export async function construirExcel<T>({
  hoja,
  columnas,
  filas,
}: {
  hoja: string;
  columnas: ColumnaExcel<T>[];
  filas: T[];
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Servicios Generales TPM";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(hoja, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = columnas.map((c) => ({
    header: c.header,
    key: c.key,
    // Ancho inicial por el texto del encabezado — se ajusta abajo al
    // contenido real más largo de cada columna.
    width: Math.max(c.header.length + 2, 10),
  }));

  const encabezado = sheet.getRow(1);
  encabezado.font = { bold: true, color: { argb: "FFFFFFFF" } };
  encabezado.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" }, // navy-900, mismo tono de marca del sistema
  };
  encabezado.alignment = { vertical: "middle" };

  for (const fila of filas) {
    const valores: Record<string, string | number> = {};
    for (const c of columnas) valores[c.key] = c.valor(fila);
    sheet.addRow(valores);
  }

  columnas.forEach((c, i) => {
    const columna = sheet.getColumn(i + 1);
    if (c.tipo === "moneda") {
      columna.numFmt = "#,##0.00";
    } else if (c.tipo === "entero") {
      columna.numFmt = "#,##0";
    }
    // Ancho ajustado al contenido más largo (encabezado incluido), con un
    // tope razonable para que una descripción larga no vuelva la columna
    // absurda — mismo criterio de "nunca truncar" del resto del sistema,
    // pero acotado acá porque Excel sí necesita un ancho fijo por columna.
    const masLargo = Math.max(
      c.header.length,
      ...filas.map((f) => String(c.valor(f)).length),
    );
    columna.width = Math.min(Math.max(masLargo + 2, 10), 60);
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
