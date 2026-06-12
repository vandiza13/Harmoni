"use client";

import { useState, useEffect } from "react";
import { Bell, Search, ChevronDown, Plus, Sun, Moon, Settings, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials, formatRelative } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./sidebar";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const user = session?.user as {
    name?: string | null;
    image?: string | null;
    familyName?: string;
  };

  // Find current page title
  const currentPage = NAV_ITEMS.flatMap((g) => g.items).find(
    (item) =>
      pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center gap-2 md:gap-4 transition-all duration-200",
        "bg-background/80 px-4 pt-safe backdrop-blur-2xl md:px-6",
        isScrolled ? "border-b border-border shadow-sm h-14 md:h-16" : "h-16 md:h-20",
        className
      )}
    >
      {/* ─── Page title (native large title style) ── */}
      <div className="flex-1 min-w-0 transition-all duration-200">
        <h1 className={cn(
          "font-bold text-foreground truncate transition-all duration-200",
          isScrolled ? "text-lg" : "text-xl md:text-2xl"
        )}>
          {currentPage?.label || "Dashboard"}
        </h1>
        <p className="text-xs text-muted-foreground truncate hidden sm:block">
          {user?.familyName || "Keluarga Saya"}
        </p>
      </div>

      {/* ─── Actions ─────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground"
          asChild
        >
          <Link href="/dashboard/pencarian">
            <Search className="h-4 w-4" />
            <span className="sr-only">Cari</span>
          </Link>
        </Button>

        {/* Quick add */}
        <QuickAddMenu />

        {/* Theme Toggle (hidden on mobile, move to settings) */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-9 w-9 text-muted-foreground"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle tema</span>
          </Button>
        )}

        {/* Notifications */}
        <NotificationBell />

        {/* Avatar Dropdown (mobile & desktop) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 flex items-center justify-center rounded-full focus:outline-none select-none hover:opacity-90 active:scale-95 transition-all">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="gradient-primary text-white text-xs font-semibold">
                  {getInitials(
                    (session?.user as { name?: string | null })?.name ||
                      (session?.user as { email?: string | null })?.email ||
                      "U"
                  )}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-1.5 rounded-xl border border-border bg-card text-card-foreground shadow-md">
            <div className="flex items-center gap-2.5 p-2.5 border-b border-border/50">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="gradient-primary text-white text-xs font-semibold">
                  {getInitials(
                    (session?.user as { name?: string | null })?.name ||
                      (session?.user as { email?: string | null })?.email ||
                      "U"
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">
                  {user?.name || "Pengguna"}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <DropdownMenuItem asChild className="gap-2 cursor-pointer mt-1">
              <Link href="/dashboard/pengaturan">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Pengaturan</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ─── Quick Add ────────────────────────────────────────────────
function QuickAddMenu() {
  const QUICK_ACTIONS = [
    {
      label: "Catat Pengeluaran",
      href: "/dashboard/keuangan?modal=expense",
      emoji: "💸",
    },
    {
      label: "Catat Pemasukan",
      href: "/dashboard/keuangan?modal=income",
      emoji: "💰",
    },
    {
      label: "Tambah Belanja",
      href: "/dashboard/belanja?modal=add",
      emoji: "🛒",
    },
    {
      label: "Tambah Agenda",
      href: "/dashboard/agenda?modal=add",
      emoji: "📅",
    },
    {
      label: "Tambah Stok",
      href: "/dashboard/stok-dapur?modal=add",
      emoji: "📦",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          className="h-9 w-9 gradient-primary text-white shadow-soft-sm hover:shadow-soft"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Tambah cepat</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {QUICK_ACTIONS.map((action) => (
          <DropdownMenuItem key={action.href} asChild>
            <Link href={action.href} className="flex items-center gap-3">
              <span className="text-lg">{action.emoji}</span>
              <span className="text-sm">{action.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Notification Bell ────────────────────────────────────────
function NotificationBell() {
  const [unreadCount] = useState(3); // TODO: fetch from API
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const MOCK_NOTIFS = [
    {
      id: "1",
      title: "Tagihan PLN",
      message: "Tagihan PLN jatuh tempo dalam 3 hari",
      type: "BILL_REMINDER",
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      isRead: false,
    },
    {
      id: "2",
      title: "Stok Beras Menipis",
      message: "Beras tersisa 2 kg, sudah di bawah minimum",
      type: "LOW_STOCK",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: false,
    },
    {
      id: "3",
      title: "Target Tabungan 50%",
      message: 'Target "Liburan Keluarga" sudah 50%! 🎉',
      type: "SAVING_UPDATE",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isRead: true,
    },
  ];

  const NOTIF_ICON: Record<string, string> = {
    BILL_REMINDER: "🧾",
    LOW_STOCK: "📦",
    SAVING_UPDATE: "🐷",
    BUDGET_WARNING: "⚠️",
    DOCUMENT_EXPIRY: "📄",
    IMMUNIZATION_DUE: "💉",
    CALENDAR_REMINDER: "📅",
    SYSTEM: "🔔",
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifikasi</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm p-0">
        <SheetHeader className="border-b border-border px-4 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-bold">Notifikasi</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary hover:text-primary"
            >
              Tandai semua dibaca
            </Button>
          </div>
        </SheetHeader>
        <div className="divide-y divide-border overflow-y-auto">
          {MOCK_NOTIFS.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">Tidak ada notifikasi</p>
            </div>
          ) : (
            MOCK_NOTIFS.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "flex gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50",
                  !notif.isRead && "bg-primary/5"
                )}
              >
                <span className="text-2xl shrink-0 mt-0.5">
                  {NOTIF_ICON[notif.type] || "🔔"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm leading-tight",
                        !notif.isRead
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground/80"
                      )}
                    >
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {notif.message}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {mounted ? formatRelative(notif.createdAt) : "Beberapa saat yang lalu"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-border p-3">
          <Button variant="outline" className="w-full text-sm" asChild>
            <Link href="/dashboard/notifikasi">Lihat semua</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
