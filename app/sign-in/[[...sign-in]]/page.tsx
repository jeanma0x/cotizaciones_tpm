import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-sunken px-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático de marca, no necesita optimización de next/image */}
      <img
        src="/marca/svg/logo-color.svg"
        alt="Servicios Generales TPM"
        className="h-16 w-auto"
      />
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
