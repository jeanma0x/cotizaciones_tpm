import { auth } from "@clerk/nextjs/server";
import { Sidebar } from "@/components/app/sidebar";
import { getUsuarioActual } from "@/lib/current-usuario";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth.protect({ unauthenticatedUrl: "/sign-in" });

  const usuario = await getUsuarioActual();

  if (!usuario) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-paper p-8 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          Tu cuenta todavía no tiene acceso asignado a ninguna empresa. Contactá al
          administrador del sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar esSuperusuario={usuario.rol === "SUPERUSUARIO"} />
      <main className="flex-1 bg-paper p-8">{children}</main>
    </div>
  );
}
