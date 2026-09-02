-- Pedido de Oldemar (WhatsApp, 02/09/26): reemplaza "vigenciaDias" (número de
-- días desde `fecha`) por "validoHasta" (fecha de calendario directa,
-- realmente opcional). Los 7 documentos reales existentes tienen
-- vigenciaDias con valor -- se preserva esa vigencia calculando la fecha
-- equivalente antes de borrar la columna vieja (ver CLAUDE.md "Nunca se
-- pierde el historial").
ALTER TABLE "documentos" ADD COLUMN "validoHasta" TIMESTAMP(3);

UPDATE "documentos"
SET "validoHasta" = "fecha" + ("vigenciaDias" || ' days')::interval
WHERE "vigenciaDias" IS NOT NULL;

ALTER TABLE "documentos" DROP COLUMN "vigenciaDias";
