import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Datos de ejemplo, claramente ficticios — ver nota en CLAUDE.md sobre datos reales
// pendientes de recibir del cliente. No usar NITs ni datos que parezcan reales.
const EMPRESAS = [
  { nombre: "[DEMO] SIAP", moneda: "GTQ" },
  { nombre: "[DEMO] Estados Unidos", moneda: "USD" },
  { nombre: "[DEMO] Panamá", moneda: "USD" },
  { nombre: "[DEMO] Individual", moneda: "GTQ" },
] as const;

// Usuario de prueba usado para validar el login en el Día 1 (ver docs/plan-de-construccion.md).
// Reemplazar por el correo real de Oldemar cuando lo confirme (ver CLAUDE.md).
const SUPERUSUARIO = {
  clerkId: "user_3HnnVzoQlGSjta1FldrMTF8j6wO",
  email: "cristianordonez344@gmail.com",
  nombre: "[DEMO] Superusuario de prueba",
};

async function main() {
  const empresas = [];
  for (const data of EMPRESAS) {
    // Empresa.nombre no tiene constraint unique en el schema (ver data-model.md),
    // así que buscamos por nombre en vez de usar upsert.
    const empresa =
      (await db.empresa.findFirst({ where: { nombre: data.nombre } })) ??
      (await db.empresa.create({
        data: {
          ...data,
          nit: "000000-0",
          direccion: "[DEMO] Dirección de ejemplo",
          contacto: "[DEMO] Nombre de contacto",
          telefono: "0000-0000",
          email: `demo@${data.nombre.toLowerCase().replace(/[^a-z]/g, "")}.example`,
        },
      }));
    empresas.push(empresa);

    for (let i = 1; i <= 2; i++) {
      await db.cliente.upsert({
        where: { id: `${empresa.id}-cliente-demo-${i}` },
        update: {},
        create: {
          id: `${empresa.id}-cliente-demo-${i}`,
          empresaId: empresa.id,
          nombre: `[DEMO] Cliente ${i} de ${data.nombre}`,
          nit: "000000-0",
          direccion: "[DEMO] Dirección de ejemplo",
          contacto: "[DEMO] Contacto de ejemplo",
          telefono: "0000-0000",
          email: `cliente${i}@demo.example`,
        },
      });
    }

    for (let i = 1; i <= 2; i++) {
      await db.servicio.upsert({
        where: { id: `${empresa.id}-servicio-demo-${i}` },
        update: {},
        create: {
          id: `${empresa.id}-servicio-demo-${i}`,
          empresaId: empresa.id,
          nombre: `[DEMO] Servicio ${i} de ${data.nombre}`,
          precioFijo: 1000 * i,
        },
      });
    }
  }

  const usuario = await db.usuario.upsert({
    where: { clerkId: SUPERUSUARIO.clerkId },
    update: { rol: "SUPERUSUARIO" },
    create: {
      clerkId: SUPERUSUARIO.clerkId,
      email: SUPERUSUARIO.email,
      nombre: SUPERUSUARIO.nombre,
      rol: "SUPERUSUARIO",
    },
  });

  for (const empresa of empresas) {
    await db.usuarioEmpresa.upsert({
      where: { usuarioId_empresaId: { usuarioId: usuario.id, empresaId: empresa.id } },
      update: {},
      create: { usuarioId: usuario.id, empresaId: empresa.id },
    });
  }

  console.log(`Seed listo: ${empresas.length} empresas, superusuario ${usuario.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
