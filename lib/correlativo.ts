import type { Prisma } from "@prisma/client";

// Asigna el siguiente correlativo de una empresa dentro de una transacción,
// incrementando Empresa.correlativoActual y devolviendo el nuevo valor. El
// UPDATE toma un lock de fila en Postgres, así que dos llamadas concurrentes
// nunca obtienen el mismo número (ver docs/security.md, prueba #4).
export async function asignarCorrelativo(
  tx: Prisma.TransactionClient,
  empresaId: string,
): Promise<number> {
  const empresa = await tx.empresa.update({
    where: { id: empresaId },
    data: { correlativoActual: { increment: 1 } },
    select: { correlativoActual: true },
  });
  return empresa.correlativoActual;
}
