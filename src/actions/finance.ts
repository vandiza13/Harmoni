"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validations";
import type { ActionResult } from "@/types";

// ─── Helper: get authed session + familyId ────────────────────
async function requireFamily() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = session.user as { id: string; familyId?: string };
  if (!user.familyId) throw new Error("No family found");

  return { userId: user.id, familyId: user.familyId };
}

// ─── Get summary for dashboard ────────────────────────────────
export async function getFinanceSummary(month: number, year: number) {
  const { familyId } = await requireFamily();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const [incomes, expenses] = await Promise.all([
    db.income.aggregate({
      where: { familyId, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
    db.expense.aggregate({
      where: { familyId, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = Number(incomes._sum.amount ?? 0);
  const totalExpense = Number(expenses._sum.amount ?? 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    month,
    year,
  };
}

// ─── Get transactions (paginated) ────────────────────────────
export async function getTransactions({
  type,
  month,
  year,
  categoryId,
  page = 1,
  limit = 20,
}: {
  type?: "income" | "expense";
  month?: number;
  year?: number;
  categoryId?: string;
  page?: number;
  limit?: number;
}) {
  const { familyId } = await requireFamily();

  const where: Record<string, unknown> = { familyId };

  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    where.date = { gte: startDate, lte: endDate };
  }

  if (categoryId) where.categoryId = categoryId;

  const skip = (page - 1) * limit;

  if (!type || type === "expense") {
    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        include: { category: true },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      db.expense.count({ where }),
    ]);

    if (type === "expense") {
      return {
        data: expenses.map((e) => ({ ...e, type: "expense" as const, amount: Number(e.amount) })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }
  }

  if (!type || type === "income") {
    const [incomes, total] = await Promise.all([
      db.income.findMany({
        where,
        include: { category: true },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      db.income.count({ where }),
    ]);

    if (type === "income") {
      return {
        data: incomes.map((i) => ({ ...i, type: "income" as const, amount: Number(i.amount) })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }
  }

  // Combined — fetch both and merge
  const [expenses, incomes] = await Promise.all([
    db.expense.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    db.income.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const combined = [
    ...expenses.map((e) => ({ ...e, type: "expense" as const, amount: Number(e.amount) })),
    ...incomes.map((i) => ({ ...i, type: "income" as const, amount: Number(i.amount) })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const total = combined.length;
  const paginated = combined.slice(skip, skip + limit);

  return {
    data: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Create Income ────────────────────────────────────────────
export async function createIncome(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId, familyId } = await requireFamily();

    const raw = {
      amount: formData.get("amount") as string,
      description: formData.get("description") as string,
      date: formData.get("date") as string,
      categoryId: formData.get("categoryId") as string | undefined,
      notes: formData.get("notes") as string | undefined,
    };

    const parsed = transactionSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const income = await db.income.create({
      data: {
        familyId,
        categoryId: parsed.data.categoryId || null,
        amount: parseFloat(parsed.data.amount),
        description: parsed.data.description,
        date: new Date(parsed.data.date),
        notes: parsed.data.notes,
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        familyId,
        userId,
        action: "CREATE",
        entity: "Income",
        entityId: income.id,
        details: { amount: income.amount, description: income.description },
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/keuangan");

    return { success: true, data: { id: income.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menyimpan pemasukan",
    };
  }
}

// ─── Create Expense ───────────────────────────────────────────
export async function createExpense(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId, familyId } = await requireFamily();

    const raw = {
      amount: formData.get("amount") as string,
      description: formData.get("description") as string,
      date: formData.get("date") as string,
      categoryId: formData.get("categoryId") as string | undefined,
      notes: formData.get("notes") as string | undefined,
    };

    const parsed = transactionSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const expense = await db.expense.create({
      data: {
        familyId,
        categoryId: parsed.data.categoryId || null,
        amount: parseFloat(parsed.data.amount),
        description: parsed.data.description,
        date: new Date(parsed.data.date),
        notes: parsed.data.notes,
      },
    });

    // Budget warning check
    if (parsed.data.categoryId) {
      await checkBudgetWarning(familyId, parsed.data.categoryId, new Date(parsed.data.date));
    }

    await db.activityLog.create({
      data: {
        familyId,
        userId,
        action: "CREATE",
        entity: "Expense",
        entityId: expense.id,
        details: { amount: expense.amount, description: expense.description },
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/keuangan");
    revalidatePath("/dashboard/anggaran");

    return { success: true, data: { id: expense.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menyimpan pengeluaran",
    };
  }
}

// ─── Update Expense ───────────────────────────────────────────
export async function updateExpense(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { familyId } = await requireFamily();

    const raw = {
      amount: formData.get("amount") as string,
      description: formData.get("description") as string,
      date: formData.get("date") as string,
      categoryId: formData.get("categoryId") as string | undefined,
    };

    const parsed = transactionSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    await db.expense.updateMany({
      where: { id, familyId },
      data: {
        amount: parseFloat(parsed.data.amount),
        description: parsed.data.description,
        date: new Date(parsed.data.date),
        categoryId: parsed.data.categoryId || null,
      },
    });

    revalidatePath("/dashboard/keuangan");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui",
    };
  }
}

// ─── Delete Transaction ───────────────────────────────────────
export async function deleteTransaction(
  id: string,
  type: "income" | "expense"
): Promise<ActionResult> {
  try {
    const { familyId } = await requireFamily();

    if (type === "expense") {
      await db.expense.deleteMany({ where: { id, familyId } });
    } else {
      await db.income.deleteMany({ where: { id, familyId } });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/keuangan");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus",
    };
  }
}

// ─── Get expense by category for charts ──────────────────────
export async function getExpenseByCategory(month: number, year: number) {
  const { familyId } = await requireFamily();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const expenses = await db.expense.groupBy({
    by: ["categoryId"],
    where: { familyId, date: { gte: startDate, lte: endDate } },
    _sum: { amount: true },
  });

  const categoryIds = expenses
    .map((e) => e.categoryId)
    .filter(Boolean) as string[];

  const categories = await db.category.findMany({
    where: { id: { in: categoryIds } },
  });

  return expenses.map((e) => {
    const cat = categories.find((c) => c.id === e.categoryId);
    return {
      categoryId: e.categoryId,
      categoryName: cat?.name || "Lainnya",
      color: cat?.color || "#9E9E9E",
      icon: cat?.icon || "📦",
      amount: Number(e._sum.amount ?? 0),
    };
  });
}

// ─── Private: check budget warning ───────────────────────────
async function checkBudgetWarning(
  familyId: string,
  categoryId: string,
  date: Date
) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const budget = await db.budget.findFirst({
    where: { familyId, categoryId, month, year },
  });

  if (!budget) return;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const spent = await db.expense.aggregate({
    where: { familyId, categoryId, date: { gte: startDate, lte: endDate } },
    _sum: { amount: true },
  });

  const totalSpent = Number(spent._sum.amount ?? 0);
  const budgetAmount = Number(budget.amount);
  const percentage = (totalSpent / budgetAmount) * 100;

  // Create warning at 80% and 100%
  if (percentage >= 80) {
    const category = await db.category.findUnique({ where: { id: categoryId } });
    const type = percentage >= 100 ? "melebihi" : "mendekati";
    const message =
      percentage >= 100
        ? `Pengeluaran ${category?.name} telah melebihi anggaran bulan ini!`
        : `Pengeluaran ${category?.name} telah mencapai ${Math.round(percentage)}% anggaran bulan ini.`;

    // Check if notification already sent
    const existingNotif = await db.notification.findFirst({
      where: {
        familyId,
        type: "BUDGET_WARNING",
        createdAt: { gte: startDate },
        metadata: { path: ["categoryId"], equals: categoryId },
      },
    });

    if (!existingNotif) {
      await db.notification.create({
        data: {
          familyId,
          title: `⚠️ Peringatan Anggaran`,
          message,
          type: "BUDGET_WARNING",
          link: "/dashboard/anggaran",
          metadata: { categoryId, percentage: Math.round(percentage), type },
        },
      });
    }
  }
}
