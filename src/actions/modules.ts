"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import type { ActionResult } from "@/types";

async function requireFamily() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = session.user as { id: string; familyId?: string };
  if (!user.familyId) throw new Error("No family");
  return { userId: user.id, familyId: user.familyId };
}

// ============================================================
// BILLS
// ============================================================

export async function getBills() {
  const { familyId } = await requireFamily();
  return db.bill.findMany({
    where: { familyId, isActive: true },
    include: {
      payments: { orderBy: { paidAt: "desc" }, take: 1 },
    },
    orderBy: { dueDay: "asc" },
  });
}

export async function createBill(data: {
  name: string; amount: number; dueDay: number;
  category?: string; reminderDays?: number; notes?: string;
}): Promise<ActionResult> {
  try {
    if (!data.name || data.amount <= 0 || data.dueDay < 1 || data.dueDay > 31) return { success: false, error: "Data tagihan tidak valid." };
    const { familyId } = await requireFamily();
    await db.bill.create({ data: { ...data, familyId } });
    revalidatePath("/dashboard/tagihan");
    revalidatePath("/dashboard");
    return { success: true };
  } catch { return { success: false, error: "Gagal menyimpan tagihan." }; }
}

export async function payBill(billId: string, amount: number): Promise<ActionResult> {
  try {
    const { familyId } = await requireFamily();
    const bill = await db.bill.findFirst({ where: { id: billId, familyId } });
    if (!bill) return { success: false, error: "Tagihan tidak ditemukan." };

    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), bill.dueDay);

    await db.billPayment.create({
      data: { billId, amount, paidAt: today, dueDate, status: "PAID" },
    });
    revalidatePath("/dashboard/tagihan");
    revalidatePath("/dashboard");
    return { success: true };
  } catch { return { success: false, error: "Gagal mencatat pembayaran." }; }
}

export async function deleteBill(id: string): Promise<ActionResult> {
  try {
    const { familyId } = await requireFamily();
    await db.bill.updateMany({ where: { id, familyId }, data: { isActive: false } });
    revalidatePath("/dashboard/tagihan");
    return { success: true };
  } catch { return { success: false, error: "Gagal menghapus tagihan." }; }
}

// ============================================================
// SAVINGS
// ============================================================

export async function getSavingGoals() {
  const { familyId } = await requireFamily();
  return db.savingGoal.findMany({
    where: { familyId },
    include: { contributions: { orderBy: { date: "desc" }, take: 5 } },
    orderBy: { createdAt: "asc" },
  });
}

export async function createSavingGoal(data: {
  name: string; targetAmount: number; targetDate?: string;
  description?: string; icon?: string; color?: string;
}): Promise<ActionResult> {
  try {
    if (!data.name || data.targetAmount <= 0) return { success: false, error: "Data tabungan tidak valid." };
    const { familyId } = await requireFamily();
    await db.savingGoal.create({
      data: {
        familyId,
        name: data.name,
        targetAmount: data.targetAmount,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        description: data.description,
        icon: data.icon,
        color: data.color,
      },
    });
    revalidatePath("/dashboard/tabungan");
    revalidatePath("/dashboard");
    return { success: true };
  } catch { return { success: false, error: "Gagal membuat target tabungan." }; }
}

export async function addSavingContribution(
  goalId: string, amount: number, note?: string
): Promise<ActionResult> {
  try {
    if (amount <= 0) return { success: false, error: "Nominal harus lebih dari 0." };
    const { familyId } = await requireFamily();
    const goal = await db.savingGoal.findFirst({ where: { id: goalId, familyId } });
    if (!goal) return { success: false, error: "Target tidak ditemukan." };

    const newAmount = Number(goal.currentAmount) + amount;
    const isCompleted = newAmount >= Number(goal.targetAmount);

    await db.$transaction(async (tx) => {
      await tx.savingContribution.create({
        data: { savingGoalId: goalId, amount, note, date: new Date() },
      });
      await tx.savingGoal.update({
        where: { id: goalId },
        data: { currentAmount: newAmount, isCompleted, completedAt: isCompleted ? new Date() : null },
      });
    });

    if (isCompleted) {
      await db.notification.create({
        data: {
          familyId,
          title: "🎉 Target Tabungan Tercapai!",
          message: `Selamat! Target tabungan "${goal.name}" telah tercapai!`,
          type: "SAVING_UPDATE",
          link: "/dashboard/tabungan",
        },
      });
    }

    revalidatePath("/dashboard/tabungan");
    revalidatePath("/dashboard");
    return { success: true };
  } catch { return { success: false, error: "Gagal menambah tabungan." }; }
}

// ============================================================
// INVENTORY (Stok Dapur)
// ============================================================

export async function getInventory() {
  const { familyId } = await requireFamily();
  return db.inventory.findMany({
    where: { familyId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function createInventoryItem(data: {
  name: string; category?: string; unit?: string;
  currentStock?: number; minStock?: number; location?: string;
}): Promise<ActionResult> {
  try {
    if (!data.name) return { success: false, error: "Nama item wajib diisi." };
    const { familyId } = await requireFamily();
    await db.inventory.create({
      data: { familyId, ...data, currentStock: data.currentStock || 0, minStock: data.minStock || 0 },
    });
    revalidatePath("/dashboard/stok-dapur");
    return { success: true };
  } catch { return { success: false, error: "Gagal menambah item stok." }; }
}

export async function updateInventoryStock(
  itemId: string, type: "IN" | "OUT" | "ADJUSTMENT", quantity: number, note?: string
): Promise<ActionResult> {
  try {
    if (quantity < 0) return { success: false, error: "Jumlah tidak valid." };
    const { familyId } = await requireFamily();
    const item = await db.inventory.findFirst({ where: { id: itemId, familyId } });
    if (!item) return { success: false, error: "Item tidak ditemukan." };

    let newStock = Number(item.currentStock);
    if (type === "IN") newStock += quantity;
    else if (type === "OUT") newStock = Math.max(0, newStock - quantity);
    else newStock = quantity;

    await db.$transaction(async (tx) => {
      await tx.inventory.update({ where: { id: itemId }, data: { currentStock: newStock } });
      await tx.inventoryTransaction.create({
        data: { inventoryId: itemId, type, quantity, note },
      });
    });

    if (newStock <= Number(item.minStock)) {
      const existing = await db.notification.findFirst({
        where: { familyId, type: "LOW_STOCK",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          metadata: { path: ["itemId"], equals: itemId } },
      });
      if (!existing) {
        await db.notification.create({
          data: {
            familyId,
            title: "📦 Stok Menipis",
            message: `Stok ${item.name} tersisa ${newStock} ${item.unit || "pcs"}, sudah di bawah minimum.`,
            type: "LOW_STOCK",
            link: "/dashboard/stok-dapur",
            metadata: { itemId },
          },
        });
      }
    }

    revalidatePath("/dashboard/stok-dapur");
    revalidatePath("/dashboard");
    return { success: true };
  } catch { return { success: false, error: "Gagal memperbarui stok." }; }
}

// ============================================================
// SHOPPING LIST
// ============================================================

export async function getShoppingLists() {
  const { familyId } = await requireFamily();
  return db.shoppingList.findMany({
    where: { familyId, isActive: true },
    include: {
      items: { orderBy: [{ priority: "asc" }, { isChecked: "asc" }] },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createShoppingList(name: string): Promise<ActionResult<{ id: string }>> {
  try {
    if (!name || name.length > 100) return { success: false, error: "Nama daftar tidak valid." };
    const { familyId } = await requireFamily();
    const list = await db.shoppingList.create({ data: { familyId, name } });
    revalidatePath("/dashboard/belanja");
    return { success: true, data: { id: list.id } };
  } catch { return { success: false, error: "Gagal membuat daftar belanja." }; }
}

export async function addShoppingItem(
  listId: string,
  data: { name: string; quantity?: number; unit?: string; priority?: "HIGH"|"MEDIUM"|"LOW"; category?: string; note?: string }
): Promise<ActionResult> {
  try {
    if (!data.name) return { success: false, error: "Nama item wajib diisi." };
    const { familyId } = await requireFamily();
    const list = await db.shoppingList.findFirst({ where: { id: listId, familyId } });
    if (!list) return { success: false, error: "Daftar tidak ditemukan." };

    await db.shoppingItem.create({
      data: { shoppingListId: listId, ...data, priority: data.priority || "MEDIUM" },
    });
    revalidatePath("/dashboard/belanja");
    return { success: true };
  } catch { return { success: false, error: "Gagal menambah item." }; }
}

export async function toggleShoppingItem(itemId: string, checked: boolean): Promise<ActionResult> {
  try {
    const { familyId } = await requireFamily();
    const item = await db.shoppingItem.findFirst({
      where: { id: itemId, shoppingList: { familyId } },
    });
    if (!item) return { success: false, error: "Item tidak ditemukan." };

    await db.shoppingItem.update({ where: { id: itemId }, data: { isChecked: checked } });
    revalidatePath("/dashboard/belanja");
    return { success: true };
  } catch { return { success: false, error: "Gagal memperbarui item." }; }
}

export async function generateShoppingFromLowStock(): Promise<ActionResult<{ count: number }>> {
  try {
    const { familyId } = await requireFamily();

    const lowStockItems = await db.inventory.findMany({
      where: { familyId, currentStock: { lte: db.inventory.fields.minStock } },
    });

    if (lowStockItems.length === 0) {
      return { success: true, data: { count: 0 } };
    }

    const list = await db.shoppingList.create({
      data: { familyId, name: `Belanja dari Stok Menipis - ${new Date().toLocaleDateString("id-ID")}` },
    });

    await db.shoppingItem.createMany({
      data: lowStockItems.map((item) => ({
        shoppingListId: list.id,
        inventoryId: item.id,
        name: item.name,
        unit: item.unit || undefined,
        priority: "HIGH" as const,
        category: item.category || undefined,
      })),
    });

    revalidatePath("/dashboard/belanja");
    return { success: true, data: { count: lowStockItems.length } };
  } catch { return { success: false, error: "Gagal generate daftar belanja." }; }
}

// ============================================================
// CALENDAR
// ============================================================

export async function getCalendarEvents(startDate: Date, endDate: Date) {
  const { familyId } = await requireFamily();
  return db.calendarEvent.findMany({
    where: { familyId, startDate: { gte: startDate, lte: endDate } },
    orderBy: { startDate: "asc" },
  });
}

export async function createCalendarEvent(data: {
  title: string; description?: string; startDate: string; endDate?: string;
  allDay?: boolean; category?: string; color?: string; reminderMinutes?: number;
}): Promise<ActionResult> {
  try {
    if (!data.title || !data.startDate) return { success: false, error: "Judul dan tanggal mulai wajib diisi." };
    const { familyId } = await requireFamily();
    await db.calendarEvent.create({
      data: {
        familyId,
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        allDay: data.allDay || false,
        category: (data.category as "GENERAL") || "GENERAL",
        color: data.color,
        reminderMinutes: data.reminderMinutes,
      },
    });
    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard");
    return { success: true };
  } catch { return { success: false, error: "Gagal membuat agenda." }; }
}

export async function deleteCalendarEvent(id: string): Promise<ActionResult> {
  try {
    const { familyId } = await requireFamily();
    await db.calendarEvent.deleteMany({ where: { id, familyId } });
    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch { return { success: false, error: "Gagal menghapus agenda." }; }
}

// ============================================================
// CHILDREN
// ============================================================

export async function getChildren() {
  const { familyId } = await requireFamily();
  return db.child.findMany({
    where: { familyId },
    include: {
      immunizations: { orderBy: { nextDue: "asc" } },
      growthRecords: { orderBy: { date: "desc" }, take: 1 },
      _count: { select: { activities: true } },
    },
    orderBy: { birthDate: "asc" },
  });
}

export async function createChild(data: {
  name: string; birthDate: string; gender?: "MALE"|"FEMALE";
  schoolName?: string; grade?: string; notes?: string;
}): Promise<ActionResult> {
  try {
    if (!data.name || !data.birthDate) return { success: false, error: "Nama dan tanggal lahir wajib diisi." };
    const { familyId } = await requireFamily();
    await db.child.create({
      data: { familyId, ...data, birthDate: new Date(data.birthDate) },
    });
    revalidatePath("/dashboard/anak");
    return { success: true };
  } catch { return { success: false, error: "Gagal menambah data anak." }; }
}

export async function addGrowthRecord(
  childId: string,
  data: { date: string; height?: number; weight?: number; headCircumference?: number; note?: string }
): Promise<ActionResult> {
  try {
    if (!data.date) return { success: false, error: "Tanggal wajib diisi." };
    const { familyId } = await requireFamily();
    const child = await db.child.findFirst({ where: { id: childId, familyId } });
    if (!child) return { success: false, error: "Data anak tidak ditemukan." };

    const { date, ...rest } = data;
    await db.growthRecord.create({
      data: { childId, date: new Date(date), ...rest },
    });
    revalidatePath("/dashboard/anak");
    return { success: true };
  } catch { return { success: false, error: "Gagal menambah data pertumbuhan." }; }
}

export async function addImmunization(
  childId: string,
  data: { name: string; date?: string; nextDue?: string; status: "PENDING" | "DONE" | "SKIPPED"; location?: string; note?: string }
): Promise<ActionResult> {
  try {
    if (!data.name) return { success: false, error: "Nama imunisasi wajib diisi." };
    const { familyId } = await requireFamily();
    const child = await db.child.findFirst({ where: { id: childId, familyId } });
    if (!child) return { success: false, error: "Data anak tidak ditemukan." };

    await db.immunization.create({
      data: {
        childId,
        name: data.name,
        date: data.date ? new Date(data.date) : null,
        nextDue: data.nextDue ? new Date(data.nextDue) : null,
        status: data.status,
        location: data.location,
        note: data.note,
      },
    });
    revalidatePath("/dashboard/anak");
    return { success: true };
  } catch { return { success: false, error: "Gagal menambah data imunisasi." }; }
}

export async function updateImmunizationStatus(
  id: string,
  status: "PENDING" | "DONE" | "SKIPPED",
  date?: string
): Promise<ActionResult> {
  try {
    const { familyId } = await requireFamily();
    // Validate child belongs to family
    const immun = await db.immunization.findFirst({
      where: { id, child: { familyId } },
    });
    if (!immun) return { success: false, error: "Data imunisasi tidak ditemukan." };

    await db.immunization.update({
      where: { id },
      data: {
        status,
        date: date ? new Date(date) : status === "DONE" ? new Date() : undefined,
      },
    });
    revalidatePath("/dashboard/anak");
    return { success: true };
  } catch { return { success: false, error: "Gagal memperbarui status imunisasi." }; }
}

// ============================================================
// DOCUMENTS
// ============================================================

export async function getDocuments() {
  const { familyId } = await requireFamily();
  return db.document.findMany({
    where: { familyId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function createDocument(data: {
  name: string; category: string; fileUrl: string;
  fileSize?: number; mimeType?: string; expiryDate?: string; description?: string;
}): Promise<ActionResult> {
  try {
    if (!data.name || !data.category || !data.fileUrl || (!data.fileUrl.startsWith('http') && !data.fileUrl.startsWith('/'))) return { success: false, error: "Data dokumen tidak valid." };
    const { familyId } = await requireFamily();
    await db.document.create({
      data: {
        familyId,
        name: data.name,
        category: data.category as "KTP",
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        description: data.description,
      },
    });

    // Warn if expiring soon
    if (data.expiryDate) {
      const expiry = new Date(data.expiryDate);
      const daysUntilExpiry = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 30) {
        await db.notification.create({
          data: {
            familyId,
            title: "📄 Dokumen Akan Kadaluarsa",
            message: `Dokumen "${data.name}" akan kadaluarsa dalam ${daysUntilExpiry} hari.`,
            type: "DOCUMENT_EXPIRY",
            link: "/dashboard/dokumen",
          },
        });
      }
    }

    revalidatePath("/dashboard/dokumen");
    return { success: true };
  } catch { return { success: false, error: "Gagal menyimpan dokumen." }; }
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  try {
    const { familyId } = await requireFamily();
    await db.document.deleteMany({ where: { id, familyId } });
    revalidatePath("/dashboard/dokumen");
    return { success: true };
  } catch { return { success: false, error: "Gagal menghapus dokumen." }; }
}

// ============================================================
// EMERGENCY FUND
// ============================================================

export async function getEmergencyFund() {
  const { familyId } = await requireFamily();
  return db.emergencyFund.findUnique({
    where: { familyId },
  });
}

export async function updateEmergencyFund(data: {
  targetMonths: number;
  currentAmount: number;
}): Promise<ActionResult> {
  try {
    if (data.targetMonths <= 0 || data.currentAmount < 0) return { success: false, error: "Data dana darurat tidak valid." };
    const { familyId } = await requireFamily();
    await db.emergencyFund.upsert({
      where: { familyId },
      update: { targetMonths: data.targetMonths, currentAmount: data.currentAmount },
      create: { familyId, targetMonths: data.targetMonths, currentAmount: data.currentAmount },
    });
    revalidatePath("/dashboard/dana-darurat");
    revalidatePath("/dashboard");
    return { success: true };
  } catch { return { success: false, error: "Gagal memperbarui dana darurat." }; }
}

// ============================================================
// DEBTS & RECEIVABLES
// ============================================================

export async function getDebts() {
  const { familyId } = await requireFamily();
  return db.debt.findMany({
    where: { familyId },
    include: { payments: { orderBy: { paidAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createDebt(data: {
  creditor: string;
  amount: number;
  dueDate?: string;
  description?: string;
}): Promise<ActionResult> {
  try {
    if (!data.creditor || data.amount <= 0) return { success: false, error: "Data hutang tidak valid." };
    const { familyId } = await requireFamily();
    await db.debt.create({
      data: {
        familyId,
        creditor: data.creditor,
        amount: data.amount,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        description: data.description,
      },
    });
    revalidatePath("/dashboard/hutang-piutang");
    return { success: true };
  } catch { return { success: false, error: "Gagal menambah data hutang." }; }
}

export async function payDebt(
  debtId: string,
  amount: number,
  note?: string
): Promise<ActionResult> {
  try {
    const { familyId } = await requireFamily();
    const debt = await db.debt.findFirst({ where: { id: debtId, familyId } });
    if (!debt) return { success: false, error: "Data hutang tidak ditemukan." };

    const newPaidAmount = Number(debt.paidAmount) + amount;
    const isSettled = newPaidAmount >= Number(debt.amount);

    await db.$transaction(async (tx) => {
      await tx.debtPayment.create({
        data: { debtId, amount, paidAt: new Date(), note },
      });
      await tx.debt.update({
        where: { id: debtId },
        data: { paidAmount: newPaidAmount, isSettled, settledAt: isSettled ? new Date() : null },
      });
    });

    revalidatePath("/dashboard/hutang-piutang");
    return { success: true };
  } catch { return { success: false, error: "Gagal membayar hutang." }; }
}

export async function getReceivables() {
  const { familyId } = await requireFamily();
  return db.receivable.findMany({
    where: { familyId },
    include: { payments: { orderBy: { paidAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createReceivable(data: {
  debtor: string;
  amount: number;
  dueDate?: string;
  description?: string;
}): Promise<ActionResult> {
  try {
    if (!data.debtor || data.amount <= 0) return { success: false, error: "Data piutang tidak valid." };
    const { familyId } = await requireFamily();
    await db.receivable.create({
      data: {
        familyId,
        debtor: data.debtor,
        amount: data.amount,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        description: data.description,
      },
    });
    revalidatePath("/dashboard/hutang-piutang");
    return { success: true };
  } catch { return { success: false, error: "Gagal menambah data piutang." }; }
}

export async function collectReceivable(
  receivableId: string,
  amount: number,
  note?: string
): Promise<ActionResult> {
  try {
    const { familyId } = await requireFamily();
    const rec = await db.receivable.findFirst({ where: { id: receivableId, familyId } });
    if (!rec) return { success: false, error: "Data piutang tidak ditemukan." };

    const newPaidAmount = Number(rec.paidAmount) + amount;
    const isSettled = newPaidAmount >= Number(rec.amount);

    await db.$transaction(async (tx) => {
      await tx.receivablePayment.create({
        data: { receivableId, amount, paidAt: new Date(), note },
      });
      await tx.receivable.update({
        where: { id: receivableId },
        data: { paidAmount: newPaidAmount, isSettled, settledAt: isSettled ? new Date() : null },
      });
    });

    revalidatePath("/dashboard/hutang-piutang");
    return { success: true };
  } catch { return { success: false, error: "Gagal mencatat penagihan piutang." }; }
}

// ============================================================
// MEAL PLANNER
// ============================================================

export async function getMealPlans(weekStart: Date) {
  const { familyId } = await requireFamily();
  return db.mealPlan.findFirst({
    where: { familyId, weekStart },
    include: { items: true },
  });
}

export async function saveMealPlanItem(data: {
  weekStart: string;
  date: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  menuName: string;
  recipe?: string;
  notes?: string;
}): Promise<ActionResult> {
  try {
    if (!data.weekStart || !data.date || !data.menuName) return { success: false, error: "Data menu makan tidak valid." };
    const { familyId } = await requireFamily();
    const ws = new Date(data.weekStart);
    
    // Find or create meal plan for this week
    let mealPlan = await db.mealPlan.findFirst({
      where: { familyId, weekStart: ws },
    });

    if (!mealPlan) {
      mealPlan = await db.mealPlan.create({
        data: { familyId, weekStart: ws },
      });
    }

    // Upsert meal plan item
    const itemDate = new Date(data.date);
    const existingItem = await db.mealPlanItem.findFirst({
      where: { mealPlanId: mealPlan.id, date: itemDate, mealType: data.mealType },
    });

    if (existingItem) {
      await db.mealPlanItem.update({
        where: { id: existingItem.id },
        data: { menuName: data.menuName, recipe: data.recipe, notes: data.notes },
      });
    } else {
      await db.mealPlanItem.create({
        data: {
          mealPlanId: mealPlan.id,
          date: itemDate,
          mealType: data.mealType,
          menuName: data.menuName,
          recipe: data.recipe,
          notes: data.notes,
        },
      });
    }

    revalidatePath("/dashboard/meal-planner");
    return { success: true };
  } catch { return { success: false, error: "Gagal menyimpan menu makan." }; }
}
