"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Botón flotante de acceso rápido a "Nuevo documento" — solo mobile
// (md:hidden). Con 8+ destinos en el menú, un bottom tab bar no rendía
// bien (necesitaría un "Más" de todos modos); en cambio, la acción que más
// se repite en el día a día (crear una cotización/factura) queda a un
// toque, sin abrir el panel lateral.
//
// Solo en Panel y Documentos (confirmado con el usuario, 09/09/26) — en
// cualquier otra pantalla ya se está en otra tarea específica (un
// formulario, un detalle, un reporte) y el botón tapaba controles reales
// en vez de ayudar. Ver ejemplo concreto: /documentos/[id]/editar usa el
// mismo formulario que /documentos/nuevo, con su propia barra de
// Cancelar/Guardar fija al fondo — el FAB quedaba encima.
const PANTALLAS_CON_FAB = ["/dashboard", "/documentos"];

export function FabNuevoDocumento() {
  const pathname = usePathname();
  if (!PANTALLAS_CON_FAB.includes(pathname)) return null;

  return (
    <Link
      href="/documentos/nuevo"
      aria-label="Crear nuevo documento"
      className="fixed right-5 bottom-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-colors duration-(--motion-fast) hover:bg-accent-hover active:translate-y-px md:hidden"
    >
      <PlusIcon className="h-6 w-6" />
    </Link>
  );
}
