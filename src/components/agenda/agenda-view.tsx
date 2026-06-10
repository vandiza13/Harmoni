"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Clock, Trash2, Tag, ChevronLeft, ChevronRight, Loader2, Info } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createCalendarEvent, deleteCalendarEvent } from "@/actions/modules";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  familyId: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  allDay: boolean;
  category: "GENERAL" | "SCHOOL" | "HEALTH" | "BIRTHDAY" | "APPOINTMENT" | "HOLIDAY" | "OTHER";
  color: string | null;
  reminderMinutes: number | null;
}

interface AgendaViewProps {
  initialEvents: CalendarEvent[];
  selectedMonth: number; // 1-12
  selectedYear: number;
}

const PRESET_CATEGORIES = [
  { label: "Umum 📌", value: "GENERAL" },
  { label: "Sekolah & Anak 🏫", value: "SCHOOL" },
  { label: "Kesehatan 🏥", value: "HEALTH" },
  { label: "Ulang Tahun 🎂", value: "BIRTHDAY" },
  { label: "Pertemuan/Janji 📋", value: "APPOINTMENT" },
  { label: "Liburan 🏖", value: "HOLIDAY" },
  { label: "Lainnya 📅", value: "OTHER" },
];

const PRESET_COLORS = [
  { name: "Biru", value: "#3B82F6" },
  { name: "Hijau", value: "#10B981" },
  { name: "Merah", value: "#EF4444" },
  { name: "Kuning", value: "#F59E0B" },
  { name: "Ungu", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
];

const CATEGORY_EMOJI: Record<string, string> = {
  GENERAL: "📌",
  SCHOOL: "🏫",
  HEALTH: "🏥",
  BIRTHDAY: "🎂",
  APPOINTMENT: "📋",
  HOLIDAY: "🏖",
  OTHER: "📅",
};

export function AgendaView({ initialEvents, selectedMonth, selectedYear }: AgendaViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Selected Day state (defaults to today or 1st of month)
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  // Dialog States
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Form States
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newAllDay, setNewAllDay] = useState(false);
  const [newCategory, setNewCategory] = useState("GENERAL");
  const [newColor, setNewColor] = useState("#3B82F6");

  // Calendar calculations
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay();

  // Navigation functions
  function handlePrevMonth() {
    let nextMonth = selectedMonth - 1;
    let nextYear = selectedYear;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }
    router.push(`/dashboard/agenda?month=${nextMonth}&year=${nextYear}`);
  }

  function handleNextMonth() {
    let nextMonth = selectedMonth + 1;
    let nextYear = selectedYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    router.push(`/dashboard/agenda?month=${nextMonth}&year=${nextYear}`);
  }

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  // Check if a day has events
  const daysWithEvents = initialEvents.map(e => new Date(e.startDate).getDate());

  // Selected day's events
  const dayEvents = initialEvents.filter(e => {
    const d = new Date(e.startDate);
    return d.getDate() === selectedDay && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !newStartDate) {
      toast.error("Judul dan tanggal mulai wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await createCalendarEvent({
        title: newTitle,
        description: newDesc || undefined,
        startDate: newStartDate,
        endDate: newEndDate || undefined,
        allDay: newAllDay,
        category: newCategory,
        color: newColor,
      });

      if (res.success) {
        toast.success(`Acara "${newTitle}" berhasil dijadwalkan! 📅`);
        setIsNewEventOpen(false);
        resetForm();
        router.refresh();
      } else {
        toast.error(res.error || "Gagal membuat agenda.");
      }
    });
  }

  async function handleDelete() {
    if (!selectedEvent) return;

    startTransition(async () => {
      const res = await deleteCalendarEvent(selectedEvent.id);
      if (res.success) {
        toast.success(`Agenda "${selectedEvent.title}" berhasil dihapus.`);
        setIsDeleteOpen(false);
        setSelectedEvent(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus agenda.");
      }
    });
  }

  function resetForm() {
    setNewTitle("");
    setNewDesc("");
    setNewStartDate("");
    setNewEndDate("");
    setNewAllDay(false);
    setNewCategory("GENERAL");
    setNewColor("#3B82F6");
  }

  // Render Calendar Days
  const calendarCells = [];
  // Empty slots for days of prev month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="h-10 sm:h-12 border-b border-r border-border/40 opacity-30" />);
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const hasEvent = daysWithEvents.includes(day);
    const isSelected = selectedDay === day;
    const isToday = day === new Date().getDate() && selectedMonth === (new Date().getMonth() + 1) && selectedYear === new Date().getFullYear();

    calendarCells.push(
      <button
        key={`day-${day}`}
        onClick={() => setSelectedDay(day)}
        className={cn(
          "h-10 sm:h-12 border-b border-r border-border/40 relative flex flex-col items-center justify-center transition-all hover:bg-muted/50",
          isSelected && "bg-primary/10 text-primary font-bold",
          isToday && "ring-1 ring-primary/45 rounded-lg"
        )}
      >
        <span className={cn(
          "text-xs sm:text-sm",
          isToday && "bg-primary text-white h-6 w-6 rounded-full flex items-center justify-center font-bold"
        )}>
          {day}
        </span>
        {hasEvent && (
          <div className="absolute bottom-1.5 flex gap-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header Action ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">📅 Agenda Keluarga</h2>
          <p className="text-sm text-muted-foreground">Sinkronisasikan jadwal dan agenda penting bersama keluarga</p>
        </div>
        <Button onClick={() => setIsNewEventOpen(true)} className="gradient-primary text-white shadow-soft hover:shadow-soft-lg gap-2">
          <Plus className="h-4 w-4" />
          Tambah Agenda
        </Button>
      </div>

      {/* ─── Calendar Panel & Selected Day Events ─────────── */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Monthly Grid view */}
        <div className="md:col-span-2 card-harmoni p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground">{monthName}</h3>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center font-semibold text-xs text-muted-foreground border-b border-border/80 pb-2">
            <div>Min</div>
            <div>Sen</div>
            <div>Sel</div>
            <div>Rab</div>
            <div>Kam</div>
            <div>Jum</div>
            <div>Sab</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 border-l border-t border-border/40 rounded-lg overflow-hidden bg-card">
            {calendarCells}
          </div>
        </div>

        {/* Right Column: Events for selected day */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-foreground">
            Agenda Tanggal {selectedDay} {new Date(selectedYear, selectedMonth - 1).toLocaleDateString("id-ID", { month: "short" })}
          </h3>

          <div className="card-harmoni p-4 space-y-4 min-h-[300px]">
            {dayEvents.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p className="text-3xl mb-2">🎈</p>
                <p className="text-xs">Tidak ada agenda penting terjadwal.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3.5 rounded-xl border border-border/50 flex items-start justify-between gap-3 bg-muted/20"
                    style={{ borderLeft: `4px solid ${event.color || "#3B82F6"}` }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-base">{CATEGORY_EMOJI[event.category] || "📅"}</span>
                        <h4 className="font-bold text-xs text-foreground truncate">{event.title}</h4>
                      </div>
                      {event.description && (
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-2.5 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {event.allDay
                            ? "Sepanjang hari"
                            : `${formatDate(event.startDate, "HH:mm")} ${
                                event.endDate ? ` - ${formatDate(event.endDate, "HH:mm")}` : ""
                              }`}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsDeleteOpen(true);
                      }}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── DIALOG: Tambah Agenda Baru ───────────────────── */}
      <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Buat Agenda Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="event-title">Judul Acara</Label>
              <Input
                id="event-title"
                placeholder="cth: Imunisasi Adek, Rapat Komite Sekolah"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-desc">Keterangan / Detail (Opsional)</Label>
              <Textarea
                id="event-desc"
                placeholder="cth: Bawa berkas rapor dan alat tulis"
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="event-start">Waktu Mulai</Label>
                <Input
                  id="event-start"
                  type="datetime-local"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event-end">Waktu Selesai (Opsional)</Label>
                <Input
                  id="event-end"
                  type="datetime-local"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-muted/40 rounded-xl">
              <div className="space-y-0.5">
                <Label htmlFor="event-allday" className="text-xs">Sepanjang Hari</Label>
                <p className="text-[10px] text-muted-foreground">Aktifkan jika berlangsung seharian</p>
              </div>
              <Switch
                id="event-allday"
                checked={newAllDay}
                onCheckedChange={setNewAllDay}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="event-category">Kategori</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger id="event-category">
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
                <Label>Warna Penanda</Label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setNewColor(c.value)}
                      className="h-6 w-6 rounded-full border border-border transition-all flex items-center justify-center"
                      style={{ backgroundColor: c.value }}
                    >
                      {newColor === c.value && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsNewEventOpen(false)}>Batal</Button>
              <Button type="submit" className="gradient-primary text-white" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Jadwalkan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: Hapus Agenda ────────────────────────── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">Hapus Agenda</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus agenda <strong>{selectedEvent?.title}</strong> dari kalender keluarga? Tindakan ini tidak bisa dibatalkan.
            </p>
          </div>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => {
              setIsDeleteOpen(false);
              setSelectedEvent(null);
            }}>Batal</Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
