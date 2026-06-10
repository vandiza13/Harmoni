import type { Metadata } from "next";
import { getShoppingLists } from "@/actions/modules";
import { ShoppingLists } from "@/components/shopping/shopping-lists";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Daftar Belanja",
  description: "Rencanakan dan kelola daftar belanja keluarga Anda.",
};

export default async function BelanjaPage() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { familyId?: string };
  if (!user.familyId) return null;

  const lists = await getShoppingLists();
  
  const serializedLists = lists.map(list => ({
    ...list,
    items: list.items.map(item => ({
      ...item,
      quantity: item.quantity ? Number(item.quantity) : null,
      price: item.price ? Number(item.price) : null,
    })),
  }));

  return <ShoppingLists initialLists={serializedLists as any} />;
}
