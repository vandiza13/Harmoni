"use client";

import { useState, useEffect, useTransition } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Download,
  Calendar,
  Loader2,
  FileSpreadsheet,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { formatIDR, calcPercent, formatMonth, formatDate } from "@/lib/utils";
import { getFinanceSummary, getExpenseByCategory, getTransactions } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportTransactionsToExcel, exportTransactionsToPDF } from "@/lib/export";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────
const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const YEARS = [2024, 2025, 2026, 2027, 2028];

const PIE_COLORS = [
  "#10b981", // emerald
  "#ef4444", // rose
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#14b8a6", // teal
];

interface CategoryData {
  categoryId: string | null;
  categoryName: string;
  icon: string;
  color: string;
  amount: number;
  percentage?: number;
}

interface Transaction {
  id: string;
  amount: number;
  description: string | null;
  date: Date;
  type: "income" | "expense";
  category: { id: string; name: string; icon: string | null; color: string | null } | null;
}

interface ReportsDashboardProps {
  initialSummary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    month: number;
    year: number;
  };
  initialCategories: CategoryData[];
  initialTransactions: any[];
  familyName: string;
}

export function ReportsDashboard({
  initialSummary,
  initialCategories,
  initialTransactions,
  familyName,
}: ReportsDashboardProps) {
  const [activeMonth, setActiveMonth] = useState(initialSummary.month);
  const [activeYear, setActiveYear] = useState(initialSummary.year);
  const [summary, setSummary] = useState(initialSummary);
  const [categories, setCategories] = useState<CategoryData[]>(initialCategories);
  const [transactions, setTransactions] = useState<any[]>(initialTransactions);
  const [isPending, startTransition] = useTransition();
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // ─── Fetch updated data when filters change ───────────────────
  useEffect(() => {
    if (activeMonth === initialSummary.month && activeYear === initialSummary.year) {
      setSummary(initialSummary);
      setCategories(initialCategories);
      setTransactions(initialTransactions);
      return;
    }

    startTransition(async () => {
      try {
        const [sumResult, catResult, txResult] = await Promise.all([
          getFinanceSummary(activeMonth, activeYear),
          getExpenseByCategory(activeMonth, activeYear),
          getTransactions({ month: activeMonth, year: activeYear, limit: 1000 }),
        ]);

        setSummary(sumResult);
        setCategories(catResult);
        setTransactions(txResult.data);
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast.error("Gagal memuat data laporan");
      }
    });
  }, [activeMonth, activeYear, initialSummary, initialCategories, initialTransactions]);

  // ─── Format daily trend data ──────────────────────────────────
  const daysInMonth = new Date(activeYear, activeMonth, 0).getDate();
  const dailyData = Array.from({ length: daysInMonth }, (_, idx) => {
    const day = idx + 1;
    return {
      name: `${day}`,
      Pemasukan: 0,
      Pengeluaran: 0,
    };
  });

  transactions.forEach((tx) => {
    const txDate = new Date(tx.date);
    const txDay = txDate.getDate();
    if (tx.type === "income") {
      dailyData[txDay - 1].Pemasukan += tx.amount;
    } else {
      dailyData[txDay - 1].Pengeluaran += tx.amount;
    }
  });

  // Calculate cumulative balances for cashflow curve
  let runningBalance = 0;
  const cumulativeData = dailyData.map((d) => {
    runningBalance += d.Pemasukan - d.Pengeluaran;
    return {
      ...d,
      Saldo: runningBalance,
    };
  });

  // Format category data for Pie Chart
  const pieData = categories
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((c, i) => ({
      ...c,
      color: c.color || PIE_COLORS[i % PIE_COLORS.length],
      percentage: calcPercent(c.amount, summary.totalExpense),
    }));

  // Top 5 Highest Expenses
  const topExpenses = transactions
    .filter((tx) => tx.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // ─── Exports Handler ──────────────────────────────────────────
  const mapTransactionsForExport = () => {
    return transactions.map((t) => ({
      date: new Date(t.date),
      description: t.description || "Tanpa keterangan",
      category: t.category?.name || "Lainnya",
      amount: Number(t.amount),
      type: t.type,
    }));
  };

  const exportConfig = {
    familyName,
    month: activeMonth,
    year: activeYear,
    totalIncome: summary.totalIncome,
    totalExpense: summary.totalExpense,
    balance: summary.balance,
  };

  const handleExportPDF = async () => {
    if (transactions.length === 0) {
      toast.error("Tidak ada transaksi untuk diekspor");
      return;
    }
    setExportingPdf(true);
    try {
      await exportTransactionsToPDF(mapTransactionsForExport(), exportConfig);
      toast.success("PDF Laporan Keuangan berhasil diunduh");
    } catch {
      toast.error("Gagal mengekspor PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    if (transactions.length === 0) {
      toast.error("Tidak ada transaksi untuk diekspor");
      return;
    }
    setExportingExcel(true);
    try {
      await exportTransactionsToExcel(mapTransactionsForExport(), exportConfig);
      toast.success("Excel Laporan Keuangan berhasil diunduh");
    } catch {
      toast.error("Gagal mengekspor Excel");
    } finally {
      setExportingExcel(false);
    }
  };

  // Custom tooltips
  const formatTooltipValue = (value: number) => formatIDR(value);

  return (
    <div className="space-y-6">
      {/* ─── Control Header ──────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Laporan Keuangan</h2>
          <p className="text-sm text-muted-foreground">
            Analisis kas masuk, keluar, dan distribusi pengeluaran keluarga {familyName}
          </p>
        </div>

        {/* Filters and Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector */}
          <Select
            value={activeMonth.toString()}
            onValueChange={(v) => setActiveMonth(parseInt(v))}
            disabled={isPending}
          >
            <SelectTrigger className="w-36 h-10 border-border bg-card">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Bulan" />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((m, idx) => (
                <SelectItem key={m} value={(idx + 1).toString()}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year selector */}
          <Select
            value={activeYear.toString()}
            onValueChange={(v) => setActiveYear(parseInt(v))}
            disabled={isPending}
          >
            <SelectTrigger className="w-24 h-10 border-border bg-card">
              <SelectValue placeholder="Tahun" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Export PDF */}
          <Button
            variant="outline"
            className="h-10 gap-1.5 border-border bg-card hover:bg-muted"
            onClick={handleExportPDF}
            disabled={exportingPdf || isPending}
          >
            {exportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 text-red-500" />
            )}
            PDF
          </Button>

          {/* Export Excel */}
          <Button
            variant="outline"
            className="h-10 gap-1.5 border-border bg-card hover:bg-muted"
            onClick={handleExportExcel}
            disabled={exportingExcel || isPending}
          >
            {exportingExcel ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            )}
            Excel
          </Button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isPending && (
        <div className="flex items-center justify-center p-8 bg-card border border-border rounded-2xl shadow-soft">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-sm font-medium text-muted-foreground">Memuat data laporan...</span>
        </div>
      )}

      {!isPending && (
        <>
          {/* ─── High Level Cards ─────────────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Income */}
            <div className="card-harmoni p-6 relative overflow-hidden group">
              <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 h-24 w-24 rounded-full bg-green-500/5 group-hover:scale-110 transition-transform" />
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                    Total Pemasukan
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-0.5 tabular-nums">
                    {formatIDR(summary.totalIncome)}
                  </p>
                </div>
              </div>
            </div>

            {/* Expense */}
            <div className="card-harmoni p-6 relative overflow-hidden group">
              <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 h-24 w-24 rounded-full bg-rose-500/5 group-hover:scale-110 transition-transform" />
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                  <ArrowDownRight className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                    Total Pengeluaran
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-0.5 tabular-nums">
                    {formatIDR(summary.totalExpense)}
                  </p>
                </div>
              </div>
            </div>

            {/* Balance */}
            <div className="card-harmoni p-6 relative overflow-hidden group">
              <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 h-24 w-24 rounded-full bg-blue-500/5 group-hover:scale-110 transition-transform" />
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                    Saldo Kas (Net)
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-0.5 tabular-nums">
                    {formatIDR(summary.balance)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Visual Charts ─────────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Daily Trend Curve */}
            <div className="card-harmoni p-5 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-1.5 text-sm md:text-base">
                    <BarChart3 className="h-4.5 w-4.5 text-primary" />
                    Arus Kas Bulanan (Harian)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Grafik akumulasi transaksi dan pergerakan saldo harian
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[10px] gap-1 px-1.5 border-green-500/20 text-green-600 bg-green-500/5">
                    ● Pemasukan
                  </Badge>
                  <Badge variant="outline" className="text-[10px] gap-1 px-1.5 border-rose-500/20 text-rose-500 bg-rose-500/5">
                    ● Pengeluaran
                  </Badge>
                </div>
              </div>

              {/* Area Chart Container */}
              <div className="h-64 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis
                      dataKey="name"
                      className="text-[10px] fill-muted-foreground font-medium"
                      tickLine={false}
                    />
                    <YAxis
                      className="text-[10px] fill-muted-foreground font-medium"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `Rp${val / 1000}k`}
                      width={60}
                    />
                    <Tooltip
                      formatter={formatTooltipValue}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--card)",
                        color: "var(--foreground)",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Pemasukan"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Pengeluaran"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorExpense)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribution Pie Chart */}
            <div className="card-harmoni p-5 space-y-4">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-1.5 text-sm md:text-base">
                  <PieChartIcon className="h-4.5 w-4.5 text-primary" />
                  Distribusi Pengeluaran
                </h3>
                <p className="text-xs text-muted-foreground">
                  Persentase pengeluaran dikelompokkan per kategori
                </p>
              </div>

              {pieData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <span className="text-3xl mb-2">🍽️</span>
                  <p className="text-sm font-medium">Belum ada pengeluaran</p>
                  <p className="text-xs">Catatan pengeluaran bulan ini kosong</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pie graphic */}
                  <div className="h-40 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="amount"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={entry.categoryId || index} fill={entry.color} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={formatTooltipValue}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid var(--border)",
                            backgroundColor: "var(--card)",
                            color: "var(--foreground)",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Total
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {formatIDR(summary.totalExpense, { compact: true })}
                      </span>
                    </div>
                  </div>

                  {/* Pie Legend List */}
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {pieData.map((item) => (
                      <div key={item.categoryId} className="flex items-center gap-2 text-xs">
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="flex-1 text-muted-foreground truncate">
                          {item.icon} {item.categoryName}
                        </span>
                        <span className="font-semibold text-foreground tabular-nums">
                          {item.percentage}%
                        </span>
                        <span className="text-muted-foreground tabular-nums w-18 text-right font-medium">
                          {formatIDR(item.amount, { compact: true })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── Detail List & Insights ───────────────────────────── */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Expenses List */}
            <div className="card-harmoni p-5 space-y-4">
              <div>
                <h3 className="font-bold text-foreground text-sm md:text-base">
                  Pengeluaran Terbesar Bulan Ini
                </h3>
                <p className="text-xs text-muted-foreground">
                  Daftar 5 pengeluaran bernominal tertinggi
                </p>
              </div>

              {topExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <span className="text-2xl mb-1.5">💸</span>
                  <p className="text-xs">Tidak ada riwayat pengeluaran bulan ini</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {topExpenses.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/40 text-sm">
                          {tx.category?.icon || "💸"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {tx.description || "Tanpa keterangan"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {tx.category?.name || "Lainnya"} · {formatDate(tx.date, "dd MMM yyyy")}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-red-500 tabular-nums shrink-0">
                        -{formatIDR(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Smart Summary / Analysis Insight */}
            <div className="card-harmoni p-5 space-y-4 bg-gradient-to-br from-primary/5 via-card to-card border-primary/10">
              <div>
                <h3 className="font-bold text-foreground text-sm md:text-base">
                  Analisis Finansial Keluarga
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ringkasan & rekomendasi pengelolaan kas otomatis
                </p>
              </div>

              <div className="space-y-4 text-sm">
                {/* Savings trajectory */}
                {summary.totalIncome > 0 ? (
                  <div className="space-y-3.5">
                    {/* Savings Ratio */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-muted-foreground">Rasio Sisa Saldo Tabungan</span>
                        <span className="font-bold text-primary">
                          {Math.max(0, Math.round((summary.balance / summary.totalIncome) * 100))}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${Math.max(0, Math.min(100, Math.round((summary.balance / summary.totalIncome) * 100)))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Insights dynamic description */}
                    <div className="p-3.5 rounded-xl bg-background/50 border border-border space-y-2 text-xs text-muted-foreground">
                      {summary.balance > 0 ? (
                        <>
                          <div className="flex gap-2 items-start">
                            <span className="text-green-500">✔</span>
                            <p>
                              Hebat! Arus kas bulan ini **surplus**. Anda memiliki sisa saldo sebesar **{formatIDR(summary.balance)}** yang dapat dialokasikan ke pos target tabungan atau dana darurat.
                            </p>
                          </div>
                          {summary.balance / summary.totalIncome < 0.2 && (
                            <div className="flex gap-2 items-start mt-1 text-amber-500">
                              <span>⚠</span>
                              <p>
                                Rasio tabungan Anda berada di bawah **20%**. Disarankan untuk membatasi pengeluaran non-esensial agar memiliki ruang dana darurat yang lebih besar.
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex gap-2 items-start text-red-500">
                          <span>❌</span>
                          <p>
                            Perhatian! Arus kas bulan ini **defisit**. Pengeluaran melebihi pemasukan dengan selisih sebesar **{formatIDR(Math.abs(summary.balance))}**. Harap lakukan evaluasi alokasi anggaran belanja sesegera mungkin.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-center">
                    <span className="text-3xl mb-2">💡</span>
                    <p className="text-xs">
                      Belum ada pemasukan yang dicatat untuk bulan ini.<br />
                      Silakan rekam pemasukan di modul Keuangan untuk memunculkan analisis rasio tabungan.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
