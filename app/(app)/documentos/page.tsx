import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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

const TIPO_LABELS: Record<string, string> = {
  COTIZACION: "Cotización",
  PROPUESTA: "Propuesta",
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

export default async function DocumentosPage() {
  const empresasPermitidas = await getEmpresasPermitidas();

  const documentos = await db.documento.findMany({
    where: { empresaId: { in: empresasPermitidas } },
    include: { empresa: true, cliente: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Documentos</h1>
        <Button render={<Link href="/documentos/nuevo" />}>
          <PlusIcon className="h-4 w-4" />
          Nuevo documento
        </Button>
      </div>

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
                  Todavía no hay documentos.
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
                  <Badge variant="outline">{ESTADO_LABELS[doc.estado]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
