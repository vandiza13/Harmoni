import type { Metadata } from "next";
import { getSavingGoals } from "@/actions/modules";
import { SavingGoalsList } from "@/components/savings/saving-goals-list";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Tabungan Keluarga",
  description: "Kelola rencana tabungan dan impian keluarga Anda.",
};

export default async function TabunganPage() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { familyId?: string };
  if (!user.familyId) return null;

  const goals = await getSavingGoals();
  
  const serializedGoals = goals.map(g => ({
    ...g,
    targetAmount: Number(g.targetAmount),
    currentAmount: Number(g.currentAmount),
    contributions: g.contributions.map(c => ({
      ...c,
      amount: Number(c.amount),
    })),
  }));

  return <SavingGoalsList initialGoals={serializedGoals as any} />;
}
