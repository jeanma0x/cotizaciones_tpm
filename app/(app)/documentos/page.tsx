import { ClipboardListIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { DocumentosFiltros } from "@/components/app/documentos-filtros";
import { DocumentosTable, type FilaDocumento } from "@/components/app/documentos-table";
import { ExportarDocumentosDialog } from "@/components/app/exportar-documentos-dialog";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const TIPOS_VALIDOS = ["COTIZACION", "PROPUESTA", "FACTURA"];
const ESTADOS_VALIDOS = [
  "BORRADOR",
  "ENVIADA",
  "EN_NEGOCIACION",
  "ACEPTADA",
  "RECHAZADA",
  "VENCIDA",
  "FACTURADA",
];

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const empresasPermitidas = await getEmpresasPermitidas();

  const empresaIds =
    params.empresaId && empresasPermitidas.includes(params.empresaId)
      ? [params.empresaId]
      : empresasPermitidas;

  const where: Prisma.DocumentoWhereInput = {
    empresaId: { in: empresaIds },
  };
  if (params.tipo && TIPOS_VALIDOS.includes(params.tipo)) {
    where.tipo = params.tipo as Prisma.DocumentoWhereInput["tipo"];
  }
  if (params.estado && ESTADOS_VALIDOS.includes(params.estado)) {
    where.estado = params.estado as Prisma.DocumentoWhereInput["estado"];
  }
  if (params.q) {
    // El correlativo se muestra como "TPM-1001" en la interfaz, pero se
    // guarda solo el número — sacamos los dígitos para que buscar "TPM-1001",
    // "1001" o "tpm 1001" encuentre el mismo documento.
    const digitos = params.q.replace(/\D/g, "");
    const correlativo = digitos ? Number(digitos) : NaN;
    where.OR = [
      { cliente: { nombre: { contains: params.q, mode: "insensitive" } } },
      ...(Number.isFinite(correlativo) ? [{ correlativo }] : []),
    ];
  }

  const [documentos, empresas] = await Promise.all([
    db.documento.findMany({
      where,
      include: {
        empresa: true,
        cliente: true,
        historial: { orderBy: { fecha: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.empresa.findMany({
      where: { id: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const hoy = Date.now();
  const UN_DIA_MS = 24 * 60 * 60 * 1000;
  function diasSinRespuesta(doc: (typeof documentos)[number]) {
    if (doc.estado !== "ENVIADA" && doc.estado !== "EN_NEGOCIACION") return null;
    const ultimoCambio = doc.historial[0]?.fecha ?? doc.createdAt;
    const dias = Math.floor((hoy - ultimoCambio.getTime()) / UN_DIA_MS);
    return dias > 7 ? dias : null;
  }

  const filas: FilaDocumento[] = documentos.map((doc) => ({
    id: doc.id,
    correlativo: doc.correlativo,
    tipo: doc.tipo,
    empresaNombre: doc.empresa.nombre,
    empresaMoneda: doc.empresa.moneda,
    clienteNombre: doc.cliente?.nombre ?? "—",
    total: Number(doc.total),
    estado: doc.estado,
    diasSinRespuesta: diasSinRespuesta(doc),
    fecha: doc.fecha.toISOString(),
    vigenciaDias: doc.vigenciaDias,
    condicionesPago: doc.condicionesPago,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Documentos"
        icon={ClipboardListIcon}
        actions={
          <>
            <ExportarDocumentosDialog />
            <Button nativeButton={false} render={<Link href="/documentos/nuevo" />}>
              <PlusIcon className="h-4 w-4" />
              Nuevo documento
            </Button>
          </>
        }
      />

      <DocumentosFiltros empresas={empresas} />

      <DocumentosTable data={filas} />
    </div>
  );
}
