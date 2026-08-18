import { clerkClient } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Ruta temporal, de un solo uso — mismo mecanismo que el bootstrap de Jean
// (Clerk producción bloquea Invitations sin dominio propio, ver memoria del
// proyecto). Se borra apenas se confirma que Oldemar puede iniciar sesión.
// Protegida por BOOTSTRAP_SECRET (variable de entorno, nunca en el código ni
// en git) — Oldemar todavía no existe como usuario, no hay sesión de Clerk
// contra la cual proteger esto. La contraseña temporal se genera acá mismo,
// nunca queda escrita en ningún archivo.
export async function POST(request: Request) {
  const secretoEsperado = process.env.BOOTSTRAP_SECRET;
  if (!secretoEsperado || request.headers.get("x-bootstrap-secret") !== secretoEsperado) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const EMAIL = "corpsiapsa@corpsiap.com";
  const NOMBRE = "Ing. Oldemar Villagrán Zelaya";

  const existente = await db.usuario.findUnique({ where: { email: EMAIL } });
  if (existente) {
    return NextResponse.json({ error: "Ya existe un usuario con ese correo" }, { status: 409 });
  }

  // Password temporal generada en el momento — nunca hardcodeada.
  const passwordTemporal = randomBytes(9).toString("base64url") + "aA1!";

  const client = await clerkClient();
  const clerkUser = await client.users.createUser({
    emailAddress: [EMAIL],
    password: passwordTemporal,
    firstName: "Oldemar",
    lastName: "Villagrán Zelaya",
  });

  const empresas = await db.empresa.findMany({ select: { id: true } });

  const usuario = await db.usuario.create({
    data: {
      clerkId: clerkUser.id,
      nombre: NOMBRE,
      email: EMAIL,
      rol: "SUPERUSUARIO",
      empresas: { create: empresas.map((e) => ({ empresaId: e.id })) },
    },
  });

  return NextResponse.json({
    ok: true,
    usuarioId: usuario.id,
    clerkId: clerkUser.id,
    email: EMAIL,
    passwordTemporal,
  });
}
