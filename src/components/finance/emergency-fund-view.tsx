"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shield, Info, ArrowUpRight, Scale, CreditCard, Sparkles, Loader2 } from "lucide-react";
import { formatIDR, calcPercent } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { updateEmergencyFund } from "@/actions/modules";
import { cn } from "@/lib/utils";

interface EmergencyFund {
  id: string;
  familyId: string;
  targetMonths: number;
  currentAmount: any;
}

interface EmergencyFundViewProps {
  fund: EmergencyFund | null;
  avgMonthlyExpense: number;
}

export function EmergencyFundView({ fund, avgMonthlyExpense }: EmergencyFundViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isEditTargetOpen, setIsEditTargetOpen] = useState(false);

  // Form States
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"ADD" | "SET">("ADD");

  const [targetMonths, setTargetMonths] = useState(fund?.targetMonths || 6);
  const [monthlyExpenseInput, setMonthlyExpenseInput] = useState(
    avgMonthlyExpense > 0 ? String(avgMonthlyExpense) : "5000000"
  );

  const currentAmount = fund ? Number(fund.currentAmount) : 0;
  const estimatedMonthly = parseFloat(monthlyExpenseInput) || 0;
  const targetAmount = estimatedMonthly * targetMonths;
  const percent = targetAmount > 0 ? calcPercent(currentAmount, targetAmount) : 0;

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustAmount) {
      toast.error("Nominal wajib diisi.");
      return;
    }

    const value = parseFloat(adjustAmount);
    const newAmount = adjustType === "ADD" ? currentAmount + value : value;

    startTransition(async () => {
      const res = await updateEmergencyFund({
        targetMonths,
        currentAmount: newAmount,
      });

      if (res.success) {
        toast.success("Dana darurat berhasil diperbarui! 🛡️");
        setIsAdjustOpen(false);
        setAdjustAmount("");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui dana darurat.");
      }
    });
  }

  async function handleSaveTarget(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const res = await updateEmergencyFund({
        targetMonths,
        currentAmount,
      });

      if (res.success) {
        toast.success("Target dana darurat berhasil diperbarui!");
        setIsEditTargetOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui target.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* ─── Header Action ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">🛡️ Dana Darurat</h2>
          <p className="text-sm text-muted-foreground">Jaring pengaman finansial keluarga untuk menghadapi situasi tak terduga</p>
        </div>
      </div>

      {/* ─── Main Info Grid ──────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Progress Indicator */}
        <div className="md:col-span-2 card-harmoni p-5 flex flex-col justify-between space-y-4 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden border-primary/25">
          <div className="absolute right-4 top-4 text-primary opacity-25">
            <Shield className="h-16 w-16" />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dana Terkumpul Saat Ini</p>
            <p className="currency-display text-3xl font-extrabold text-primary mt-2">
              {formatIDR(currentAmount)}
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Progres Keamanan Dana Darurat</span>
              <span className="font-bold text-primary">{Math.round(percent)}%</span>
            </div>
            <Progress value={percent} className="h-2 mt-2 [&>div]:bg-primary" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setIsAdjustOpen(true)}
              className="gradient-primary text-white text-xs font-semibold shadow-soft hover:shadow-soft-lg px-4"
            >
              Sesuaikan Saldo
            </Button>
            <Button
              onClick={() => setIsEditTargetOpen(true)}
              variant="outline"
              className="text-xs px-4"
            >
              Konfigurasi Target
            </Button>
          </div>
        </div>

        {/* Target Calculation Box */}
        <div className="card-harmoni p-5 space-y-4">
          <h3 className="font-bold text-sm text-foreground">Detail Target Pengamanan</h3>
          
          <div className="space-y-3 divide-y divide-border">
            <div className="flex justify-between text-xs pt-1 first:pt-0">
              <span className="text-muted-foreground">Target Waktu (Bulan)</span>
              <span className="font-bold text-foreground">{targetMonths} Bulan</span>
            </div>

            <div className="flex justify-between text-xs pt-2">
              <span className="text-muted-foreground">Estimasi Pengeluaran/Bulan</span>
              <span className="font-bold text-foreground">{formatIDR(estimatedMonthly)}</span>
            </div>

            <div className="flex justify-between text-xs pt-2">
              <span className="text-muted-foreground">Target Dana Ideal</span>
              <span className="font-bold text-primary">{formatIDR(targetAmount)}</span>
            </div>

            <div className="flex justify-between text-xs pt-2">
              <span className="text-muted-foreground">Selisih Kekurangan</span>
              <span className="font-bold text-destructive">
                {formatIDR(Math.max(0, targetAmount - currentAmount))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Informational Advice card ───────────────────── */}
      <div className="card-harmoni p-5 bg-gradient-to-br from-amber-50 dark:from-amber-950/20 to-transparent border-amber-200 dark:border-amber-900/30 flex gap-4 items-start">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
          💡
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-amber-800 dark:text-amber-400">Panduan Standar Dana Darurat</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Secara umum, dana darurat dihitung berdasarkan pengeluaran bulanan rutin keluarga:
          </p>
          <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1 mt-1.5">
            <li><strong>3 Bulan:</strong> Cocok untuk lajang / tanpa tanggungan.</li>
            <li><strong>6 Bulan:</strong> Standar aman untuk keluarga dengan 1-2 anak.</li>
            <li><strong>9 - 12 Bulan:</strong> Sangat direkomendasikan jika memiliki pekerjaan tidak tetap (freelance / bisnis sendiri).</li>
          </ul>
        </div>
      </div>

      {/* ─── DIALOG: Sesuaikan Saldo ──────────────────────── */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Sesuaikan Saldo Dana Darurat</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjust} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="adjust-type">Metode Pengisian</Label>
              <Select value={adjustType} onValueChange={(v: any) => setAdjustType(v)}>
                <SelectTrigger id="adjust-type">
                  <SelectValue placeholder="Pilih metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADD">Tambah Dana Darurat (+)</SelectItem>
                  <SelectItem value="SET">Atur Jumlah Saldo Baru (=)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adjust-amount">Nominal (Rp)</Label>
              <Input
                id="adjust-amount"
                type="number"
                placeholder="0"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAdjustOpen(false)}>Batal</Button>
              <Button type="submit" className="gradient-primary text-white" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: Edit Target ──────────────────────────── */}
      <Dialog open={isEditTargetOpen} onOpenChange={setIsEditTargetOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Konfigurasi Target Dana Darurat</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTarget} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="target-months">Jumlah Bulan Pengamanan</Label>
              <Select
                value={String(targetMonths)}
                onValueChange={(v) => setTargetMonths(parseInt(v))}
              >
                <SelectTrigger id="target-months">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Bulan (Minimal)</SelectItem>
                  <SelectItem value="6">6 Bulan (Standar Keluarga)</SelectItem>
                  <SelectItem value="9">9 Bulan (Keluarga Besar)</SelectItem>
                  <SelectItem value="12">12 Bulan (Maksimum Keamanan)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="monthly-expense">Estimasi Pengeluaran Bulanan Keluarga (Rp)</Label>
              <Input
                id="monthly-expense"
                type="number"
                value={monthlyExpenseInput}
                onChange={(e) => setMonthlyExpenseInput(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditTargetOpen(false)}>Batal</Button>
              <Button type="submit" className="gradient-primary text-white" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Konfigurasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
