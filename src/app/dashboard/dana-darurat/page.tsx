import type { Metadata } from "next";
import { getEmergencyFund } from "@/actions/modules";
import { EmergencyFundView } from "@/components/finance/emergency-fund-view";
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dana Darurat",
  description: "Kelola jaring pengaman keuangan keluarga Anda.",
};

export default async function DanaDaruratPage() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { familyId?: string };
  if (!user.familyId) return null;

  const fund = await getEmergencyFund();

  // Compute actual monthly expense for average estimation
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  const monthExpenses = await db.expense.aggregate({
    where: { familyId: user.familyId, date: { gte: startOfMonth, lte: endOfMonth } },
    _sum: { amount: true },
  });

  const avgMonthlyExpense = Number(monthExpenses._sum.amount ?? 0);

  // Serialize Decimal
  const serializedFund = fund
    ? {
        ...fund,
        currentAmount: Number(fund.currentAmount),
      }
    : null;

  return (
    <EmergencyFundView
      fund={serializedFund as any}
      avgMonthlyExpense={avgMonthlyExpense}
    />
  );
}
