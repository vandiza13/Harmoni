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
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
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
        "border-t border-border/50 bg-card/80 backdrop-blur-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.2)]",
        "pb-safe transition-all duration-300",
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
                "relative flex flex-col items-center gap-1 rounded-2xl px-3 py-2",
                "min-w-[64px] min-h-[56px] justify-center select-none",
                "transition-all duration-200 active:scale-95",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <div className="absolute inset-0 bg-primary/10 rounded-2xl -z-10 animate-fade-in" />
              )}
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl",
                  "transition-all duration-300",
                  active && "translate-y-[-2px]"
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
                "relative flex flex-col items-center gap-1 rounded-2xl px-3 py-2",
                "min-w-[64px] min-h-[56px] justify-center select-none",
                "transition-all duration-200 active:scale-95 text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300">
                <Menu className="h-5 w-5" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-medium">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Menu Navigasi Utama</SheetTitle>
            <Sidebar className="flex relative h-full w-full" />
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
