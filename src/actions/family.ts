"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { createFamilySchema, type CreateFamilyInput } from "@/lib/validations";
import { z } from "zod";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user as { id: string; familyId?: string };
}

// ─── Create Family ────────────────────────────────────────────
export async function createFamily(
  data: CreateFamilyInput
): Promise<ActionResult<{ familyId: string }>> {
  try {
    const parsed = createFamilySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Data yang dimasukkan tidak valid." };
    }

    const user = await requireUser();

    const family = await db.$transaction(async (tx) => {
      const { nanoid } = await import("nanoid");
      const code = nanoid(8).toUpperCase();

      const newFamily = await tx.family.create({
        data: {
          name: data.name,
          description: data.description,
          ownerId: user.id,
          inviteCode: code,
        },
      });

      await tx.familyMember.create({
        data: {
          familyId: newFamily.id,
          userId: user.id,
          role: "OWNER",
        },
      });

      // Seed default categories
      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((cat) => ({
          ...cat,
          familyId: newFamily.id,
          isSystem: true,
        })),
      });

      // Seed default bills
      await tx.bill.createMany({
        data: DEFAULT_BILLS.map((bill) => ({
          ...bill,
          familyId: newFamily.id,
        })),
      });

      return newFamily;
    });

    revalidatePath("/dashboard");
    return { success: true, data: { familyId: family.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat keluarga",
    };
  }
}

// ─── Join Family ──────────────────────────────────────────────
export async function joinFamily(
  inviteCode: string
): Promise<ActionResult<{ familyId: string }>> {
  try {
    const user = await requireUser();

    const family = await db.family.findFirst({
      where: { inviteCode: inviteCode.toUpperCase() },
    });

    if (!family) {
      return { success: false, error: "Kode undangan tidak valid." };
    }

    const existing = await db.familyMember.findUnique({
      where: { familyId_userId: { familyId: family.id, userId: user.id } },
    });

    if (existing) {
      return { success: false, error: "Kamu sudah tergabung di keluarga ini." };
    }

    await db.familyMember.create({
      data: {
        familyId: family.id,
        userId: user.id,
        role: "MEMBER",
      },
    });

    revalidatePath("/dashboard");
    return { success: true, data: { familyId: family.id } };
  } catch {
    return { success: false, error: "Gagal bergabung ke keluarga." };
  }
}

// ─── Get family details ───────────────────────────────────────
export async function getFamilyDetails() {
  const user = await requireUser();
  if (!user.familyId) return null;

  return db.family.findUnique({
    where: { id: user.familyId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { joinedAt: "asc" },
      },
      owner: { select: { id: true, name: true, email: true } },
    },
  });
}

// ─── Regenerate invite code ───────────────────────────────────
export async function regenerateInviteCode(): Promise<ActionResult<{ code: string }>> {
  try {
    const user = await requireUser();
    if (!user.familyId) throw new Error("No family");

    const { nanoid } = await import("nanoid");
    const newCode = nanoid(8).toUpperCase();

    await db.family.update({
      where: { id: user.familyId, ownerId: user.id },
      data: { inviteCode: newCode },
    });

    revalidatePath("/dashboard/keluarga");
    return { success: true, data: { code: newCode } };
  } catch {
    return { success: false, error: "Gagal memperbarui kode undangan." };
  }
}

// ─── Remove member ────────────────────────────────────────────
export async function removeFamilyMember(memberId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    if (!user.familyId) throw new Error("No family");

    // Only owner/admin can remove
    const myRole = await db.familyMember.findUnique({
      where: { familyId_userId: { familyId: user.familyId, userId: user.id } },
    });

    if (!myRole || !["OWNER", "ADMIN"].includes(myRole.role)) {
      return { success: false, error: "Tidak ada izin untuk menghapus anggota." };
    }

    const memberToRemove = await db.familyMember.findUnique({
      where: { familyId_userId: { familyId: user.familyId, userId: memberId } },
    });

    if (!memberToRemove) {
      return { success: false, error: "Anggota tidak ditemukan." };
    }

    if (memberToRemove.role === "OWNER") {
      return { success: false, error: "Tidak bisa menghapus owner keluarga." };
    }

    await db.familyMember.delete({
      where: { familyId_userId: { familyId: user.familyId, userId: memberId } },
    });

    revalidatePath("/dashboard/keluarga");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus anggota." };
  }
}

// ─── Default seed data ────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  // Income
  { name: "Gaji", icon: "💼", color: "#4CAF50", type: "INCOME" as const },
  { name: "Bonus", icon: "🎁", color: "#81C784", type: "INCOME" as const },
  { name: "THR", icon: "🎊", color: "#AED581", type: "INCOME" as const },
  { name: "Bisnis", icon: "🏪", color: "#66BB6A", type: "INCOME" as const },
  { name: "Investasi", icon: "📈", color: "#43A047", type: "INCOME" as const },
  { name: "Pemasukan Lain", icon: "💰", color: "#2E7D32", type: "INCOME" as const },

  // Expense
  { name: "Belanja Dapur", icon: "🛒", color: "#FF8A65", type: "EXPENSE" as const },
  { name: "Makanan", icon: "🍽", color: "#FF7043", type: "EXPENSE" as const },
  { name: "Transportasi", icon: "🚗", color: "#42A5F5", type: "EXPENSE" as const },
  { name: "Pendidikan", icon: "📚", color: "#AB47BC", type: "EXPENSE" as const },
  { name: "Kesehatan", icon: "🏥", color: "#EC407A", type: "EXPENSE" as const },
  { name: "Listrik", icon: "⚡", color: "#FFB300", type: "EXPENSE" as const },
  { name: "Air", icon: "💧", color: "#29B6F6", type: "EXPENSE" as const },
  { name: "Internet", icon: "📱", color: "#26C6DA", type: "EXPENSE" as const },
  { name: "Hiburan", icon: "🎬", color: "#EF5350", type: "EXPENSE" as const },
  { name: "Pakaian", icon: "👗", color: "#F06292", type: "EXPENSE" as const },
  { name: "Pengeluaran Lain", icon: "📦", color: "#9E9E9E", type: "EXPENSE" as const },
];

const DEFAULT_BILLS = [
  { name: "Listrik PLN", amount: 300000, dueDay: 20, category: "Listrik", reminderDays: 3 },
  { name: "Air PDAM", amount: 100000, dueDay: 15, category: "Air", reminderDays: 3 },
  { name: "Internet", amount: 250000, dueDay: 5, category: "Internet", reminderDays: 3 },
  { name: "BPJS Kesehatan", amount: 150000, dueDay: 10, category: "Kesehatan", reminderDays: 5 },
];

// ─── Update User Profile ──────────────────────────────────────
export async function updateUserProfile(name: string): Promise<ActionResult> {
  try {
    const parsed = z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama terlalu panjang").safeParse(name);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const user = await requireUser();
    await db.user.update({
      where: { id: user.id },
      data: { name: parsed.data },
    });
    revalidatePath("/dashboard/pengaturan");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Gagal memperbarui profil." };
  }
}

// ─── Update Family Details ────────────────────────────────────
export async function updateFamilyProfile(
  name: string,
  description?: string
): Promise<ActionResult> {
  try {
    const parsed = createFamilySchema.safeParse({ name, description });
    if (!parsed.success) return { success: false, error: "Data yang dimasukkan tidak valid." };

    const user = await requireUser();
    if (!user.familyId) throw new Error("No family");

    const myRole = await db.familyMember.findUnique({
      where: { familyId_userId: { familyId: user.familyId, userId: user.id } },
    });

    if (!myRole || !["OWNER", "ADMIN"].includes(myRole.role)) {
      return { success: false, error: "Tidak ada izin untuk mengubah informasi keluarga." };
    }

    await db.family.update({
      where: { id: user.familyId },
      data: { name: parsed.data.name, description: parsed.data.description },
    });

    revalidatePath("/dashboard/pengaturan");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Gagal memperbarui informasi keluarga." };
  }
}
