// ============================================================
// Dashboard Widgets (combined file)
// ============================================================

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Package } from "lucide-react";
import { formatIDR, formatDate, formatRelative, calcPercent } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── UpcomingBills ────────────────────────────────────────────
interface Bill {
  id: string;
  name: string;
  amount: unknown;
  dueDay: number;
  category?: string | null;
}

export function UpcomingBills({ bills }: { bills: Bill[] }) {
  const today = new Date().getDate();

  return (
    <div className="card-harmoni p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Tagihan Mendatang</h3>
        <Link
          href="/dashboard/tagihan"
          className="text-xs text-primary font-medium flex items-center gap-1"
        >
          Lihat semua <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {bills.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Tidak ada tagihan mendatang 🎉
        </p>
      ) : (
        <div className="space-y-2">
          {bills.slice(0, 4).map((bill) => {
            const daysLeft = bill.dueDay >= today ? bill.dueDay - today : 30 - today + bill.dueDay;
            const isUrgent = daysLeft <= 3;
            const isDueSoon = daysLeft <= 7;

            return (
              <div
                key={bill.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm",
                      isUrgent
                        ? "bg-red-100 dark:bg-red-900/30"
                        : isDueSoon
                        ? "bg-amber-100 dark:bg-amber-900/30"
                        : "bg-muted"
                    )}
                  >
                    🧾
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {bill.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Tgl {bill.dueDay} setiap bulan
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="currency-display text-sm font-semibold text-foreground">
                    {formatIDR(Number(bill.amount), { compact: true })}
                  </p>
                  <Badge
                    variant={isUrgent ? "destructive" : "secondary"}
                    className="text-[10px] h-4 mt-0.5"
                  >
                    {daysLeft === 0 ? "Hari ini!" : `${daysLeft}h lagi`}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SavingGoalsWidget ────────────────────────────────────────
interface SavingGoal {
  id: string;
  name: string;
  targetAmount: unknown;
  currentAmount: unknown;
  percentage: number;
  icon?: string | null;
  color?: string | null;
}

export function SavingGoalsWidget({ goals }: { goals: SavingGoal[] }) {
  return (
    <div className="card-harmoni p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Target Tabungan</h3>
        <Link
          href="/dashboard/tabungan"
          className="text-xs text-primary font-medium flex items-center gap-1"
        >
          Lihat semua <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {goals.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-2xl mb-1">🐷</p>
          <p className="text-sm text-muted-foreground">Belum ada target tabungan</p>
          <Link
            href="/dashboard/tabungan"
            className="mt-1 inline-block text-xs text-primary font-medium"
          >
            Buat target sekarang →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <div key={goal.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">
                    {goal.icon || "🎯"}
                  </span>
                  <span className="text-sm font-medium text-foreground truncate">
                    {goal.name}
                  </span>
                </div>
                <span className="text-xs font-semibold text-primary shrink-0">
                  {Math.round(goal.percentage)}%
                </span>
              </div>
              <Progress
                value={goal.percentage}
                className="h-1.5 [&>div]:bg-primary"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>
                  {formatIDR(Number(goal.currentAmount), { compact: true })}
                </span>
                <span>
                  {formatIDR(Number(goal.targetAmount), { compact: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── RecentTransactions ───────────────────────────────────────
interface Transaction {
  id: string;
  amount: unknown;
  description: string | null;
  date: Date;
  category?: { name: string; icon?: string | null } | null;
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="card-harmoni p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Transaksi Terakhir</h3>
        <Link
          href="/dashboard/keuangan"
          className="text-xs text-primary font-medium flex items-center gap-1"
        >
          Lihat semua <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Belum ada transaksi
        </p>
      ) : (
        <div className="space-y-1">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30 text-base">
                {tx.category?.icon || "💸"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {tx.description}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {tx.category?.name || "Lainnya"} · {formatRelative(tx.date)}
                </p>
              </div>
              <p className="currency-display text-sm font-semibold text-red-500 shrink-0">
                -{formatIDR(Number(tx.amount), { compact: true })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LowStockAlert ────────────────────────────────────────────
interface InventoryItem {
  id: string;
  name: string;
  currentStock: unknown;
  minStock: unknown;
  unit?: string | null;
}

export function LowStockAlert({ items }: { items: InventoryItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="card-harmoni p-4 border-amber-200 dark:border-amber-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold text-foreground">Stok Menipis</h3>
          <Badge variant="secondary" className="badge-warning h-5 text-[10px]">
            {items.length}
          </Badge>
        </div>
        <Link
          href="/dashboard/stok-dapur"
          className="text-xs text-primary font-medium flex items-center gap-1"
        >
          Kelola <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {items.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2"
          >
            <p className="text-sm font-medium text-foreground truncate">
              {item.name}
            </p>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold shrink-0">
              {Number(item.currentStock)} {item.unit || "pcs"} sisa
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/dashboard/belanja?from=lowstock"
        className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-200 transition-colors"
      >
        Tambah ke daftar belanja <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ─── TodayAgenda ──────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  allDay: boolean;
  category: string;
  color?: string | null;
}

const EVENT_EMOJI: Record<string, string> = {
  GENERAL: "📌",
  SCHOOL: "🏫",
  HEALTH: "🏥",
  BIRTHDAY: "🎂",
  APPOINTMENT: "📋",
  HOLIDAY: "🏖",
  OTHER: "📅",
};

export function TodayAgenda({ events }: { events: CalendarEvent[] }) {
  return (
    <div className="card-harmoni p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Agenda Hari Ini</h3>
        <Link
          href="/dashboard/agenda"
          className="text-xs text-primary font-medium flex items-center gap-1"
        >
          Kalender <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="flex items-center gap-2 py-3 text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <p className="text-sm">Tidak ada agenda hari ini</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-2"
            >
              <span className="text-lg shrink-0">
                {EVENT_EMOJI[event.category] || "📅"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {event.title}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {event.allDay
                      ? "Sepanjang hari"
                      : formatDate(event.startDate, "HH:mm")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
