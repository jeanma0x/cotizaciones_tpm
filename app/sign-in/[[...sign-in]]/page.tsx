import { SignIn } from "@clerk/nextjs";
import { Cog } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-sunken px-4">
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand">
          <Cog className="h-7 w-7 text-accent" />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Servicios Generales TPM
        </p>
      </div>
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "var(--color-brand)",
            // Fijo blanco en ambos temas (no --color-surface: en oscuro ese
            // token es casi negro, y el botón primario sigue siendo un navy
            // medio en ambos temas — mismo criterio que --sidebar-foreground
            // en design-system.md para texto sobre un elemento de marca fijo.
            colorPrimaryForeground: "var(--sidebar-foreground)",
            colorBackground: "var(--color-surface)",
            colorForeground: "var(--color-text-primary)",
            colorMutedForeground: "var(--color-text-secondary)",
            colorInput: "var(--color-surface)",
            colorInputForeground: "var(--color-text-primary)",
            colorBorder: "var(--color-border)",
            colorDanger: "var(--color-danger)",
            colorSuccess: "var(--color-success)",
            colorRing: "var(--color-accent)",
            borderRadius: "0.5rem",
          },
          elements: {
            card: "shadow-none border border-border",
            formButtonPrimary:
              "bg-brand text-sidebar-foreground hover:bg-brand-hover transition-colors duration-(--motion-fast)",
            footerActionLink: "text-accent-hover hover:text-accent",
          },
        }}
      />
    </div>
  );
}
