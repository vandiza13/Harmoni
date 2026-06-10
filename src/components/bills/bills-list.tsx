"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Receipt, Calendar, Trash2, CheckCircle2, Clock, Loader2, CreditCard, AlertTriangle, FileText } from "lucide-react";
import { formatIDR, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createBill, payBill, deleteBill } from "@/actions/modules";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  amount: any;
  paidAt: Date;
  dueDate: Date;
  status: string;
  note: string | null;
}

interface Bill {
  id: string;
  name: string;
  amount: any;
  dueDay: number;
  category: string | null;
  isActive: boolean;
  reminderDays: number;
  notes: string | null;
  payments: Payment[];
}

interface BillsListProps {
  initialBills: Bill[];
}

const PRESET_CATEGORIES = [
  { label: "Listrik & Air", value: "Utilities" },
  { label: "Internet & TV Kabel", value: "Internet" },
  { label: "Keanggantongan & Hiburan", value: "Subscription" },
  { label: "Pendidikan & Sekolah", value: "Education" },
  { label: "Cicilan & Pinjaman", value: "Debt" },
  { label: "Premi Asuransi", value: "Insurance" },
  { label: "Lain-lain", value: "Others" },
];

export function BillsList({ initialBills }: BillsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dialog States
  const [isNewBillOpen, setIsNewBillOpen] = useState(false);
  const [isPayConfirmOpen, setIsPayConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // New Bill Form States
  const [newBillName, setNewBillName] = useState("");
  const [newBillAmount, setNewBillAmount] = useState("");
  const [newBillDueDay, setNewBillDueDay] = useState("");
  const [newBillCategory, setNewBillCategory] = useState("Utilities");
  const [newBillReminder, setNewBillReminder] = useState("3");
  const [newBillNotes, setNewBillNotes] = useState("");

  const today = new Date();
  const currentMonthName = today.toLocaleDateString("id-ID", { month: "long" });

  // Calculate unpaid bills and total due amount for current month
  const billsStatus = initialBills.map((bill) => {
    const latestPayment = bill.payments[0];
    const isPaidThisMonth =
      latestPayment &&
      new Date(latestPayment.paidAt).getMonth() === today.getMonth() &&
      new Date(latestPayment.paidAt).getFullYear() === today.getFullYear();

    // Calculate days remaining
    const currentDay = today.getDate();
    let daysRemaining = 0;
    if (bill.dueDay >= currentDay) {
      daysRemaining = bill.dueDay - currentDay;
    } else {
      // due next month, compute rough days
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      daysRemaining = daysInMonth - currentDay + bill.dueDay;
    }

    return {
      ...bill,
      isPaidThisMonth,
      daysRemaining,
    };
  });

  const activeBills = billsStatus.filter((b) => !b.isPaidThisMonth);
  const paidBills = billsStatus.filter((b) => b.isPaidThisMonth);
  const totalUnpaidAmount = activeBills.reduce((sum, b) => sum + Number(b.amount), 0);

  async function handleCreateBill(e: React.FormEvent) {
    e.preventDefault();
    if (!newBillName || !newBillAmount || !newBillDueDay) {
      toast.error("Mohon isi field wajib.");
      return;
    }

    const dueDayNum = parseInt(newBillDueDay);
    if (dueDayNum < 1 || dueDayNum > 31) {
      toast.error("Tanggal jatuh tempo harus antara 1 dan 31.");
      return;
    }

    startTransition(async () => {
      const res = await createBill({
        name: newBillName,
        amount: parseFloat(newBillAmount),
        dueDay: dueDayNum,
        category: newBillCategory,
        reminderDays: parseInt(newBillReminder),
        notes: newBillNotes || undefined,
      });

      if (res.success) {
        toast.success("Tagihan baru berhasil didaftarkan! 🧾");
        setIsNewBillOpen(false);
        resetBillForm();
        router.refresh();
      } else {
        toast.error(res.error || "Gagal membuat tagihan.");
      }
    });
  }

  async function handlePayBill() {
    if (!selectedBill) return;

    startTransition(async () => {
      const res = await payBill(selectedBill.id, parseFloat(selectedBill.amount));
      if (res.success) {
        toast.success(`Pembayaran "${selectedBill.name}" berhasil dicatat! 🎉`);
        setIsPayConfirmOpen(false);
        setSelectedBill(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mencatat pembayaran.");
      }
    });
  }

  async function handleDeleteBill() {
    if (!selectedBill) return;

    startTransition(async () => {
      const res = await deleteBill(selectedBill.id);
      if (res.success) {
        toast.success(`Tagihan "${selectedBill.name}" berhasil dihapus.`);
        setIsDeleteConfirmOpen(false);
        setSelectedBill(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus tagihan.");
      }
    });
  }

  function resetBillForm() {
    setNewBillName("");
    setNewBillAmount("");
    setNewBillDueDay("");
    setNewBillCategory("Utilities");
    setNewBillReminder("3");
    setNewBillNotes("");
  }

  return (
    <div className="space-y-6">
      {/* ─── Header Action ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">🧾 Pengingat Tagihan</h2>
          <p className="text-sm text-muted-foreground">Kelola pengeluaran rutin bulanan keluarga agar tidak terlewat</p>
        </div>
        <Button onClick={() => setIsNewBillOpen(true)} className="gradient-primary text-white shadow-soft hover:shadow-soft-lg gap-2">
          <Plus className="h-4 w-4" />
          Tagihan Baru
        </Button>
      </div>

      {/* ─── Stats cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Unpaid amount */}
        <div className="card-harmoni p-5 relative overflow-hidden bg-gradient-to-br from-destructive/10 to-transparent border-destructive/20">
          <div className="absolute right-4 top-4 text-destructive opacity-25">
            <CreditCard className="h-12 w-12" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Belum Dibayar ({currentMonthName})</p>
          <p className="currency-display text-2xl font-extrabold text-destructive mt-2">
            {formatIDR(totalUnpaidAmount)}
          </p>
          <p className="text-xs text-muted-foreground mt-4 font-medium">
            Mencakup {activeBills.length} tagihan bulan ini
          </p>
        </div>

        {/* Paid Count */}
        <div className="card-harmoni p-5 relative overflow-hidden bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <div className="absolute right-4 top-4 text-primary opacity-25">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sudah Dibayar</p>
          <p className="text-2xl font-bold text-foreground mt-2">
            {paidBills.length} <span className="text-sm font-normal text-muted-foreground">dari {initialBills.length} tagihan</span>
          </p>
          <p className="text-xs text-muted-foreground mt-4 font-medium">
            Progres: {initialBills.length > 0 ? Math.round((paidBills.length / initialBills.length) * 100) : 0}% selesai
          </p>
        </div>

        {/* Due soon alert */}
        <div className="card-harmoni p-5 bg-gradient-to-br from-amber-50 dark:from-amber-950/20 to-transparent border-amber-200 dark:border-amber-900/30">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Perlu Perhatian</span>
          </div>
          {activeBills.filter(b => b.daysRemaining <= 3).length > 0 ? (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Ada <span className="font-bold text-amber-600 dark:text-amber-400">{activeBills.filter(b => b.daysRemaining <= 3).length} tagihan</span> yang jatuh tempo dalam 3 hari ke depan. Segera lakukan pembayaran!
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Semua tagihan mendatang saat ini berada dalam rentang waktu aman. Tetap pantau pengingat Anda!
            </p>
          )}
        </div>
      </div>

      {/* ─── Bills Lists ─────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: List of Bills */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Bills Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-destructive" />
              <span>Belum Dibayar</span>
            </h3>

            {activeBills.length === 0 ? (
              <div className="card-harmoni p-6 text-center text-muted-foreground bg-primary/5 border-primary/20">
                <p className="text-3xl mb-2">🎉</p>
                <p className="font-medium text-primary dark:text-primary-foreground">Hebat! Semua tagihan bulan ini sudah lunas</p>
                <p className="text-xs mt-0.5">Tidak ada tagihan tertunda untuk diselesaikan.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeBills.map((bill) => {
                  const isUrgent = bill.daysRemaining <= 3;
                  const isDueSoon = bill.daysRemaining <= 7;

                  return (
                    <div
                      key={bill.id}
                      className={cn(
                        "card-harmoni p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all",
                        isUrgent && "border-destructive/30 bg-destructive/5 dark:bg-destructive/10"
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={cn(
                          "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-lg",
                          isUrgent ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400" : "bg-muted"
                        )}>
                          🧾
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-foreground truncate">{bill.name}</h4>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                            <span>Tiap tanggal {bill.dueDay}</span>
                            <span>•</span>
                            <Badge variant="secondary" className="text-[9px] py-0 h-4">
                              {bill.category || "Lain-lain"}
                            </Badge>
                          </div>
                          {bill.notes && (
                            <p className="text-xs text-muted-foreground/80 mt-1.5 flex items-start gap-1">
                              <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                              <span className="truncate">{bill.notes}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
                        <div className="text-left sm:text-right">
                          <p className="currency-display text-lg font-bold text-foreground">
                            {formatIDR(Number(bill.amount))}
                          </p>
                          <Badge variant={isUrgent ? "destructive" : isDueSoon ? "secondary" : "outline"} className="text-[10px] h-5 mt-0.5">
                            {bill.daysRemaining === 0 ? "Hari Ini!" : `${bill.daysRemaining} hari lagi`}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setSelectedBill(bill);
                              setIsPayConfirmOpen(true);
                            }}
                            size="sm"
                            className="bg-primary text-white hover:bg-primary/95 text-xs font-semibold h-8"
                          >
                            Bayar
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedBill(bill);
                              setIsDeleteConfirmOpen(true);
                            }}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paid Bills Section */}
          {paidBills.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Lunas Bulan Ini</span>
              </h3>
              <div className="space-y-2 opacity-80">
                {paidBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="card-harmoni p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-primary/20 bg-primary/5 dark:bg-primary/10"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-lg">
                        ✅
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-foreground truncate line-through">{bill.name}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Dibayar pada {formatDate(new Date(bill.payments[0].paidAt), "dd MMMM yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                      <p className="currency-display font-bold text-foreground text-sm">
                        {formatIDR(Number(bill.amount))}
                      </p>
                      <Badge className="badge-success text-[10px] h-4">Lunas</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Information & Help */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-foreground">Kategori Tagihan</h3>
          <div className="card-harmoni p-4 divide-y divide-border">
            {PRESET_CATEGORIES.map((cat) => {
              const count = initialBills.filter((b) => b.category === cat.value).length;
              return (
                <div key={cat.value} className="flex justify-between py-2.5 first:pt-0 last:pb-0">
                  <span className="text-sm text-foreground">{cat.label}</span>
                  <Badge variant="outline" className="text-[10px] h-5">
                    {count} tagihan
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── DIALOG: Tagihan Baru ─────────────────────────── */}
      <Dialog open={isNewBillOpen} onOpenChange={setIsNewBillOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Tagihan Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBill} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="bill-name">Nama Tagihan</Label>
              <Input
                id="bill-name"
                placeholder="cth: Listrik PLN, WiFi Rumah, Spotify"
                value={newBillName}
                onChange={(e) => setNewBillName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bill-amount">Nominal Tagihan (Rp)</Label>
              <Input
                id="bill-amount"
                type="number"
                placeholder="0"
                value={newBillAmount}
                onChange={(e) => setNewBillAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bill-due">Tanggal Jatuh Tempo (Setiap Bulan)</Label>
              <Input
                id="bill-due"
                type="number"
                min={1}
                max={31}
                placeholder="cth: 20"
                value={newBillDueDay}
                onChange={(e) => setNewBillDueDay(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bill-category">Kategori</Label>
              <Select value={newBillCategory} onValueChange={setNewBillCategory}>
                <SelectTrigger id="bill-category">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bill-reminder">Pengingat (Hari Sebelum Jatuh Tempo)</Label>
              <Select value={newBillReminder} onValueChange={setNewBillReminder}>
                <SelectTrigger id="bill-reminder">
                  <SelectValue placeholder="Pilih hari pengingat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hari sebelum</SelectItem>
                  <SelectItem value="3">3 hari sebelum</SelectItem>
                  <SelectItem value="5">5 hari sebelum</SelectItem>
                  <SelectItem value="7">7 hari sebelum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bill-notes">Catatan Tambahan (Opsional)</Label>
              <Textarea
                id="bill-notes"
                placeholder="cth: Nomor pelanggan 12345678"
                rows={2}
                value={newBillNotes}
                onChange={(e) => setNewBillNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsNewBillOpen(false)}>Batal</Button>
              <Button type="submit" className="gradient-primary text-white" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tambah Tagihan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: Konfirmasi Pembayaran ─────────────────── */}
      <Dialog open={isPayConfirmOpen} onOpenChange={setIsPayConfirmOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-sm text-muted-foreground">
              Apakah Anda yakin ingin menandai tagihan berikut sebagai lunas untuk bulan ini?
            </p>
            <div className="bg-muted/50 p-3.5 rounded-xl space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Tagihan</p>
              <p className="text-sm font-bold text-foreground">{selectedBill?.name}</p>
              <p className="text-xs text-muted-foreground mt-2">Nominal</p>
              <p className="currency-display text-base font-extrabold text-primary">
                {selectedBill && formatIDR(Number(selectedBill.amount))}
              </p>
            </div>
          </div>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => {
              setIsPayConfirmOpen(false);
              setSelectedBill(null);
            }}>Batal</Button>
            <Button type="button" className="gradient-primary text-white" onClick={handlePayBill} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Tandai Lunas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: Hapus Tagihan ────────────────────────── */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">Hapus Tagihan</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tindakan ini akan menonaktifkan tagihan <strong>{selectedBill?.name}</strong> dari daftar aktif. Prosedur pembayaran sebelumnya akan diarsipkan. Apakah Anda ingin melanjutkan?
            </p>
          </div>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => {
              setIsDeleteConfirmOpen(false);
              setSelectedBill(null);
            }}>Batal</Button>
            <Button type="button" variant="destructive" onClick={handleDeleteBill} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Tagihan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
