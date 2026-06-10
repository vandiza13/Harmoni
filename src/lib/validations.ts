import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Email tidak valid").toLowerCase(),
  password: z.string().min(1, "Password wajib diisi"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nama minimal 2 karakter")
      .max(100, "Nama terlalu panjang"),
    email: z.string().email("Email tidak valid").toLowerCase(),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password harus mengandung huruf besar, kecil, dan angka"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid").toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password harus mengandung huruf besar, kecil, dan angka"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

// ─── Family ───────────────────────────────────────────────────
export const createFamilySchema = z.object({
  name: z
    .string()
    .min(2, "Nama keluarga minimal 2 karakter")
    .max(100, "Nama keluarga terlalu panjang"),
  description: z.string().max(500).optional(),
});

export const joinFamilySchema = z.object({
  inviteCode: z
    .string()
    .min(1, "Kode undangan wajib diisi")
    .toUpperCase(),
});

// ─── Finance ──────────────────────────────────────────────────
export const transactionSchema = z.object({
  amount: z
    .string()
    .min(1, "Nominal wajib diisi")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Nominal harus lebih dari 0",
    }),
  description: z
    .string()
    .min(1, "Keterangan wajib diisi")
    .max(255, "Keterangan terlalu panjang"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  categoryId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Nama kategori wajib diisi")
    .max(50, "Nama kategori terlalu panjang"),
  icon: z.string().max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Format warna tidak valid")
    .optional(),
  type: z.enum(["INCOME", "EXPENSE", "BOTH"]),
});

// ─── Budget ───────────────────────────────────────────────────
export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Pilih kategori"),
  amount: z
    .string()
    .min(1, "Nominal wajib diisi")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Nominal harus lebih dari 0",
    }),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
});

// ─── Bill ────────────────────────────────────────────────────
export const billSchema = z.object({
  name: z.string().min(1, "Nama tagihan wajib diisi").max(100),
  amount: z
    .string()
    .min(1, "Nominal wajib diisi")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Nominal harus lebih dari 0",
    }),
  dueDay: z
    .number()
    .min(1, "Minimal tanggal 1")
    .max(31, "Maksimal tanggal 31"),
  category: z.string().optional(),
  reminderDays: z.number().min(0).max(30).default(3),
  notes: z.string().max(500).optional(),
});

// ─── Saving Goal ──────────────────────────────────────────────
export const savingGoalSchema = z.object({
  name: z.string().min(1, "Nama target wajib diisi").max(100),
  targetAmount: z
    .string()
    .min(1, "Target nominal wajib diisi")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Target harus lebih dari 0",
    }),
  targetDate: z.string().optional(),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const savingContributionSchema = z.object({
  amount: z
    .string()
    .min(1, "Nominal wajib diisi")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Nominal harus lebih dari 0",
    }),
  note: z.string().max(255).optional(),
  date: z.string().min(1, "Tanggal wajib diisi"),
});

// ─── Debt / Receivable ────────────────────────────────────────
export const debtSchema = z.object({
  creditor: z.string().min(1, "Nama pemberi pinjaman wajib diisi").max(100),
  amount: z
    .string()
    .min(1, "Nominal wajib diisi")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Nominal harus lebih dari 0",
    }),
  dueDate: z.string().optional(),
  description: z.string().max(500).optional(),
});

export const receivableSchema = z.object({
  debtor: z.string().min(1, "Nama peminjam wajib diisi").max(100),
  amount: z
    .string()
    .min(1, "Nominal wajib diisi")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Nominal harus lebih dari 0",
    }),
  dueDate: z.string().optional(),
  description: z.string().max(500).optional(),
});

// ─── Inventory ────────────────────────────────────────────────
export const inventorySchema = z.object({
  name: z.string().min(1, "Nama item wajib diisi").max(100),
  category: z.string().max(50).optional(),
  unit: z.string().max(20).optional(),
  currentStock: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Stok tidak valid",
    })
    .default("0"),
  minStock: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Stok minimum tidak valid",
    })
    .default("0"),
  location: z.string().max(100).optional(),
});

export const inventoryTransactionSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  quantity: z
    .string()
    .min(1, "Jumlah wajib diisi")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Jumlah harus lebih dari 0",
    }),
  note: z.string().max(255).optional(),
  date: z.string().min(1, "Tanggal wajib diisi"),
});

// ─── Shopping List ────────────────────────────────────────────
export const shoppingListSchema = z.object({
  name: z.string().min(1, "Nama daftar wajib diisi").max(100),
});

export const shoppingItemSchema = z.object({
  name: z.string().min(1, "Nama item wajib diisi").max(100),
  quantity: z.string().optional(),
  unit: z.string().max(20).optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  category: z.string().max(50).optional(),
  price: z.string().optional(),
  note: z.string().max(255).optional(),
  inventoryId: z.string().optional(),
});

// ─── Meal Plan ────────────────────────────────────────────────
export const mealPlanItemSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  menuName: z.string().min(1, "Nama menu wajib diisi").max(100),
  recipe: z.string().max(2000).optional(),
  notes: z.string().max(500).optional(),
});

// ─── Calendar ─────────────────────────────────────────────────
export const calendarEventSchema = z.object({
  title: z.string().min(1, "Judul acara wajib diisi").max(200),
  description: z.string().max(1000).optional(),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().optional(),
  allDay: z.boolean().default(false),
  category: z.enum([
    "GENERAL",
    "SCHOOL",
    "HEALTH",
    "BIRTHDAY",
    "APPOINTMENT",
    "HOLIDAY",
    "OTHER",
  ]),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  reminderMinutes: z.number().optional(),
});

// ─── Child ────────────────────────────────────────────────────
export const childSchema = z.object({
  name: z.string().min(1, "Nama anak wajib diisi").max(100),
  birthDate: z.string().min(1, "Tanggal lahir wajib diisi"),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  schoolName: z.string().max(100).optional(),
  grade: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
});

export const growthRecordSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  height: z.string().optional(),
  weight: z.string().optional(),
  headCircumference: z.string().optional(),
  note: z.string().max(500).optional(),
});

// ─── Document ────────────────────────────────────────────────
export const documentSchema = z.object({
  name: z.string().min(1, "Nama dokumen wajib diisi").max(100),
  category: z.enum([
    "KTP",
    "KK",
    "BPJS",
    "STNK",
    "BPKB",
    "CERTIFICATE",
    "PASSPORT",
    "INSURANCE",
    "BIRTH_CERTIFICATE",
    "MARRIAGE_CERTIFICATE",
    "TAX",
    "PROPERTY",
    "EDUCATION",
    "OTHER",
  ]),
  expiryDate: z.string().optional(),
  description: z.string().max(500).optional(),
});

// ─── Types ───────────────────────────────────────────────────
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateFamilyInput = z.infer<typeof createFamilySchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type BillInput = z.infer<typeof billSchema>;
export type SavingGoalInput = z.infer<typeof savingGoalSchema>;
export type DebtInput = z.infer<typeof debtSchema>;
export type ReceivableInput = z.infer<typeof receivableSchema>;
export type InventoryInput = z.infer<typeof inventorySchema>;
export type ShoppingItemInput = z.infer<typeof shoppingItemSchema>;
export type CalendarEventInput = z.infer<typeof calendarEventSchema>;
export type ChildInput = z.infer<typeof childSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
