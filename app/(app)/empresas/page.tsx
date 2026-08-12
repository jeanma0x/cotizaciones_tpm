import { EmpresaFormDialog } from "@/components/app/empresa-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { assertSuperusuario, getEmpresasPermitidas } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function EmpresasPage() {
  await assertSuperusuario();
  const empresasPermitidas = await getEmpresasPermitidas();

  const empresas = await db.empresa.findMany({
    where: { id: { in: empresasPermitidas } },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink">Empresas</h1>

      <div className="rounded border border-line bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead>Correlativo actual</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empresas.map((empresa) => (
              <TableRow key={empresa.id}>
                <TableCell className="font-medium">{empresa.nombre}</TableCell>
                <TableCell className="font-mono text-xs">
                  {empresa.nit ?? "—"}
                </TableCell>
                <TableCell>{empresa.moneda}</TableCell>
                <TableCell className="font-mono text-xs">
                  {empresa.correlativoActual}
                </TableCell>
                <TableCell className="text-right">
                  <EmpresaFormDialog
                    empresa={empresa}
                    trigger={
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
