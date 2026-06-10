"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  Receipt,
  Bird,
  Shield,
  ArrowLeftRight,
  Package,
  ShoppingCart,
  UtensilsCrossed,
  Calendar,
  Baby,
  FileText,
  BarChart3,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string | null;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const NAV_ITEMS: NavGroup[] = [
  {
    group: "Utama",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    group: "Keuangan",
    items: [
      {
        label: "Keuangan",
        href: "/dashboard/keuangan",
        icon: Wallet,
      },
      {
        label: "Anggaran",
        href: "/dashboard/anggaran",
        icon: PieChart,
      },
      {
        label: "Tagihan Rutin",
        href: "/dashboard/tagihan",
        icon: Receipt,
        badge: null as string | null, // Will be populated with overdue count
      },
      {
        label: "Tabungan",
        href: "/dashboard/tabungan",
        icon: Bird,
      },
      {
        label: "Dana Darurat",
        href: "/dashboard/dana-darurat",
        icon: Shield,
      },
      {
        label: "Hutang & Piutang",
        href: "/dashboard/hutang-piutang",
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    group: "Rumah Tangga",
    items: [
      {
        label: "Stok Dapur",
        href: "/dashboard/stok-dapur",
        icon: Package,
      },
      {
        label: "Daftar Belanja",
        href: "/dashboard/belanja",
        icon: ShoppingCart,
      },
      {
        label: "Meal Planner",
        href: "/dashboard/meal-planner",
        icon: UtensilsCrossed,
      },
    ],
  },
  {
    group: "Keluarga",
    items: [
      {
        label: "Agenda",
        href: "/dashboard/agenda",
        icon: Calendar,
      },
      {
        label: "Manajemen Anak",
        href: "/dashboard/anak",
        icon: Baby,
      },
      {
        label: "Dokumen",
        href: "/dashboard/dokumen",
        icon: FileText,
      },
    ],
  },
  {
    group: "Analitik",
    items: [
      {
        label: "Laporan",
        href: "/dashboard/laporan",
        icon: BarChart3,
      },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 flex-col",
          "bg-white dark:bg-zinc-950/50 backdrop-blur-2xl border-r border-border",
          className
        )}
      >
      {/* ─── Logo ─────────────────────────────────────── */}
      <div className="flex h-16 items-center px-6 mt-2">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 rounded-xl overflow-hidden shadow-soft-sm border border-border/50 bg-white">
            <img 
              src="/logo.png" 
              alt="Harmoni" 
              className="w-full h-full object-contain p-0.5"
            />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            Harmoni
          </span>
        </Link>
      </div>

      {/* ─── Navigation ───────────────────────────────── */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {NAV_ITEMS.map((group) => (
            <div key={group.group}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.group}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5",
                          "text-sm font-medium transition-all duration-150",
                          "min-h-[44px]",
                          active
                            ? "bg-primary/15 text-primary shadow-[0_0_12px_rgba(34,197,94,0.1)] dark:bg-primary/15 dark:shadow-[0_0_20px_rgba(34,197,94,0.2)] ring-1 ring-primary/20 font-semibold"
                            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge variant="destructive" className="h-5 text-[10px]">
                            {item.badge}
                          </Badge>
                        )}
                        {active && (
                          <ChevronRight className="h-3 w-3 text-primary" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* ─── User section ─────────────────────────────── */}
      <div className="p-3 mt-auto">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl p-2.5",
            "min-h-[56px]"
          )}
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={user?.image ?? undefined} />
            <AvatarFallback className="gradient-primary text-white text-xs font-semibold">
              {getInitials(user?.name || user?.email || "U")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {user?.name || "Pengguna"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {(user as { familyName?: string })?.familyName || "Keluarga Saya"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
