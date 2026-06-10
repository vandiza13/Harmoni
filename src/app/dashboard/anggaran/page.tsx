import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { getCurrentMonthYear, formatIDR, formatMonth } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Anggaran Bulanan" };

export default async function AnggaranPage() {
  const { month, year } = getCurrentMonthYear();
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { familyId?: string };
  if (!user.familyId) return null;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const budgets = await db.budget.findMany({
    where: { familyId: user.familyId, month, year },
    include: { category: true },
  });

  const budgetsWithSpending = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await db.expense.aggregate({
        where: { familyId: user.familyId!, categoryId: budget.categoryId, date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      });
      const spentAmount = Number(spent._sum.amount ?? 0);
      const budgetAmount = Number(budget.amount);
      return { ...budget, spent: spentAmount, percentage: budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0 };
    })
  );

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpent = budgetsWithSpending.reduce((sum, b) => sum + b.spent, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">📊 Anggaran</h2>
          <p className="text-sm text-muted-foreground">{formatMonth(month, year)}</p>
        </div>
        <Button size="sm" className="gradient-primary text-white gap-1.5">
          <Plus className="h-4 w-4" /> Atur Anggaran
        </Button>
      </div>

      {/* Total progress */}
      <div className="card-harmoni p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-semibold">Total Anggaran</span>
          <span className="text-muted-foreground">{formatIDR(totalSpent, { compact: true })} / {formatIDR(totalBudget, { compact: true })}</span>
        </div>
        <Progress value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0} className="h-2" />
      </div>

      {/* Per-category */}
      <div className="space-y-3">
        {budgetsWithSpending.length === 0 ? (
          <div className="card-harmoni p-8 text-center text-muted-foreground">
            <p className="text-3xl mb-2">📊</p>
            <p>Belum ada anggaran bulan ini</p>
          </div>
        ) : (
          budgetsWithSpending.map((budget) => {
            const isOver = budget.percentage >= 100;
            const isWarn = budget.percentage >= 80;
            return (
              <div key={budget.id} className="card-harmoni p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{budget.category.icon || "📦"}</span>
                    <span className="font-medium">{budget.category.name}</span>
                  </div>
                  <span className={cn("text-sm font-bold", isOver ? "text-red-500" : isWarn ? "text-amber-500" : "text-muted-foreground")}>
                    {Math.round(budget.percentage)}%
                  </span>
                </div>
                <Progress value={Math.min(budget.percentage, 100)}
                  className={cn("h-2", isOver ? "[&>div]:bg-red-500" : isWarn ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary")} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Terpakai: {formatIDR(budget.spent)}</span>
                  <span>Anggaran: {formatIDR(Number(budget.amount))}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
