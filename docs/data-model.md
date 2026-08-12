# Modelo de datos

## Principio rector

**Todo dato que pertenece a una empresa lleva `empresaId`, sin excepción**, y toda
consulta a la base de datos se filtra por las empresas a las que el usuario conectado
tiene acceso — nunca por lo que el cliente (navegador) diga que quiere ver. Ver
`security.md` para el detalle de cómo se aplica esto en código.

## Diagrama de relaciones (texto)

```
Empresa 1──* UsuarioEmpresa *──1 Usuario
Empresa 1──* Cliente
Empresa 1──* Servicio
Empresa 1──* Documento 1──* ItemDocumento
Documento 1──* HistorialEstado
Documento *──1 Cliente
```

## Schema de Prisma (punto de partida)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum RolUsuario {
  SUPERUSUARIO
  MIEMBRO
}

enum TipoDocumento {
  COTIZACION
  PROPUESTA
  FACTURA
}

enum EstadoDocumento {
  BORRADOR
  ENVIADA
  EN_NEGOCIACION
  ACEPTADA
  RECHAZADA
  VENCIDA
  FACTURADA
}

model Empresa {
  id                String   @id @default(cuid())
  nombre            String
  nit               String?
  direccion         String?
  contacto          String?
  telefono          String?
  email             String?
  moneda            String   @default("GTQ")
  correlativoActual Int      @default(1000) // el próximo asignado será +1 (ver lib/correlativo.ts)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  usuarios   UsuarioEmpresa[]
  clientes   Cliente[]
  servicios  Servicio[]
  documentos Documento[]

  @@map("empresas")
}

model Usuario {
  id        String   @id @default(cuid())
  clerkId   String   @unique // referencia al usuario en Clerk, fuente de verdad de auth
  nombre    String
  email     String   @unique
  rol       RolUsuario @default(MIEMBRO)
  createdAt DateTime @default(now())

  empresas UsuarioEmpresa[]

  @@map("usuarios")
}

// Tabla puente: qué usuario puede acceder a qué empresa.
// El superusuario igual tiene filas aquí para cada empresa (no se asume acceso total
// implícito en el código — se hace explícito en la base de datos también).
model UsuarioEmpresa {
  id        String  @id @default(cuid())
  usuarioId String
  empresaId String
  usuario   Usuario @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  empresa   Empresa @relation(fields: [empresaId], references: [id], onDelete: Cascade)

  @@unique([usuarioId, empresaId])
  @@map("usuario_empresa")
}

model Cliente {
  id        String   @id @default(cuid())
  empresaId String
  empresa   Empresa  @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  nombre    String
  nit       String?
  direccion String?
  contacto  String?
  telefono  String?
  email     String?
  activo    Boolean  @default(true) // permite ocultar clientes viejos sin borrarlos
  createdAt DateTime @default(now())

  documentos Documento[]

  @@index([empresaId])
  @@map("clientes")
}

model Servicio {
  id          String  @id @default(cuid())
  empresaId   String
  empresa     Empresa @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  nombre      String
  precioFijo  Decimal @db.Decimal(12, 2)
  activo      Boolean @default(true)

  @@index([empresaId])
  @@map("servicios")
}

model Documento {
  id                  String          @id @default(cuid())
  empresaId           String
  empresa             Empresa         @relation(fields: [empresaId], references: [id])
  tipo                TipoDocumento
  correlativo         Int             // único junto con empresaId + tipo, o junto con empresaId si el correlativo es compartido entre tipos (confirmar con el cliente si aún no se hizo — ver nota abajo)
  clienteId           String?
  cliente             Cliente?        @relation(fields: [clienteId], references: [id])
  fecha               DateTime
  vigenciaDias        Int?            @default(15)
  condicionesPago     String?
  descripcionGeneral  String?         @db.Text // el campo "Descripción general" pedido por el cliente
  subtotal            Decimal         @db.Decimal(12, 2)
  descuento           Decimal         @db.Decimal(12, 2) @default(0)
  total               Decimal         @db.Decimal(12, 2)
  notas               Json            // [{ titulo: string, texto: string }]
  anexos              Json?           // string[] — solo aplica a propuestas
  estado              EstadoDocumento @default(BORRADOR)
  duplicadoDeId       String?         // referencia al documento original si se creó con "Duplicar"
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  items     ItemDocumento[]
  historial HistorialEstado[]

  @@unique([empresaId, correlativo])
  @@index([empresaId, tipo, estado])
  @@map("documentos")
}

model ItemDocumento {
  id            String    @id @default(cuid())
  documentoId   String
  documento     Documento @relation(fields: [documentoId], references: [id], onDelete: Cascade)
  orden         Int       // para mantener el orden de renglones al editar
  cantidad      Decimal   @db.Decimal(10, 2)
  descripcion   String    @db.Text // sin límite de longitud — ver document-export.md
  precioUnitario Decimal  @db.Decimal(12, 2)

  @@map("items_documento")
}

// Historial append-only: nunca se actualiza ni se borra una fila existente.
model HistorialEstado {
  id          String          @id @default(cuid())
  documentoId String
  documento   Documento       @relation(fields: [documentoId], references: [id], onDelete: Cascade)
  fecha       DateTime        @default(now())
  estado      EstadoDocumento
  nota        String?

  @@map("historial_estado")
}
```

## Notas importantes sobre el schema

- **`correlativoActual` vive en `Empresa`, no en una tabla global de configuración.**
  Cada empresa lleva el suyo, empezando en 1000 (el primero asignado será 1001). Asignar
  el siguiente correlativo debe hacerse dentro de una transacción de Prisma que
  incrementa `correlativoActual` y crea el `Documento` a la vez, para evitar que dos
  solicitudes simultáneas se lleven el mismo número (condición de carrera).

- **Decisión final sobre el correlativo (confirmada, no es una pregunta abierta):**
  cada empresa lleva **un solo contador de 4 dígitos, compartido entre los 3 tipos de
  documento** (Cotización, Propuesta, Factura) — no un contador separado por tipo. El
  `@@unique([empresaId, correlativo])` de arriba ya implementa esto correctamente: no
  agregar `tipo` a esa restricción. Razones: (1) el contrato dice "un correlativo por
  empresa", en singular; (2) el tipo de documento siempre se muestra junto al número, así
  que no hay ambigüedad real; (3) la "Factura" de este sistema no es la factura legal
  (FEL) — no hay obligación externa de llevar esa serie separada; (4) es más simple de
  operar para el cliente, que es el criterio que más pesa en este proyecto.

- **`descripcion` en `ItemDocumento` es de tipo texto sin límite**, y en la interfaz debe
  renderizarse en un `<textarea>` que crece con el contenido (autosize), no un `<input>`
  de una sola línea. Ver `document-export.md`.

- **`UsuarioEmpresa` existe incluso para el superusuario.** No se debe escribir código
  que asuma "si es superusuario, no hace falta revisar la tabla puente" — el
  superusuario simplemente tiene una fila por cada una de las 4 empresas. Esto mantiene
  una sola fuente de verdad para "quién puede ver qué empresa" y evita tener dos
  caminos de autorización distintos en el código (uno para superusuario, otro para
  miembro).

- **`Servicio.activo`** permite desactivar un servicio del catálogo sin borrarlo (por si
  ya está referenciado en documentos históricos). **`Cliente.activo`** cumple el mismo
  propósito para el catálogo de clientes (agregado en el Día 2 a pedido del cliente).

- **`Empresa.contacto`** (agregado en el Día 5) es la persona de contacto de la empresa
  que **emite** el documento — no confundir con `Cliente.contacto`, que es el contacto
  del lado del cliente. En el documento exportado, la fila "Contacto de servicio" (ver
  `document-export.md`) sale de `Empresa.contacto` + `Empresa.telefono` +
  `Empresa.email` de la empresa emisora de ese documento en particular, no de un texto
  fijo ni del cliente.

- **Nunca hacer `DELETE` sobre `Documento` u `HistorialEstado`** desde la aplicación.
  Si se necesita un estado "archivado", agregarlo como un valor más de `EstadoDocumento`
  o un campo `archivadoEn DateTime?`, nunca borrando filas.

## Seed de datos

Mientras no lleguen los datos reales del cliente (ver lista en `CLAUDE.md`), el
`prisma/seed.ts` debe crear las 4 empresas con nombres genéricos claramente marcados
como de prueba (ej. `"[DEMO] SIAP"`), 2-3 clientes y servicios de ejemplo por empresa, y
un usuario superusuario con el correo real que Oldemar confirme. No inventar NITs o
datos que parezcan reales — usar placeholders obviamente ficticios (ej. `NIT: 000000-0`)
para que nadie los confunda con datos de producción.
