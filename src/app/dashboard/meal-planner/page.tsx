import type { Metadata } from "next";
import { getMealPlans } from "@/actions/modules";
import { MealPlannerView } from "@/components/meals/meal-planner-view";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Meal Planner",
  description: "Rencanakan menu makan keluarga Anda secara mingguan.",
};

export default async function MealPlannerPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { familyId?: string };
  if (!user.familyId) return null;

  // Determine weekStart date (Monday)
  let weekStart: Date;
  if (searchParams.week) {
    weekStart = new Date(searchParams.week);
  } else {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    weekStart = new Date(today.setDate(diff));
  }
  weekStart.setHours(0, 0, 0, 0);

  const plan = await getMealPlans(weekStart);

  return (
    <MealPlannerView
      initialPlan={plan as any}
      selectedWeekStart={weekStart.toISOString()}
    />
  );
}
