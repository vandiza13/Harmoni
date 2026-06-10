"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  ShoppingCart,
  Calendar,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

const MOBILE_NAV_ITEMS = [
  {
    label: "Beranda",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Keuangan",
    href: "/dashboard/keuangan",
    icon: Wallet,
  },
  {
    label: "Belanja",
    href: "/dashboard/belanja",
    icon: ShoppingCart,
  },
  {
    label: "Agenda",
    href: "/dashboard/agenda",
    icon: Calendar,
  },
];

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "border-t border-border bg-card/90 backdrop-blur-xl",
        "pb-safe",
        className
      )}
    >
      <div className="flex items-center justify-around px-2 pt-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-2",
                "min-w-[60px] min-h-[56px] justify-center",
                "transition-all duration-150",
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl",
                  "transition-all duration-150",
                  active && "bg-primary/10"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all",
                    active && "scale-110"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  active ? "font-semibold" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* ─── "More" drawer ────────────────────────── */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-2",
                "min-w-[60px] min-h-[56px] justify-center",
                "transition-all duration-150 text-muted-foreground"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl">
                <Menu className="h-5 w-5" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-medium">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar className="flex relative h-full w-full" />
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
