import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { id } from "date-fns/locale";

// ─── Tailwind class merger ───────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency (IDR) ─────────────────────────────────────────
export function formatIDR(
  amount: number | string,
  options?: {
    compact?: boolean;
    showSymbol?: boolean;
  }
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(num)) return "Rp 0";

  if (options?.compact) {
    if (num >= 1_000_000_000) {
      return `Rp ${(num / 1_000_000_000).toFixed(1)} M`;
    }
    if (num >= 1_000_000) {
      return `Rp ${(num / 1_000_000).toFixed(1)} jt`;
    }
    if (num >= 1_000) {
      return `Rp ${(num / 1_000).toFixed(0)} rb`;
    }
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// ─── Dates ──────────────────────────────────────────────────
export function formatDate(date: Date | string, fmt = "dd MMM yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, fmt, { locale: id });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy, HH:mm", { locale: id });
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return "Hari ini";
  if (isYesterday(d)) return "Kemarin";
  return formatDistanceToNow(d, { addSuffix: true, locale: id });
}

export function formatMonth(month: number, year: number): string {
  return format(new Date(year, month - 1), "MMMM yyyy", { locale: id });
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

// ─── Numbers ─────────────────────────────────────────────────
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.min(Math.round((value / total) * 100), 100)}%`;
}

export function calcPercent(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((value / total) * 100), 100);
}

// ─── File utils ──────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

// ─── String utils ────────────────────────────────────────────
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── Misc ────────────────────────────────────────────────────
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

export function isExpiringSoon(date: Date | string | null, days = 30): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = d.getTime() - Date.now();
  return diff > 0 && diff < days * 24 * 60 * 60 * 1000;
}

export function isExpired(date: Date | string | null): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getTime() < Date.now();
}

// ─── Error handling ──────────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Terjadi kesalahan. Silakan coba lagi.";
}
