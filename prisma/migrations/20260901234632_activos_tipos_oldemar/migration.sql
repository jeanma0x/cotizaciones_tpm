-- Escrita a mano (Prisma Migrate se niega a generar esto de forma no
-- interactiva por el warning de "se pierden valores del enum") en vez de con
-- --create-only: verificado antes de escribir esto que `activos` tiene 0
-- filas en la base compartida dev/prod, así que no hay ningún dato real que
-- se pueda perder al recrear la columna "tipo" ni al borrar "categoria".

-- Tipo se aplana: los valores viejos de furgón/plataforma (que antes vivían
-- en el enum CategoriaFurgon, subordinado a tipo=FURGON_O_PLATAFORMA) ahora
-- son valores de primer nivel de TipoActivo. Se quita la columna "categoria"
-- por completo.
ALTER TABLE "activos" DROP COLUMN "categoria";
DROP TYPE "CategoriaFurgon";

-- Se recrea "tipo" con el enum nuevo — drop + create en vez de ALTER TYPE
-- ... RENAME VALUE porque varios valores viejos (MAQUINARIA_SOLDAR,
-- EQUIPO_ARRASTRE, FURGON_O_PLATAFORMA) no tienen un equivalente 1:1 nuevo.
ALTER TABLE "activos" DROP COLUMN "tipo";
DROP TYPE "TipoActivo";

CREATE TYPE "TipoActivo" AS ENUM (
  'CABEZAL',
  'FURGON_SECO',
  'FURGON_REFRIGERADO',
  'PLATAFORMA',
  'LOWBOY',
  'CISTERNA',
  'CAMION',
  'CAMION_C3',
  'CAMION_C2',
  'PORTACONTENEDOR',
  'OTRO'
);

ALTER TABLE "activos" ADD COLUMN "tipo" "TipoActivo" NOT NULL;

-- Detalle libre cuando tipo = OTRO (mismo criterio que
-- CostoOperativo.categoriaOtroDetalle).
ALTER TABLE "activos" ADD COLUMN "tipoOtroDetalle" TEXT;
