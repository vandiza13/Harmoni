import type { Metadata } from "next";
import { getDebts, getReceivables } from "@/actions/modules";
import { DebtsReceivablesView } from "@/components/finance/debts-receivables-view";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Hutang & Piutang",
  description: "Kelola catatan hutang dan piutang keluarga Anda.",
};

export default async function HutangPiutangPage() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { familyId?: string };
  if (!user.familyId) return null;

  const [debts, receivables] = await Promise.all([
    getDebts(),
    getReceivables(),
  ]);

  // Serialize Decimal objects inside debts to numbers/null
  const serializedDebts = debts.map(d => ({
    ...d,
    amount: Number(d.amount),
    paidAmount: Number(d.paidAmount),
    payments: d.payments.map(p => ({
      ...p,
      amount: Number(p.amount),
    })),
  }));

  // Serialize Decimal objects inside receivables to numbers/null
  const serializedReceivables = receivables.map(r => ({
    ...r,
    amount: Number(r.amount),
    paidAmount: Number(r.paidAmount),
    payments: r.payments.map(p => ({
      ...p,
      amount: Number(p.amount),
    })),
  }));

  return (
    <DebtsReceivablesView
      initialDebts={serializedDebts as any}
      initialReceivables={serializedReceivables as any}
    />
  );
}
