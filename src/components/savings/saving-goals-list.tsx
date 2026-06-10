"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Bird, Calendar, Trash2, ArrowUpRight, CheckCircle2, ChevronRight, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { formatIDR, formatDate, calcPercent } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createSavingGoal, addSavingContribution } from "@/actions/modules";

interface Contribution {
  id: string;
  amount: any;
  note: string | null;
  date: Date;
}

interface SavingGoal {
  id: string;
  name: string;
  targetAmount: any;
  currentAmount: any;
  targetDate: Date | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  isCompleted: boolean;
  contributions: Contribution[];
}

interface SavingGoalsListProps {
  initialGoals: SavingGoal[];
}

const PRESET_COLORS = [
  { name: "Emerald", value: "#10B981" },
  { name: "Primary/Green", value: "#4CAF50" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Rose", value: "#F43F5E" },
];

const PRESET_ICONS = ["🎯", "🏠", "🚗", "✈️", "🎓", "💻", "💍", "👶", "🏥", "💰", "🌴", "🛵"];

export function SavingGoalsList({ initialGoals }: SavingGoalsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dialog States
  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);

  // New Goal Form States
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [newGoalIcon, setNewGoalIcon] = useState("🎯");
  const [newGoalColor, setNewGoalColor] = useState("#4CAF50");

  // Contribution Form States
  const [contribAmount, setContribAmount] = useState("");
  const [contribNote, setContribNote] = useState("");

  // Statistics
  const activeGoals = initialGoals.filter(g => !g.isCompleted);
  const completedGoals = initialGoals.filter(g => g.isCompleted);
  const totalTarget = initialGoals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
  const totalSaved = initialGoals.reduce((sum, g) => sum + Number(g.currentAmount), 0);
  const totalPercent = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  // Flattened recent contributions
  const recentContributions = initialGoals
    .flatMap(g => g.contributions.map(c => ({ ...c, goalName: g.name, goalIcon: g.icon })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newGoalName || !newGoalTarget) {
      toast.error("Nama dan target nominal wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await createSavingGoal({
        name: newGoalName,
        targetAmount: parseFloat(newGoalTarget),
        targetDate: newGoalDate || undefined,
        description: newGoalDesc || undefined,
        icon: newGoalIcon,
        color: newGoalColor,
      });

      if (res.success) {
        toast.success("Target tabungan berhasil dibuat! 🚀");
        setIsNewGoalOpen(false);
        resetGoalForm();
        router.refresh();
      } else {
        toast.error(res.error || "Gagal membuat target tabungan.");
      }
    });
  }

  async function handleAddContribution(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGoal || !contribAmount) {
      toast.error("Nominal wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await addSavingContribution(
        selectedGoal.id,
        parseFloat(contribAmount),
        contribNote || undefined
      );

      if (res.success) {
        toast.success(`Berhasil menambah tabungan ke "${selectedGoal.name}"! 💰`);
        setIsContributionOpen(false);
        setContribAmount("");
        setContribNote("");
        setSelectedGoal(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menambah tabungan.");
      }
    });
  }

  function resetGoalForm() {
    setNewGoalName("");
    setNewGoalTarget("");
    setNewGoalDate("");
    setNewGoalDesc("");
    setNewGoalIcon("🎯");
    setNewGoalColor("#4CAF50");
  }

  return (
    <div className="space-y-6">
      {/* ─── Header Action ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">🐔 Celengan Keluarga</h2>
          <p className="text-sm text-muted-foreground">Kumpulkan tabungan bersama untuk masa depan impian</p>
        </div>
        <Button onClick={() => setIsNewGoalOpen(true)} className="gradient-primary text-white shadow-soft hover:shadow-soft-lg gap-2">
          <Plus className="h-4 w-4" />
          Target Baru
        </Button>
      </div>

      {/* ─── Summary Cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Saved Card */}
        <div className="card-harmoni p-5 relative overflow-hidden bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <div className="absolute right-4 top-4 text-primary opacity-20">
            <Bird className="h-12 w-12" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Terkumpul</p>
          <p className="currency-display text-2xl font-extrabold text-primary mt-2">
            {formatIDR(totalSaved)}
          </p>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Dari total target {formatIDR(totalTarget, { compact: true })}</span>
            <span className="font-bold text-primary">{Math.round(totalPercent)}%</span>
          </div>
          <Progress value={totalPercent} className="h-1.5 mt-2 [&>div]:bg-primary" />
        </div>

        {/* Goals Progress */}
        <div className="card-harmoni p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Aktif</p>
          <p className="text-2xl font-bold text-foreground mt-2">
            {activeGoals.length} <span className="text-sm font-normal text-muted-foreground">dari {initialGoals.length} target</span>
          </p>
          <div className="mt-6 flex gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
              {completedGoals.length} Selesai
            </Badge>
            <Badge variant="outline" className="border-border">
              {activeGoals.length} Berjalan
            </Badge>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="card-harmoni p-5 flex flex-col justify-between bg-amber-50 border-amber-200 dark:bg-gradient-to-br dark:from-accent/10 dark:to-transparent dark:border-accent/20">
          <div>
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Tips Harmoni</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Konsistensi adalah kunci! Menyisihkan Rp 10.000 setiap hari secara rutin lebih baik daripada nominal besar yang tidak konsisten.
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground/80 mt-3 font-medium">#SemangatMenabung</p>
        </div>
      </div>

      {/* ─── Main Content Grid ───────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Goals list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg text-foreground">Target Impian</h3>

          {initialGoals.length === 0 ? (
            <div className="card-harmoni p-8 text-center text-muted-foreground">
              <p className="text-4xl mb-3">🎯</p>
              <p className="font-medium">Belum ada target tabungan</p>
              <p className="text-xs mt-1">Buat target baru untuk mulai mengumpulkan uang demi rencana keluarga</p>
              <Button onClick={() => setIsNewGoalOpen(true)} variant="outline" className="mt-4 border-primary text-primary hover:bg-primary/5">
                Buat Target Sekarang
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {initialGoals.map((goal) => {
                const percent = calcPercent(Number(goal.currentAmount), Number(goal.targetAmount));
                const goalColor = goal.color || "#4CAF50";

                return (
                  <div
                    key={goal.id}
                    className="card-harmoni p-5 flex flex-col justify-between hover:-translate-y-0.5 duration-200"
                    style={{ borderTop: `4px solid ${goalColor}` }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl shrink-0 p-1 bg-muted rounded-xl">
                            {goal.icon || "🎯"}
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-bold text-foreground truncate">{goal.name}</h4>
                            {goal.targetDate && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Calendar className="h-3 w-3" />
                                <span>Sampai {formatDate(new Date(goal.targetDate), "dd MMM yyyy")}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        {goal.isCompleted ? (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Selesai
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]" style={{ color: goalColor, backgroundColor: `${goalColor}10` }}>
                            Aktif
                          </Badge>
                        )}
                      </div>

                      {goal.description && (
                        <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                          {goal.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 space-y-2.5">
                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-foreground">{formatIDR(Number(goal.currentAmount))}</span>
                          <span className="text-muted-foreground">dari {formatIDR(Number(goal.targetAmount), { compact: true })}</span>
                        </div>
                        <Progress value={percent} className="h-2" style={{ "--progress-bg": goalColor } as any} />
                        <div className="text-[10px] text-right text-muted-foreground">
                          Progres: <span className="font-bold" style={{ color: goalColor }}>{Math.round(percent)}%</span>
                        </div>
                      </div>

                      {/* Add contribution btn */}
                      {!goal.isCompleted && (
                        <Button
                          onClick={() => {
                            setSelectedGoal(goal);
                            setIsContributionOpen(true);
                          }}
                          size="sm"
                          className="w-full text-xs font-semibold gap-1"
                          style={{
                            backgroundColor: goalColor,
                            color: "#fff",
                            boxShadow: `0 4px 12px ${goalColor}20`
                          }}
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          Isi Celengan
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent contributions */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-foreground">Riwayat Pengisian</h3>

          <div className="card-harmoni p-4 space-y-4">
            {recentContributions.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Belum ada riwayat pengisian celengan.
              </p>
            ) : (
              <div className="space-y-3">
                {recentContributions.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                    <span className="text-lg shrink-0 mt-0.5 p-1 bg-muted rounded-lg">
                      {c.goalIcon || "🎯"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-xs font-bold text-foreground truncate">{c.goalName}</p>
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 shrink-0">
                          +{formatIDR(Number(c.amount), { compact: true })}
                        </span>
                      </div>
                      {c.note && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                          &quot;{c.note}&quot;
                        </p>
                      )}
                      <p className="text-[9px] text-muted-foreground/80 mt-1">
                        {formatDate(c.date, "dd MMM yyyy, HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── DIALOG: Target Baru ─────────────────────────── */}
      <Dialog open={isNewGoalOpen} onOpenChange={setIsNewGoalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Buat Target Tabungan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGoal} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="goal-name">Nama Impian</Label>
              <Input
                id="goal-name"
                placeholder="cth: Liburan Akhir Tahun, Renovasi Dapur"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-target">Target Nominal (Rp)</Label>
              <Input
                id="goal-target"
                type="number"
                placeholder="0"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-date">Target Tanggal Terpenuhi (Opsional)</Label>
              <Input
                id="goal-date"
                type="date"
                value={newGoalDate}
                onChange={(e) => setNewGoalDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-desc">Deskripsi Singkat (Opsional)</Label>
              <Textarea
                id="goal-desc"
                placeholder="Tuliskan detail rencana Anda..."
                rows={2}
                value={newGoalDesc}
                onChange={(e) => setNewGoalDesc(e.target.value)}
              />
            </div>

            {/* Icon picker */}
            <div className="space-y-1.5">
              <Label>Pilih Ikon</Label>
              <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-xl max-h-[90px] overflow-y-auto">
                {PRESET_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewGoalIcon(icon)}
                    className={`h-8 w-8 text-lg rounded-lg flex items-center justify-center transition-all ${
                      newGoalIcon === icon ? "bg-primary text-white scale-110 shadow-sm" : "hover:bg-muted"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div className="space-y-1.5">
              <Label>Pilih Tema Warna</Label>
              <div className="flex gap-2.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNewGoalColor(c.value)}
                    className="h-7 w-7 rounded-full border border-border transition-all flex items-center justify-center"
                    style={{ backgroundColor: c.value }}
                  >
                    {newGoalColor === c.value && (
                      <span className="h-2.5 w-2.5 rounded-full bg-white shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsNewGoalOpen(false)}>Batal</Button>
              <Button type="submit" className="gradient-primary text-white" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Target
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: Isi Celengan ───────────────────────── */}
      <Dialog open={isContributionOpen} onOpenChange={setIsContributionOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Isi Celengan: {selectedGoal?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddContribution} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="contrib-amount">Nominal Tabungan (Rp)</Label>
              <Input
                id="contrib-amount"
                type="number"
                placeholder="0"
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contrib-note">Catatan / Sumber Dana (Opsional)</Label>
              <Input
                id="contrib-note"
                placeholder="cth: Sisa uang belanja, Bonus bulanan"
                value={contribNote}
                onChange={(e) => setContribNote(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsContributionOpen(false);
                setSelectedGoal(null);
              }}>Batal</Button>
              <Button type="submit" className="text-white" style={{ backgroundColor: selectedGoal?.color || "#4CAF50" }} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Masukkan Celengan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
