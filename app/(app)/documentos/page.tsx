import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { DocumentosFiltros } from "@/components/app/documentos-filtros";
import { EstadoBadge } from "@/components/app/estado-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const TIPO_LABELS: Record<string, string> = {
  COTIZACION: "Cotización",
  PROPUESTA: "Propuesta",
  FACTURA: "Factura",
};

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
      include: { empresa: true, cliente: true },
      orderBy: { createdAt: "desc" },
    }),
    db.empresa.findMany({
      where: { id: { in: empresasPermitidas } },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Documentos</h1>
        <Button render={<Link href="/documentos/nuevo" />}>
          <PlusIcon className="h-4 w-4" />
          Nuevo documento
        </Button>
      </div>

      <DocumentosFiltros empresas={empresas} />

      <div className="rounded border border-line bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Correlativo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No hay documentos que coincidan con estos filtros.
                </TableCell>
              </TableRow>
            )}
            {documentos.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <Link href={`/documentos/${doc.id}`} className="correlativo-tag">
                    TPM-{doc.correlativo}
                  </Link>
                </TableCell>
                <TableCell>{TIPO_LABELS[doc.tipo]}</TableCell>
                <TableCell>{doc.empresa.nombre}</TableCell>
                <TableCell>{doc.cliente?.nombre ?? "—"}</TableCell>
                <TableCell className="font-mono text-sm">
                  {doc.empresa.moneda} {Number(doc.total).toFixed(2)}
                </TableCell>
                <TableCell>
                  <EstadoBadge estado={doc.estado} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
