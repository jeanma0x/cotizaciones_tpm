import { auth } from "@clerk/nextjs/server";
import { CommandPalette } from "@/components/app/command-palette";
import { MobileTopBar } from "@/components/app/mobile-topbar";
import { PageTransition } from "@/components/app/page-transition";
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
      <div className="flex min-h-screen flex-1 items-center justify-center bg-surface-sunken p-8 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          Tu cuenta todavía no tiene acceso asignado a ninguna empresa. Contactá al
          administrador del sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar esSuperusuario={usuario.rol === "SUPERUSUARIO"} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileTopBar />
        <main className="flex-1 overflow-y-auto bg-surface-sunken p-4 md:p-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
