import type { Metadata } from "next";
import { getBills } from "@/actions/modules";
import { BillsList } from "@/components/bills/bills-list";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Tagihan Keluarga",
  description: "Kelola pengingat tagihan rutin keluarga Anda.",
};

export default async function TagihanPage() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { familyId?: string };
  if (!user.familyId) return null;

  const bills = await getBills();

  // Convert Prisma Decimal objects to plain numbers for the Client Component
  const serializedBills = bills.map((bill) => ({
    ...bill,
    amount: Number(bill.amount),
    payments: bill.payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    })),
  }));

  return <BillsList initialBills={serializedBills} />;
}
