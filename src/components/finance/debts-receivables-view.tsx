"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, TrendingDown, TrendingUp, Calendar, Trash2, CheckCircle2, Clock, Loader2, Sparkles, CreditCard } from "lucide-react";
import { formatIDR, formatDate, calcPercent } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createDebt, payDebt, createReceivable, collectReceivable } from "@/actions/modules";
import { cn } from "@/lib/utils";

interface DebtPayment {
  id: string;
  amount: any;
  paidAt: Date;
  note: string | null;
}

interface Debt {
  id: string;
  creditor: string;
  amount: any;
  paidAmount: any;
  dueDate: Date | null;
  description: string | null;
  isSettled: boolean;
  payments: DebtPayment[];
}

interface ReceivablePayment {
  id: string;
  amount: any;
  paidAt: Date;
  note: string | null;
}

interface Receivable {
  id: string;
  debtor: string;
  amount: any;
  paidAmount: any;
  dueDate: Date | null;
  description: string | null;
  isSettled: boolean;
  payments: ReceivablePayment[];
}

interface DebtsReceivablesViewProps {
  initialDebts: Debt[];
  initialReceivables: Receivable[];
}

export function DebtsReceivablesView({ initialDebts, initialReceivables }: DebtsReceivablesViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"debt" | "receivable">("debt");

  // Dialog States
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);

  // New Form States
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [desc, setDesc] = useState("");

  // Action Form States (Pay Debt / Collect Receivable)
  const [actionAmount, setActionAmount] = useState("");
  const [actionNote, setActionNote] = useState("");

  // Stats
  const totalDebt = initialDebts.filter(d => !d.isSettled).reduce((sum, d) => sum + (Number(d.amount) - Number(d.paidAmount)), 0);
  const totalReceivable = initialReceivables.filter(r => !r.isSettled).reduce((sum, r) => sum + (Number(r.amount) - Number(r.paidAmount)), 0);
  const netBalance = totalReceivable - totalDebt;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !amount) {
      toast.error("Nama dan nominal wajib diisi.");
      return;
    }

    startTransition(async () => {
      const action = activeTab === "debt" ? createDebt : createReceivable;
      const res = await action({
        creditor: name, // maps to creditor/debtor in backends
        debtor: name,
        amount: parseFloat(amount),
        dueDate: dueDate || undefined,
        description: desc || undefined,
      } as any);

      if (res.success) {
        toast.success(
          activeTab === "debt"
            ? "Data hutang berhasil dicatat! 💸"
            : "Data piutang berhasil dicatat! 💰"
        );
        setIsNewOpen(false);
        resetForm();
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mencatat data.");
      }
    });
  }

  async function handleActionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actionAmount) {
      toast.error("Nominal wajib diisi.");
      return;
    }

    startTransition(async () => {
      const amountVal = parseFloat(actionAmount);
      let res;

      if (selectedDebt) {
        res = await payDebt(selectedDebt.id, amountVal, actionNote || undefined);
      } else if (selectedReceivable) {
        res = await collectReceivable(selectedReceivable.id, amountVal, actionNote || undefined);
      } else {
        return;
      }

      if (res.success) {
        toast.success(
          selectedDebt
            ? "Pembayaran hutang berhasil dicatat!"
            : "Penerimaan piutang berhasil dicatat!"
        );
        setIsActionOpen(false);
        setActionAmount("");
        setActionNote("");
        setSelectedDebt(null);
        setSelectedReceivable(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memproses transaksi.");
      }
    });
  }

  function resetForm() {
    setName("");
    setAmount("");
    setDueDate("");
    setDesc("");
  }

  return (
    <div className="space-y-6">
      {/* ─── Header Action ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">🤝 Hutang & Piutang</h2>
          <p className="text-sm text-muted-foreground">Kelola komitmen pinjaman dan piutang keluarga Anda</p>
        </div>
        <Button onClick={() => setIsNewOpen(true)} className="gradient-primary text-white shadow-soft hover:shadow-soft-lg gap-2">
          <Plus className="h-4 w-4" />
          {activeTab === "debt" ? "Catat Hutang" : "Catat Piutang"}
        </Button>
      </div>

      {/* ─── Stats cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Debts */}
        <div className="card-harmoni p-5 relative overflow-hidden bg-gradient-to-br from-red-50 dark:from-red-950/20 to-transparent border-red-200 dark:border-red-900/30">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Hutang Kita</p>
          <p className="currency-display text-2xl font-extrabold text-red-600 mt-2">
            {formatIDR(totalDebt)}
          </p>
          <p className="text-xs text-muted-foreground mt-4 font-medium">
            Dari {initialDebts.filter(d => !d.isSettled).length} pinjaman berjalan
          </p>
        </div>

        {/* Total Receivables */}
        <div className="card-harmoni p-5 relative overflow-hidden bg-gradient-to-br from-green-50 dark:from-green-950/20 to-transparent border-green-200 dark:border-green-900/30">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Piutang (Orang Lain)</p>
          <p className="currency-display text-2xl font-extrabold text-green-600 mt-2">
            {formatIDR(totalReceivable)}
          </p>
          <p className="text-xs text-muted-foreground mt-4 font-medium">
            Dari {initialReceivables.filter(r => !r.isSettled).length} piutang berjalan
          </p>
        </div>

        {/* Net balance */}
        <div className={cn(
          "card-harmoni p-5 relative overflow-hidden",
          netBalance >= 0 ? "bg-gradient-to-br from-primary/10 to-transparent border-primary/20" : "bg-gradient-to-br from-amber-50 dark:from-amber-950/20 to-transparent border-amber-200 dark:border-amber-900/30"
        )}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selisih Bersih (Net)</p>
          <p className={cn(
            "currency-display text-2xl font-bold mt-2",
            netBalance >= 0 ? "text-primary" : "text-amber-600 dark:text-amber-400"
          )}>
            {formatIDR(netBalance)}
          </p>
          <p className="text-xs text-muted-foreground mt-4 font-medium">
            {netBalance >= 0 ? "Keuangan dalam kondisi surplus" : "Total hutang lebih besar dari piutang"}
          </p>
        </div>
      </div>

      {/* ─── Main Tabs Content ───────────────────────────── */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <TabsList className="w-full sm:w-80 h-11 mb-4">
          <TabsTrigger value="debt" className="flex-1 text-xs gap-1.5">
            <TrendingDown className="h-3.5 w-3.5" />
            Hutang Kita
          </TabsTrigger>
          <TabsTrigger value="receivable" className="flex-1 text-xs gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Piutang Kita
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB: Debts ────────────────────────────────── */}
        <TabsContent value="debt" className="space-y-4">
          <div className="card-harmoni p-4">
            <h4 className="font-bold text-sm text-foreground mb-3">Daftar Hutang Aktif</h4>

            {initialDebts.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Tidak ada catatan hutang.
              </p>
            ) : (
              <div className="divide-y divide-border/50 pr-1">
                {initialDebts.map((debt) => {
                  const remaining = Number(debt.amount) - Number(debt.paidAmount);
                  const percent = calcPercent(Number(debt.paidAmount), Number(debt.amount));

                  return (
                    <div key={debt.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{debt.creditor}</span>
                          {debt.isSettled ? (
                            <Badge className="bg-green-500 text-white text-[8px] py-0 h-4">Lunas</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[8px] py-0 h-4 border-red-200 text-red-600">Berjalan</Badge>
                          )}
                        </div>
                        {debt.description && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{debt.description}</p>
                        )}
                        {debt.dueDate && (
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Jatuh tempo: {formatDate(new Date(debt.dueDate), "dd MMM yyyy")}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 shrink-0 min-w-[150px]">
                        <div className="text-left sm:text-right">
                          <p className="currency-display text-sm font-bold text-foreground">
                            {formatIDR(remaining)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Total: {formatIDR(Number(debt.amount), { compact: true })} ({Math.round(percent)}% bayar)
                          </p>
                        </div>
                        {!debt.isSettled && (
                          <Button
                            onClick={() => {
                              setSelectedDebt(debt);
                              setIsActionOpen(true);
                            }}
                            size="sm"
                            className="bg-primary text-white text-xs font-semibold h-8"
                          >
                            Cicil / Bayar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── TAB: Receivables ───────────────────────────── */}
        <TabsContent value="receivable" className="space-y-4">
          <div className="card-harmoni p-4">
            <h4 className="font-bold text-sm text-foreground mb-3">Daftar Piutang Aktif</h4>

            {initialReceivables.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Tidak ada catatan piutang.
              </p>
            ) : (
              <div className="divide-y divide-border/50 pr-1">
                {initialReceivables.map((rec) => {
                  const remaining = Number(rec.amount) - Number(rec.paidAmount);
                  const percent = calcPercent(Number(rec.paidAmount), Number(rec.amount));

                  return (
                    <div key={rec.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{rec.debtor}</span>
                          {rec.isSettled ? (
                            <Badge className="bg-green-500 text-white text-[8px] py-0 h-4">Selesai</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[8px] py-0 h-4 border-green-200 text-green-600">Aktif</Badge>
                          )}
                        </div>
                        {rec.description && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{rec.description}</p>
                        )}
                        {rec.dueDate && (
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Jatuh tempo: {formatDate(new Date(rec.dueDate), "dd MMM yyyy")}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 shrink-0 min-w-[150px]">
                        <div className="text-left sm:text-right">
                          <p className="currency-display text-sm font-bold text-foreground">
                            {formatIDR(remaining)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Total: {formatIDR(Number(rec.amount), { compact: true })} ({Math.round(percent)}% ditagih)
                          </p>
                        </div>
                        {!rec.isSettled && (
                          <Button
                            onClick={() => {
                              setSelectedReceivable(rec);
                              setIsActionOpen(true);
                            }}
                            size="sm"
                            className="bg-primary text-white text-xs font-semibold h-8"
                          >
                            Tagih / Terima
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── DIALOG: Tambah Hutang/Piutang Baru ───────────── */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {activeTab === "debt" ? "Catat Hutang Baru" : "Catat Piutang Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                {activeTab === "debt" ? "Pemberi Pinjaman (Kreditor)" : "Peminjam (Debitor)"}
              </Label>
              <Input
                id="name"
                placeholder={activeTab === "debt" ? "cth: Bank Mandiri, Om Tio" : "cth: Tetangga sebelah, Teman kantor"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Nominal Pinjaman (Rp)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="due-date">Tanggal Jatuh Tempo (Opsional)</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Keterangan Tambahan (Opsional)</Label>
              <Textarea
                id="desc"
                placeholder="Tuliskan tujuan pinjaman atau kesepakatan cicilan..."
                rows={2}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsNewOpen(false)}>Batal</Button>
              <Button type="submit" className="gradient-primary text-white" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Catat
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: Bayar / Terima ──────────────────────── */}
      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDebt ? `Bayar Hutang: ${selectedDebt.creditor}` : `Terima Piutang: ${selectedReceivable?.debtor}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleActionSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="action-amount">Nominal Transaksi (Rp)</Label>
              <Input
                id="action-amount"
                type="number"
                placeholder="0"
                value={actionAmount}
                onChange={(e) => setActionAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="action-note">Catatan Pembayaran (Opsional)</Label>
              <Input
                id="action-note"
                placeholder="cth: Cicilan ke-3, Pembayaran lunas"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsActionOpen(false);
                setSelectedDebt(null);
                setSelectedReceivable(null);
              }}>Batal</Button>
              <Button type="submit" className="gradient-primary text-white" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Transaksi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
