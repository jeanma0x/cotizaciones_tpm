import { clerkClient } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Ruta temporal, de un solo uso — crea el acceso de Cleiber de León Palma
// (miembro, solo con acceso a Servicios Generales TPM) mientras el dominio
// propio sigue sin conectarse (bloquea el flujo normal de invitación de
// Clerk — ver docs/propuesta-modulo-financiero.md, punto 6). Protegida por
// BOOTSTRAP_SECRET (variable de entorno de Vercel, nunca en el código). Se
// elimina apenas se confirma que Cleiber puede entrar.
const EMAIL = "cleiberdeleonpalma@gmail.com";
const NOMBRE = "Cleiber de León Palma";

export async function POST(request: Request) {
  const secretoEsperado = process.env.BOOTSTRAP_SECRET;
  if (!secretoEsperado || request.headers.get("x-bootstrap-secret") !== secretoEsperado) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const existente = await db.usuario.findUnique({ where: { email: EMAIL } });
  if (existente) {
    return NextResponse.json({ error: "Ya existe un usuario con ese correo" }, { status: 409 });
  }

  const empresaTpm = await db.empresa.findFirst({
    where: { nombre: { contains: "TPM", mode: "insensitive" } },
  });
  if (!empresaTpm) {
    return NextResponse.json({ error: "No se encontró la empresa TPM" }, { status: 404 });
  }

  // Clerk exige 15+ caracteres y mezcla de mayúscula/minúscula/número/símbolo
  // (confirmado con el reset de Oldemar: form_password_length_too_short).
  const password = randomBytes(12).toString("base64url") + "aA1!";

  const client = await clerkClient();
  const [primerNombre, ...resto] = NOMBRE.split(" ");

  let clerkUserId: string;
  try {
    const clerkUser = await client.users.createUser({
      emailAddress: [EMAIL],
      password,
      firstName: primerNombre,
      lastName: resto.join(" "),
    });
    clerkUserId = clerkUser.id;
  } catch (error) {
    const detalle =
      error && typeof error === "object" && "errors" in error
        ? (error as { errors: unknown }).errors
        : String(error);
    return NextResponse.json({ error: "Clerk rechazó la creación del usuario", detalle }, { status: 422 });
  }

  const usuario = await db.usuario.create({
    data: {
      clerkId: clerkUserId,
      nombre: NOMBRE,
      email: EMAIL,
      rol: "MIEMBRO",
      empresas: { create: [{ empresaId: empresaTpm.id }] },
    },
    include: { empresas: { include: { empresa: true } } },
  });

  return NextResponse.json({
    ok: true,
    email: EMAIL,
    password,
    usuarioId: usuario.id,
    clerkId: clerkUserId,
    empresas: usuario.empresas.map((e) => e.empresa.nombre),
  });
}
