import type { Metadata } from "next";
import { getInventory } from "@/actions/modules";
import { InventoryList } from "@/components/inventory/inventory-list";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Stok Dapur",
  description: "Kelola stok persediaan dapur dan logistik keluarga.",
};

export default async function StokDapurPage() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { familyId?: string };
  if (!user.familyId) return null;

  const items = await getInventory();
  
  const serializedItems = items.map(item => ({
    ...item,
    currentStock: Number(item.currentStock),
    minStock: Number(item.minStock),
  }));

  return <InventoryList initialItems={serializedItems as any} />;
}
