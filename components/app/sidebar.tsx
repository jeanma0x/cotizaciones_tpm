"use client";

import { UserButton } from "@clerk/nextjs";
import { Building2, Truck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/servicios", label: "Servicios", icon: Truck },
];

const NAV_ITEM_SUPERUSUARIO: NavItem = {
  href: "/empresas",
  label: "Empresas",
  icon: Building2,
};

export function Sidebar({ esSuperusuario }: { esSuperusuario: boolean }) {
  const pathname = usePathname();
  const items = esSuperusuario ? [...NAV_ITEMS, NAV_ITEM_SUPERUSUARIO] : NAV_ITEMS;

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-navy text-paper">
      <div className="flex items-center gap-2 px-5 py-6">
        <span className="font-mono text-lg font-extrabold tracking-wide text-amber">
          TPM
        </span>
        <span className="text-xs uppercase tracking-widest text-paper/70">
          Servicios Generales
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map(({ href, label, icon: Icon }) => {
          const activo = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors",
                activo
                  ? "bg-amber text-ink"
                  : "text-paper/85 hover:bg-navy-2 hover:text-paper",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-2 border-t border-navy-2 px-5 py-4">
        <UserButton />
      </div>
    </aside>
  );
}
