import type { Metadata } from "next";
import { getChildren } from "@/actions/modules";
import { ChildrenDashboard } from "@/components/children/children-dashboard";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Tumbuh Kembang Anak",
  description: "Pantau kesehatan dan tumbuh kembang anak-anak Anda.",
};

export default async function AnakPage() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { familyId?: string };
  if (!user.familyId) return null;

  const children = await getChildren();

  // Serialize Decimal objects inside growthRecords to numbers/null
  const serializedChildren = children.map(child => ({
    ...child,
    growthRecords: child.growthRecords.map(record => ({
      ...record,
      height: record.height ? Number(record.height) : null,
      weight: record.weight ? Number(record.weight) : null,
      headCircumference: record.headCircumference ? Number(record.headCircumference) : null,
    })),
  }));

  return <ChildrenDashboard initialChildren={serializedChildren as any} />;
}
