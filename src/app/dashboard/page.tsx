import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { formatIDR, formatDate, getCurrentMonthYear } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { UpcomingBills } from "@/components/dashboard/upcoming-bills";
import { SavingGoalsWidget } from "@/components/dashboard/saving-goals-widget";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { LowStockAlert } from "@/components/dashboard/low-stock-alert";
import { TodayAgenda } from "@/components/dashboard/today-agenda";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Bird,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function getDashboardData(familyId: string) {
  const { month, year } = getCurrentMonthYear();
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));

  const [
    incomeAgg,
    expenseAgg,
    recentExpenses,
    budgets,
    bills,
    savingGoals,
    lowStock,
    todayEvents,
  ] = await Promise.all([
    // Total income this month
    db.income.aggregate({
      where: { familyId, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),

    // Total expense this month
    db.expense.aggregate({
      where: { familyId, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),

    // Last 5 transactions
    db.expense.findMany({
      where: { familyId },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 5,
    }),

    // Budgets with spending
    db.budget.findMany({
      where: { familyId, month, year },
      include: { category: true },
    }),

    // Upcoming bills
    db.bill.findMany({
      where: { familyId, isActive: true },
      orderBy: { dueDay: "asc" },
      take: 5,
    }),

    // Saving goals
    db.savingGoal.findMany({
      where: { familyId, isCompleted: false },
      orderBy: { createdAt: "asc" },
      take: 3,
    }),

    // Low stock items
    db.inventory.findMany({
      where: {
        familyId,
        currentStock: { lte: db.inventory.fields.minStock },
      },
      take: 5,
    }),

    // Today's events
    db.calendarEvent.findMany({
      where: {
        familyId,
        startDate: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const totalIncome = Number(incomeAgg._sum.amount ?? 0);
  const totalExpense = Number(expenseAgg._sum.amount ?? 0);
  const balance = totalIncome - totalExpense;

  // Calculate budget usage
  const budgetsWithSpending = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await db.expense.aggregate({
        where: {
          familyId,
          categoryId: budget.categoryId,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      const spentAmount = Number(spent._sum.amount ?? 0);
      const budgetAmount = Number(budget.amount);
      return {
        ...budget,
        spent: spentAmount,
        percentage: budgetAmount > 0 ? Math.min((spentAmount / budgetAmount) * 100, 100) : 0,
        remaining: Math.max(budgetAmount - spentAmount, 0),
      };
    })
  );

  return {
    balance,
    totalIncome,
    totalExpense,
    month,
    year,
    recentExpenses,
    budgets: budgetsWithSpending,
    bills,
    savingGoals: savingGoals.map((g) => ({
      ...g,
      percentage:
        Number(g.targetAmount) > 0
          ? Math.min((Number(g.currentAmount) / Number(g.targetAmount)) * 100, 100)
          : 0,
    })),
    lowStock,
    todayEvents,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { id: string; familyId?: string; name?: string | null };

  if (!user.familyId) return null;

  const data = await getDashboardData(user.familyId);
  const firstName = user.name?.split(" ")[0] || "Bunda";
  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";

  return (
    <div className="space-y-6">
      {/* ─── Greeting ─────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {greeting}, {firstName}! 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {formatDate(new Date(), "EEEE, dd MMMM yyyy")}
        </p>
      </div>

      {/* ─── Balance card ─────────────────────────────────── */}
      <BalanceCard
        balance={data.balance}
        totalIncome={data.totalIncome}
        totalExpense={data.totalExpense}
        month={data.month}
        year={data.year}
      />

      {/* ─── Stat cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="Pemasukan"
          value={formatIDR(data.totalIncome, { compact: true })}
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBg="bg-green-100 dark:bg-green-900/30"
          trend={"+5% vs bulan lalu"}
          trendUp
        />
        <StatCard
          title="Pengeluaran"
          value={formatIDR(data.totalExpense, { compact: true })}
          icon={TrendingDown}
          iconColor="text-red-500"
          iconBg="bg-red-100 dark:bg-red-900/30"
          trend={"-2% vs bulan lalu"}
          trendUp={false}
        />
        <StatCard
          title="Tabungan"
          value={`${data.savingGoals.length} target`}
          icon={Bird}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <StatCard
          title="Anggaran"
          value={`${data.budgets.filter((b) => b.percentage < 80).length}/${data.budgets.length} aman`}
          icon={Wallet}
          iconColor="text-blue-500"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
        />
      </div>

      {/* ─── Main grid ────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left/main column */}
        <div className="space-y-4 lg:col-span-2">
          <BudgetProgress budgets={data.budgets} />
          <RecentTransactions transactions={data.recentExpenses} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <TodayAgenda events={data.todayEvents} />
          <UpcomingBills bills={data.bills} />
          <SavingGoalsWidget goals={data.savingGoals} />
          {data.lowStock.length > 0 && (
            <LowStockAlert items={data.lowStock} />
          )}
        </div>
      </div>
    </div>
  );
}
