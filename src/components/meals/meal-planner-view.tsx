"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight, Calendar, BookOpen, Edit2, Loader2, Sparkles, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { saveMealPlanItem } from "@/actions/modules";
import { cn } from "@/lib/utils";

interface MealPlanItem {
  id: string;
  mealPlanId: string;
  date: Date;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  menuName: string;
  recipe: string | null;
  notes: string | null;
}

interface MealPlan {
  id: string;
  weekStart: Date;
  items: MealPlanItem[];
}

interface MealPlannerViewProps {
  initialPlan: MealPlan | null;
  selectedWeekStart: string; // ISO string
}

const MEAL_TYPES = [
  { label: "Sarapan 🍳", value: "BREAKFAST" },
  { label: "Makan Siang 🍲", value: "LUNCH" },
  { label: "Makan Malam 🍛", value: "DINNER" },
  { label: "Camilan 🍎", value: "SNACK" },
];

export function MealPlannerView({ initialPlan, selectedWeekStart }: MealPlannerViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<Date | null>(null);
  const [editingType, setEditingType] = useState<"BREAKFAST" | "LUNCH" | "DINNER" | "SNACK">("BREAKFAST");

  // Form States
  const [menuName, setMenuName] = useState("");
  const [recipe, setRecipe] = useState("");
  const [notes, setNotes] = useState("");

  const weekStartDate = new Date(selectedWeekStart);

  // Generate 7 days of the week starting from Monday
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekRangeLabel = `${formatDate(weekStartDate, "dd MMM")} - ${formatDate(weekEnd, "dd MMM yyyy")}`;

  function handlePrevWeek() {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() - 7);
    router.push(`/dashboard/meal-planner?week=${d.toISOString().split("T")[0]}`);
  }

  function handleNextWeek() {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + 7);
    router.push(`/dashboard/meal-planner?week=${d.toISOString().split("T")[0]}`);
  }

  // Find item by date and type
  function getMealItem(date: Date, type: string) {
    if (!initialPlan) return null;
    return initialPlan.items.find(
      (item) =>
        new Date(item.date).toDateString() === date.toDateString() &&
        item.mealType === type
    );
  }

  function openEditModal(date: Date, type: any) {
    const item = getMealItem(date, type);
    setEditingDay(date);
    setEditingType(type);
    setMenuName(item?.menuName || "");
    setRecipe(item?.recipe || "");
    setNotes(item?.notes || "");
    setIsEditOpen(true);
  }

  async function handleSaveMenu(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDay || !menuName) {
      toast.error("Nama menu wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await saveMealPlanItem({
        weekStart: selectedWeekStart,
        date: editingDay.toISOString().split("T")[0],
        mealType: editingType,
        menuName,
        recipe: recipe || undefined,
        notes: notes || undefined,
      });

      if (res.success) {
        toast.success("Menu makan berhasil disimpan! 🍽️");
        setIsEditOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menyimpan menu.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* ─── Header Action ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">📅 Rencana Menu Makan</h2>
          <p className="text-sm text-muted-foreground">Rencanakan nutrisi dan menu makan mingguan keluarga Anda</p>
        </div>
      </div>

      {/* ─── Week selector & Tips ────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Selector */}
        <div className="md:col-span-2 card-harmoni p-4 flex items-center justify-between bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm text-foreground">{weekRangeLabel}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevWeek} className="h-9">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Minggu Lalu
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextWeek} className="h-9">
              Minggu Depan
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Tips */}
        <div className="card-harmoni p-4 flex items-start gap-2.5 bg-gradient-to-br from-amber-50 dark:from-amber-950/20 to-transparent border-amber-200 dark:border-amber-900/30">
          <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Tips Nutrisi</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Membuat rencana makan mingguan terbukti menghemat pengeluaran belanja dapur hingga 20% dan mencegah makanan terbuang sia-sia!
            </p>
          </div>
        </div>
      </div>

      {/* ─── Day-by-Day Meal Grid ────────────────────────── */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-foreground">Jadwal Menu</h3>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {weekDays.map((day) => {
            const dayName = day.toLocaleDateString("id-ID", { weekday: "long" });
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "card-harmoni p-3.5 flex flex-col justify-between space-y-3 border-t-4",
                  isToday ? "border-primary bg-primary/5 dark:bg-primary/10" : "border-border"
                )}
              >
                {/* Day Header */}
                <div className="pb-2 border-b border-border/50">
                  <p className="font-bold text-xs text-foreground">{dayName}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(day, "dd MMM yyyy")}</p>
                </div>

                {/* Meal slots for the day */}
                <div className="space-y-2 flex-1">
                  {MEAL_TYPES.map((type) => {
                    const item = getMealItem(day, type.value);
                    return (
                      <div
                        key={type.value}
                        onClick={() => openEditModal(day, type.value)}
                        className={cn(
                          "p-2 rounded-lg border text-left cursor-pointer group hover:bg-muted/40 transition-colors",
                          item ? "border-primary/20 bg-primary/5 dark:bg-primary/10" : "border-dashed border-border hover:border-primary/40"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-[9px] font-semibold text-muted-foreground uppercase">{type.label}</p>
                          <Edit2 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
                        </div>
                        <p className="text-xs font-bold text-foreground truncate mt-1">
                          {item ? item.menuName : <span className="text-muted-foreground font-normal text-[10px]">Tentukan menu</span>}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── DIALOG: Edit Menu ────────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              Rencana Makan: {editingDay && formatDate(editingDay, "EEEE, dd MMM")} (
              {MEAL_TYPES.find((m) => m.value === editingType)?.label})
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveMenu} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="menu-name">Nama Menu Makanan</Label>
              <Input
                id="menu-name"
                placeholder="cth: Nasi Goreng Kampung, Sup Ayam Klaten"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="menu-recipe">Bahan / Resep Singkat (Opsional)</Label>
              <Textarea
                id="menu-recipe"
                placeholder="cth: Ayam 500g, Wortel, Kentang, Bawang putih..."
                rows={2.5}
                value={recipe}
                onChange={(e) => setRecipe(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="menu-notes">Catatan Tambahan (Opsional)</Label>
              <Input
                id="menu-notes"
                placeholder="cth: Kurangi garam untuk nenek"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
              <Button type="submit" className="gradient-primary text-white" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Menu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
