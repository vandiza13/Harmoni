"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";
import { formatIDR, formatMonth } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  month: number;
  year: number;
}

export function BalanceCard({
  balance,
  totalIncome,
  totalExpense,
  month,
  year,
}: BalanceCardProps) {
  const isPositive = balance >= 0;

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] dark:from-zinc-900/90 dark:to-zinc-950/90 dark:backdrop-blur-xl p-6 text-white shadow-soft-lg dark:shadow-[0_8px_32px_rgba(34,197,94,0.2)] dark:border dark:border-white/10 dark:ring-1 dark:ring-primary/30 transition-all">
      {/* Background decoration */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 dark:bg-primary/20 dark:blur-3xl" />
      <div className="absolute -bottom-6 -right-4 h-28 w-28 rounded-full bg-white/5 dark:bg-primary/10 dark:blur-2xl" />

      <div className="relative">
        {/* Period label */}
        <p className="text-sm font-medium text-white/80">
          Saldo Bulan {formatMonth(month, year)}
        </p>

        {/* Balance */}
        <p
          className={cn(
            "currency-display mt-1 text-3xl font-bold text-white",
            "md:text-4xl"
          )}
        >
          {formatIDR(balance)}
        </p>

        <p className="mt-1 text-xs text-white/70">
          {isPositive ? "✓ Keuangan sehat bulan ini" : "⚠ Pengeluaran melebihi pemasukan"}
        </p>

        {/* Income / Expense row */}
        <div className="mt-5 flex gap-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/15 dark:bg-white/5 px-3 py-2.5 flex-1 dark:border dark:border-white/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 dark:bg-primary/20 dark:text-primary">
              <ArrowUpRight className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-white/70 font-medium">Pemasukan</p>
              <p className="currency-display text-sm font-bold text-white">
                {formatIDR(totalIncome, { compact: true })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/15 dark:bg-white/5 px-3 py-2.5 flex-1 dark:border dark:border-white/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 dark:bg-red-500/20 dark:text-red-400">
              <ArrowDownRight className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-white/70 font-medium">Pengeluaran</p>
              <p className="currency-display text-sm font-bold text-white">
                {formatIDR(totalExpense, { compact: true })}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard/keuangan"
          className="mt-3 flex items-center gap-1 text-xs font-medium text-white/80 hover:text-white transition-colors"
        >
          Lihat detail keuangan
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
