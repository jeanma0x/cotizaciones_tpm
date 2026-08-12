import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Servicios Generales TPM",
  description: "Cotizaciones, propuestas y facturas — Corporación SIAP S.A.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ClerkProvider appearance={{ theme: shadcn }}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}