import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Demo user ───────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("Demo1234!", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@harmoni.app" },
    update: {},
    create: {
      name: "Sari Dewi",
      email: "demo@harmoni.app",
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  console.log("✅ User created:", user.email);

  // ─── Admin developer user ─────────────────────────────────
  const adminPassword = await bcrypt.hash("Azura@2025", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@vandiza.com" },
    update: {
      password: adminPassword,
      role: "SUPERADMIN",
    },
    create: {
      name: "Vandiza Admin",
      email: "admin@vandiza.com",
      password: adminPassword,
      role: "SUPERADMIN",
      emailVerified: new Date(),
    },
  });

  console.log("✅ Admin user created:", adminUser.email);

  // ─── Family ──────────────────────────────────────────────
  const existing = await prisma.familyMember.findFirst({
    where: { userId: user.id },
    include: { family: true },
  });

  let familyId: string;

  if (existing) {
    familyId = existing.familyId;
    console.log("✅ Using existing family:", existing.family.name);
  } else {
    const family = await prisma.family.create({
      data: {
        name: "Keluarga Dewi",
        description: "Keluarga bahagia yang terorganisir",
        ownerId: user.id,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
      },
    });
    familyId = family.id;
    console.log("✅ Family created:", family.name);
  }

  // Link admin user to family if not already linked
  const adminMember = await prisma.familyMember.findUnique({
    where: {
      familyId_userId: {
        familyId,
        userId: adminUser.id,
      },
    },
  });

  if (!adminMember) {
    await prisma.familyMember.create({
      data: {
        familyId,
        userId: adminUser.id,
        role: "ADMIN",
      },
    });
    console.log("✅ Admin user linked to Family as ADMIN");
  }

  // ─── Clean up existing data for this family to prevent foreign key violations during re-seed ───
  await prisma.income.deleteMany({ where: { familyId } });
  await prisma.expense.deleteMany({ where: { familyId } });
  await prisma.budget.deleteMany({ where: { familyId } });
  await prisma.bill.deleteMany({ where: { familyId } });
  await prisma.savingGoal.deleteMany({ where: { familyId } });
  await prisma.emergencyFund.deleteMany({ where: { familyId } });
  await prisma.debt.deleteMany({ where: { familyId } });
  await prisma.receivable.deleteMany({ where: { familyId } });
  await prisma.inventory.deleteMany({ where: { familyId } });
  await prisma.shoppingList.deleteMany({ where: { familyId } });
  await prisma.mealPlan.deleteMany({ where: { familyId } });
  await prisma.calendarEvent.deleteMany({ where: { familyId } });
  await prisma.child.deleteMany({ where: { familyId } });
  await prisma.document.deleteMany({ where: { familyId } });
  await prisma.notification.deleteMany({ where: { familyId } });
  await prisma.category.deleteMany({ where: { familyId } });

  const categories = await prisma.category.createManyAndReturn({
    data: [
      { familyId, name: "Gaji", icon: "💼", color: "#4CAF50", type: "INCOME", isSystem: true },
      { familyId, name: "Bonus", icon: "🎁", color: "#81C784", type: "INCOME", isSystem: true },
      { familyId, name: "THR", icon: "🎊", color: "#AED581", type: "INCOME", isSystem: true },
      { familyId, name: "Pemasukan Lain", icon: "💰", color: "#2E7D32", type: "INCOME", isSystem: true },
      { familyId, name: "Belanja Dapur", icon: "🛒", color: "#FF8A65", type: "EXPENSE", isSystem: true },
      { familyId, name: "Makanan", icon: "🍽", color: "#FF7043", type: "EXPENSE", isSystem: true },
      { familyId, name: "Transportasi", icon: "🚗", color: "#42A5F5", type: "EXPENSE", isSystem: true },
      { familyId, name: "Pendidikan", icon: "📚", color: "#AB47BC", type: "EXPENSE", isSystem: true },
      { familyId, name: "Kesehatan", icon: "🏥", color: "#EC407A", type: "EXPENSE", isSystem: true },
      { familyId, name: "Listrik", icon: "⚡", color: "#FFB300", type: "EXPENSE", isSystem: true },
      { familyId, name: "Air", icon: "💧", color: "#29B6F6", type: "EXPENSE", isSystem: true },
      { familyId, name: "Internet", icon: "📱", color: "#26C6DA", type: "EXPENSE", isSystem: true },
      { familyId, name: "Hiburan", icon: "🎬", color: "#EF5350", type: "EXPENSE", isSystem: true },
      { familyId, name: "Pakaian", icon: "👗", color: "#F06292", type: "EXPENSE", isSystem: true },
      { familyId, name: "Pengeluaran Lain", icon: "📦", color: "#9E9E9E", type: "EXPENSE", isSystem: true },
    ],
  });

  const catMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));
  console.log("✅ Categories created:", categories.length);

  // ─── Income (last 3 months) ───────────────────────────────
  const now = new Date();
  const incomeData = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    incomeData.push(
      { familyId, categoryId: catMap["Gaji"], amount: 8500000, description: "Gaji bulanan", date: new Date(d.getFullYear(), d.getMonth(), 1) },
      { familyId, categoryId: catMap["Gaji"], amount: 6000000, description: "Gaji suami", date: new Date(d.getFullYear(), d.getMonth(), 1) },
    );
    if (i === 0) {
      incomeData.push({ familyId, categoryId: catMap["Bonus"], amount: 2000000, description: "Bonus kinerja Q4", date: new Date(d.getFullYear(), d.getMonth(), 15) });
    }
  }
  await prisma.income.createMany({ data: incomeData });
  console.log("✅ Incomes created:", incomeData.length);

  // ─── Expenses (this month) ────────────────────────────────
  const expenseData = [
    { familyId, categoryId: catMap["Belanja Dapur"], amount: 850000, description: "Belanja mingguan", date: new Date(now.getFullYear(), now.getMonth(), 3) },
    { familyId, categoryId: catMap["Makanan"], amount: 120000, description: "Makan siang keluarga", date: new Date(now.getFullYear(), now.getMonth(), 5) },
    { familyId, categoryId: catMap["Transportasi"], amount: 350000, description: "Bensin mobil", date: new Date(now.getFullYear(), now.getMonth(), 7) },
    { familyId, categoryId: catMap["Pendidikan"], amount: 500000, description: "Les piano anak", date: new Date(now.getFullYear(), now.getMonth(), 8) },
    { familyId, categoryId: catMap["Kesehatan"], amount: 250000, description: "Periksa dokter anak", date: new Date(now.getFullYear(), now.getMonth(), 10) },
    { familyId, categoryId: catMap["Belanja Dapur"], amount: 620000, description: "Belanja bulanan Indomaret", date: new Date(now.getFullYear(), now.getMonth(), 12) },
    { familyId, categoryId: catMap["Hiburan"], amount: 180000, description: "Nonton bioskop", date: new Date(now.getFullYear(), now.getMonth(), 14) },
  ];
  await prisma.expense.createMany({ data: expenseData });
  console.log("✅ Expenses created:", expenseData.length);

  // ─── Budgets ──────────────────────────────────────────────
  const budgetData = [
    { familyId, categoryId: catMap["Belanja Dapur"], amount: 2000000, month: now.getMonth() + 1, year: now.getFullYear() },
    { familyId, categoryId: catMap["Transportasi"], amount: 800000, month: now.getMonth() + 1, year: now.getFullYear() },
    { familyId, categoryId: catMap["Makanan"], amount: 600000, month: now.getMonth() + 1, year: now.getFullYear() },
    { familyId, categoryId: catMap["Pendidikan"], amount: 1000000, month: now.getMonth() + 1, year: now.getFullYear() },
    { familyId, categoryId: catMap["Hiburan"], amount: 300000, month: now.getMonth() + 1, year: now.getFullYear() },
    { familyId, categoryId: catMap["Kesehatan"], amount: 500000, month: now.getMonth() + 1, year: now.getFullYear() },
  ];
  await prisma.budget.createMany({ data: budgetData });
  console.log("✅ Budgets created:", budgetData.length);

  // ─── Bills ────────────────────────────────────────────────
  const bills = await prisma.bill.createManyAndReturn({
    data: [
      { familyId, name: "Listrik PLN", amount: 450000, dueDay: 20, category: "Listrik", reminderDays: 3 },
      { familyId, name: "Air PDAM", amount: 120000, dueDay: 15, category: "Air", reminderDays: 3 },
      { familyId, name: "Internet IndiHome", amount: 350000, dueDay: 5, category: "Internet", reminderDays: 3 },
      { familyId, name: "BPJS Kesehatan", amount: 225000, dueDay: 10, category: "Kesehatan", reminderDays: 5 },
      { familyId, name: "Netflix", amount: 54000, dueDay: 22, category: "Hiburan", reminderDays: 2 },
    ],
  });
  console.log("✅ Bills created:", bills.length);

  // ─── Saving Goals ────────────────────────────────────────
  await prisma.savingGoal.createMany({
    data: [
      { familyId, name: "Liburan ke Bali", targetAmount: 15000000, currentAmount: 7500000, icon: "✈️", color: "#29B6F6", targetDate: new Date(now.getFullYear() + 1, 5, 1) },
      { familyId, name: "Biaya Masuk SD Anak", targetAmount: 25000000, currentAmount: 12000000, icon: "🏫", color: "#AB47BC", targetDate: new Date(now.getFullYear() + 1, 5, 15) },
      { familyId, name: "Renovasi Dapur", targetAmount: 30000000, currentAmount: 5000000, icon: "🏠", color: "#FF8A65", targetDate: new Date(now.getFullYear() + 1, 11, 1) },
    ],
  });
  console.log("✅ Saving goals created");

  // ─── Emergency Fund ────────────────────────────────────────
  await prisma.emergencyFund.upsert({
    where: { familyId },
    update: {},
    create: { familyId, targetMonths: 6, currentAmount: 18000000 },
  });

  // ─── Inventory ────────────────────────────────────────────
  await prisma.inventory.createMany({
    data: [
      { familyId, name: "Beras", category: "Karbohidrat", unit: "kg", currentStock: 8, minStock: 5 },
      { familyId, name: "Minyak Goreng", category: "Minyak", unit: "liter", currentStock: 1.5, minStock: 2 },
      { familyId, name: "Gula Pasir", category: "Bumbu", unit: "kg", currentStock: 0.8, minStock: 1 },
      { familyId, name: "Telur", category: "Protein", unit: "butir", currentStock: 12, minStock: 10 },
      { familyId, name: "Tepung Terigu", category: "Karbohidrat", unit: "kg", currentStock: 2, minStock: 1 },
      { familyId, name: "Garam", category: "Bumbu", unit: "kg", currentStock: 0.5, minStock: 0.3 },
      { familyId, name: "Kecap Manis", category: "Bumbu", unit: "botol", currentStock: 2, minStock: 1 },
      { familyId, name: "Sabun Cuci Piring", category: "Kebersihan", unit: "botol", currentStock: 1, minStock: 2 },
    ],
  });
  console.log("✅ Inventory created");

  // ─── Shopping List ────────────────────────────────────────
  const shoppingList = await prisma.shoppingList.create({
    data: { familyId, name: "Belanja Minggu Ini" },
  });
  await prisma.shoppingItem.createMany({
    data: [
      { shoppingListId: shoppingList.id, name: "Minyak Goreng 2L", quantity: 2, unit: "liter", priority: "HIGH", category: "Minyak" },
      { shoppingListId: shoppingList.id, name: "Gula Pasir", quantity: 1, unit: "kg", priority: "HIGH", category: "Bumbu" },
      { shoppingListId: shoppingList.id, name: "Sabun Cuci Piring", quantity: 2, unit: "botol", priority: "MEDIUM", category: "Kebersihan" },
      { shoppingListId: shoppingList.id, name: "Susu UHT", quantity: 6, unit: "kotak", priority: "MEDIUM" },
      { shoppingListId: shoppingList.id, name: "Sayuran segar", priority: "LOW" },
    ],
  });
  console.log("✅ Shopping list created");

  // ─── Calendar Events ──────────────────────────────────────
  await prisma.calendarEvent.createMany({
    data: [
      { familyId, title: "Kontrol anak ke dokter", startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 9, 0), category: "HEALTH", color: "#EC407A" },
      { familyId, title: "Ulang tahun nenek", startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5), allDay: true, category: "BIRTHDAY", color: "#FF7043" },
      { familyId, title: "Rapat wali murid", startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 14, 0), category: "SCHOOL", color: "#AB47BC" },
      { familyId, title: "Arisan RT", startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 19, 0), category: "GENERAL", color: "#4CAF50" },
    ],
  });
  console.log("✅ Calendar events created");

  // ─── Children ────────────────────────────────────────────
  const child = await prisma.child.create({
    data: {
      familyId,
      name: "Adi Nugroho",
      birthDate: new Date(now.getFullYear() - 7, 3, 15),
      gender: "MALE",
      schoolName: "SD Budi Utama",
      grade: "Kelas 2",
    },
  });

  await prisma.immunization.createMany({
    data: [
      { childId: child.id, name: "BCG", status: "DONE", date: new Date(child.birthDate.getFullYear(), child.birthDate.getMonth() + 1, 1) },
      { childId: child.id, name: "Polio 1", status: "DONE", date: new Date(child.birthDate.getFullYear(), child.birthDate.getMonth() + 1, 1) },
      { childId: child.id, name: "DPT-HB-Hib 1", status: "DONE", date: new Date(child.birthDate.getFullYear(), child.birthDate.getMonth() + 2, 1) },
      { childId: child.id, name: "Campak", status: "PENDING", nextDue: new Date(now.getFullYear(), now.getMonth() + 2, 1) },
    ],
  });

  await prisma.growthRecord.createMany({
    data: [
      { childId: child.id, date: new Date(now.getFullYear(), now.getMonth() - 3, 1), height: 118, weight: 22 },
      { childId: child.id, date: new Date(now.getFullYear(), now.getMonth(), 1), height: 120.5, weight: 22.8 },
    ],
  });
  console.log("✅ Child data created");

  // ─── Documents ───────────────────────────────────────────
  await prisma.document.createMany({
    data: [
      { familyId, name: "KTP Ibu", category: "KTP", fileUrl: "https://placehold.co/400x250.png", expiryDate: new Date(now.getFullYear() + 3, 0, 1) },
      { familyId, name: "Kartu Keluarga", category: "KK", fileUrl: "https://placehold.co/400x250.png" },
      { familyId, name: "BPJS Keluarga", category: "BPJS", fileUrl: "https://placehold.co/400x250.png", expiryDate: new Date(now.getFullYear() + 1, 0, 1) },
      { familyId, name: "STNK Mobil", category: "STNK", fileUrl: "https://placehold.co/400x250.png", expiryDate: new Date(now.getFullYear(), now.getMonth() + 3, 1) },
    ],
  });
  console.log("✅ Documents created");

  // ─── Notifications ────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { familyId, title: "Tagihan PLN Mendatang", message: "Tagihan PLN jatuh tempo dalam 3 hari. Segera bayar!", type: "BILL_REMINDER", link: "/dashboard/tagihan" },
      { familyId, title: "🎉 Target 50% Tercapai!", message: 'Tabungan "Liburan ke Bali" sudah 50%! Ayo terus menabung!', type: "SAVING_UPDATE", link: "/dashboard/tabungan" },
      { familyId, title: "Stok Minyak Menipis", message: "Minyak goreng tersisa 1.5L, sudah di bawah minimum (2L).", type: "LOW_STOCK", link: "/dashboard/stok-dapur" },
    ],
  });

  console.log("\n🎉 Seeding selesai!");
  console.log("───────────────────────────");
  console.log("👉 AKUN DEMO KELUARGA:");
  console.log("📧 Email   : demo@harmoni.app");
  console.log("🔑 Password: Demo1234!");
  console.log("───────────────────────────");
  console.log("👉 AKUN DEVELOPER SUPERADMIN:");
  console.log("📧 Email   : admin@vandiza.com");
  console.log("🔑 Password: Azura@2025");
  console.log("───────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
