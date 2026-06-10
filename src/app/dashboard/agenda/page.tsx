import type { Metadata } from "next";
import { getCalendarEvents } from "@/actions/modules";
import { AgendaView } from "@/components/agenda/agenda-view";
import { getCurrentMonthYear } from "@/lib/utils";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Agenda Keluarga",
  description: "Sinkronisasikan jadwal kegiatan penting keluarga Anda.",
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { familyId?: string };
  if (!user.familyId) return null;

  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const month = parseInt(searchParams.month || String(currentMonth));
  const year = parseInt(searchParams.year || String(currentYear));

  // Fetch events for the selected month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const events = await getCalendarEvents(startDate, endDate);

  return (
    <AgendaView
      initialEvents={events as any}
      selectedMonth={month}
      selectedYear={year}
    />
  );
}
