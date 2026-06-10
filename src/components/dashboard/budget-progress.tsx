import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { formatIDR, calcPercent } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BudgetItem {
  id: string;
  amount: unknown;
  spent: number;
  percentage: number;
  remaining: number;
  category: { name: string; icon?: string | null; color?: string | null };
}

interface BudgetProgressProps {
  budgets: BudgetItem[];
}

export function BudgetProgress({ budgets }: BudgetProgressProps) {
  if (budgets.length === 0) {
    return (
      <div className="card-harmoni p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Anggaran Bulan Ini</h3>
          <Link
            href="/dashboard/anggaran"
            className="text-xs text-primary font-medium flex items-center gap-1"
          >
            Atur anggaran <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex flex-col items-center py-6 text-center text-muted-foreground">
          <span className="text-3xl mb-2">📊</span>
          <p className="text-sm">Belum ada anggaran bulan ini</p>
          <Link
            href="/dashboard/anggaran"
            className="mt-2 text-xs text-primary font-medium"
          >
            Mulai buat anggaran →
          </Link>
        </div>
      </div>
    );
  }

  const overBudget = budgets.filter((b) => b.percentage >= 100);

  return (
    <div className="card-harmoni p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Anggaran Bulan Ini</h3>
        <Link
          href="/dashboard/anggaran"
          className="text-xs text-primary font-medium flex items-center gap-1"
        >
          Lihat semua <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {overBudget.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {overBudget.length} kategori melebihi anggaran bulan ini
          </span>
        </div>
      )}

      <div className="space-y-3">
        {budgets.slice(0, 5).map((budget) => {
          const isOver = budget.percentage >= 100;
          const isWarning = budget.percentage >= 80 && budget.percentage < 100;

          return (
            <div key={budget.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {budget.category.icon || "📦"}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {budget.category.name}
                  </span>
                  {isOver && (
                    <span className="badge-error rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                      Melebihi!
                    </span>
                  )}
                  {isWarning && (
                    <span className="badge-warning rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                      Hampir!
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold tabular-nums",
                    isOver
                      ? "text-red-500"
                      : isWarning
                      ? "text-amber-500"
                      : "text-muted-foreground"
                  )}
                >
                  {Math.round(budget.percentage)}%
                </span>
              </div>
              <Progress
                value={budget.percentage}
                className={cn(
                  "h-1.5",
                  isOver
                    ? "[&>div]:bg-red-500"
                    : isWarning
                    ? "[&>div]:bg-amber-500"
                    : "[&>div]:bg-primary"
                )}
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{formatIDR(budget.spent, { compact: true })} terpakai</span>
                <span>
                  {isOver
                    ? `Rp ${formatIDR(budget.spent - Number(budget.amount), { compact: true })} lebih`
                    : `${formatIDR(budget.remaining, { compact: true })} sisa`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
