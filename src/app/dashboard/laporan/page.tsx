import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getFinanceSummary, getExpenseByCategory, getTransactions } from "@/actions/finance";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";

export const metadata: Metadata = {
  title: "Laporan Keuangan",
  description: "Visualisasi ringkasan laporan keuangan keluarga Anda.",
};

export default async function LaporanPage() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { familyId?: string; familyName?: string };
  if (!user.familyId) return null;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [summary, categories, transactions] = await Promise.all([
    getFinanceSummary(currentMonth, currentYear),
    getExpenseByCategory(currentMonth, currentYear),
    getTransactions({ month: currentMonth, year: currentYear, limit: 1000 }),
  ]);

  return (
    <ReportsDashboard
      initialSummary={summary}
      initialCategories={categories}
      initialTransactions={transactions.data}
      familyName={user.familyName || "Keluarga"}
    />
  );
}
