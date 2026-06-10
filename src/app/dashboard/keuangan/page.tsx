import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getTransactions, getFinanceSummary, getExpenseByCategory } from "@/actions/finance";
import { getCurrentMonthYear, formatIDR, formatMonth } from "@/lib/utils";
import { TransactionList } from "@/components/finance/transaction-list";
import { ExpensePieChart } from "@/components/finance/expense-pie-chart";
import { MonthSelector } from "@/components/shared/month-selector";
import { AddTransactionFAB } from "@/components/finance/add-transaction-fab";

export const metadata: Metadata = { title: "Keuangan Keluarga" };

export default async function KeuanganPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string; type?: string };
}) {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const month = parseInt(searchParams.month || String(currentMonth));
  const year = parseInt(searchParams.year || String(currentYear));
  const type = (searchParams.type as "income" | "expense") || undefined;

  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { familyId?: string };
  if (!user.familyId) return null;

  const [summary, transactions, categoryBreakdown] = await Promise.all([
    getFinanceSummary(month, year),
    getTransactions({ type, month, year }),
    getExpenseByCategory(month, year),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">💰 Keuangan</h2>
          <p className="text-sm text-muted-foreground">{formatMonth(month, year)}</p>
        </div>
        <MonthSelector month={month} year={year} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-harmoni p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pemasukan</p>
          <p className="currency-display text-base font-bold text-green-600">
            {formatIDR(summary.totalIncome, { compact: true })}
          </p>
        </div>
        <div className="card-harmoni p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pengeluaran</p>
          <p className="currency-display text-base font-bold text-red-500">
            {formatIDR(summary.totalExpense, { compact: true })}
          </p>
        </div>
        <div className="card-harmoni p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Saldo</p>
          <p className={`currency-display text-base font-bold ${summary.balance >= 0 ? "text-primary" : "text-red-500"}`}>
            {formatIDR(summary.balance, { compact: true })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ExpensePieChart data={categoryBreakdown} total={summary.totalExpense} />
        <TransactionList
          transactions={transactions.data}
          total={transactions.total}
          type={type}
        />
      </div>

      <AddTransactionFAB />
    </div>
  );
}
