import type { FamilyRole, NotificationType, UserRole } from "@prisma/client";

// ─── Action result pattern ────────────────────────────────────
export type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

// ─── Session user extension ───────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      familyId?: string;
      familyRole?: FamilyRole;
      familyName?: string;
      role?: UserRole;
    };
  }
}

// ─── Dashboard types ──────────────────────────────────────────
export interface DashboardSummary {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  savingGoalsProgress: number;
  upcomingBills: BillItem[];
  lowStockItems: InventoryItem[];
  todayEvents: EventItem[];
  budgetWarnings: BudgetWarning[];
}

// ─── Finance types ────────────────────────────────────────────
export interface TransactionItem {
  id: string;
  amount: number;
  description: string;
  date: Date;
  type: "income" | "expense";
  category?: {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
  } | null;
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
}

export interface CategorySummary {
  categoryId: string | null;
  categoryName: string;
  icon: string;
  color: string;
  amount: number;
  percentage?: number;
}

export interface MonthlyTrend {
  month: number;
  year: number;
  income: number;
  expense: number;
  balance: number;
}

// ─── Budget types ─────────────────────────────────────────────
export interface BudgetWarning {
  categoryId: string;
  categoryName: string;
  budgeted: number;
  spent: number;
  percentage: number;
  remaining: number;
}

// ─── Bill types ───────────────────────────────────────────────
export interface BillItem {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  dueDate: Date; // calculated
  daysUntilDue: number;
  isPaid: boolean;
  isOverdue: boolean;
  category?: string | null;
}

// ─── Saving types ─────────────────────────────────────────────
export interface SavingGoalWithProgress {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  remaining: number;
  targetDate?: Date | null;
  icon?: string | null;
  color?: string | null;
  isCompleted: boolean;
}

// ─── Inventory types ──────────────────────────────────────────
export interface InventoryItem {
  id: string;
  name: string;
  category?: string | null;
  unit?: string | null;
  currentStock: number;
  minStock: number;
  isLow: boolean;
  imageUrl?: string | null;
}

// ─── Event types ──────────────────────────────────────────────
export interface EventItem {
  id: string;
  title: string;
  startDate: Date;
  endDate?: Date | null;
  allDay: boolean;
  category: string;
  color?: string | null;
}

// ─── Child types ──────────────────────────────────────────────
export interface ChildWithAge {
  id: string;
  name: string;
  birthDate: Date;
  ageYears: number;
  ageMonths: number;
  gender?: "MALE" | "FEMALE" | null;
  photoUrl?: string | null;
  schoolName?: string | null;
  grade?: string | null;
}

// ─── Notification type ────────────────────────────────────────
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string | null;
  createdAt: Date;
}

// ─── Pagination ───────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// ─── Chart data ───────────────────────────────────────────────
export interface PieChartData {
  name: string;
  value: number;
  color: string;
  icon?: string;
}

export interface BarChartData {
  label: string;
  income?: number;
  expense?: number;
  budget?: number;
  actual?: number;
}

// ─── File upload ──────────────────────────────────────────────
export interface UploadedFile {
  url: string;
  key: string;
  size: number;
  mimeType: string;
  originalName: string;
}

// ─── Emergency fund calculator ────────────────────────────────
export interface EmergencyFundCalculation {
  monthlyExpense: number;
  targetMonths: number;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  remaining: number;
  projectedCompletionDate?: Date;
}
