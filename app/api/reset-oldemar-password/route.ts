import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Ruta temporal, de un solo uso — Oldemar dijo que la contraseña anterior
// "no la reconoce" (probablemente un carácter ambiguo se perdió al
// copiar/pegar). Resetea su contraseña a una nueva, sin caracteres
// confundibles (sin l/I/1/0/O). Protegida por RESET_SECRET (variable de
// entorno de Vercel, nunca en el código). Se elimina apenas se confirma que
// puede entrar.
const ALFABETO_CLARO = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generarPasswordClara(longitud: number) {
  let resultado = "";
  for (let i = 0; i < longitud; i++) {
    resultado += ALFABETO_CLARO[Math.floor(Math.random() * ALFABETO_CLARO.length)];
  }
  return resultado;
}

export async function POST(request: Request) {
  const secretoEsperado = process.env.RESET_SECRET;
  if (!secretoEsperado || request.headers.get("x-reset-secret") !== secretoEsperado) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const EMAIL = "corpsiapsa@corpsiap.com";
  const usuario = await db.usuario.findUnique({ where: { email: EMAIL } });
  if (!usuario) {
    return NextResponse.json({ error: "Usuario no encontrado en la base de datos" }, { status: 404 });
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(usuario.clerkId);

  // Clerk exige mezcla de mayúscula/minúscula/número/símbolo por defecto —
  // el alfabeto "claro" anterior (sin l/I/1/0/O) no incluía símbolos.
  const passwordNueva = generarPasswordClara(12) + "#7";

  try {
    await client.users.updateUser(usuario.clerkId, { password: passwordNueva });
  } catch (error) {
    const detalle =
      error && typeof error === "object" && "errors" in error
        ? (error as { errors: unknown }).errors
        : String(error);
    return NextResponse.json({ error: "Clerk rechazó la contraseña", detalle }, { status: 422 });
  }

  return NextResponse.json({
    ok: true,
    email: EMAIL,
    passwordNueva,
    correoVerificado: clerkUser.emailAddresses.some(
      (e) => e.emailAddress === EMAIL && e.verification?.status === "verified",
    ),
    tieneEmailPrimario: Boolean(clerkUser.primaryEmailAddressId),
  });
}
