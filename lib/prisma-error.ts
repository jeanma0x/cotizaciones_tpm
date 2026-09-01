import { Prisma } from "@prisma/client";

// Tanda 4 del audit crítico: antes de esto, un error de Prisma que escapaba
// de una validación de negocio (ej. una carrera real en el correlativo, o un
// duplicado que sí está protegido por una constraint única en la base, no
// solo por un aviso de "doble confirmación") llegaba crudo hasta el toast del
// usuario — un mensaje en inglés con nombres de columnas de Postgres, nada
// útil para alguien que no sabe de sistemas. Esto centraliza la traducción a
// un mensaje en español entendible. Usarlo en el catch alrededor de la
// escritura a la base, nunca alrededor de validaciones propias (esas ya
// tiran su propio Error con un mensaje claro).
export function mapearErrorPrisma(error: unknown): Error {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return new Error(
          "Ya existe un registro con ese valor — probá con uno distinto.",
        );
      case "P2003":
        return new Error(
          "Esta operación no se puede completar porque el registro está relacionado con otro.",
        );
      case "P2025":
        return new Error("El registro que intentás modificar ya no existe.");
      default:
        return new Error("Ocurrió un error al guardar. Intentá de nuevo.");
    }
  }
  if (error instanceof Error) return error;
  return new Error("Ocurrió un error inesperado.");
}
