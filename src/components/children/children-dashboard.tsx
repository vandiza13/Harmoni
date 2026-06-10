"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Baby, Calendar, Scale, Ruler, Brain, CheckCircle, Clock, Trash2, Heart, Award, Loader2, Sparkles, PlusCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createChild, addGrowthRecord, addImmunization, updateImmunizationStatus } from "@/actions/modules";
import { cn } from "@/lib/utils";

interface Immunization {
  id: string;
  name: string;
  date: Date | null;
  nextDue: Date | null;
  status: "PENDING" | "DONE" | "SKIPPED";
  location: string | null;
  note: string | null;
}

interface GrowthRecord {
  id: string;
  date: Date;
  height: any;
  weight: any;
  headCircumference: any;
  note: string | null;
}

interface Child {
  id: string;
  name: string;
  birthDate: Date;
  gender: "MALE" | "FEMALE" | null;
  photoUrl: string | null;
  schoolName: string | null;
  grade: string | null;
  notes: string | null;
  immunizations: Immunization[];
  growthRecords: GrowthRecord[];
}

interface ChildrenDashboardProps {
  initialChildren: Child[];
}

export function ChildrenDashboard({ initialChildren }: ChildrenDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active Child Selection
  const [activeChildId, setActiveChildId] = useState<string | null>(
    initialChildren.length > 0 ? initialChildren[0].id : null
  );

  // Dialog States
  const [isNewChildOpen, setIsNewChildOpen] = useState(false);
  const [isNewGrowthOpen, setIsNewGrowthOpen] = useState(false);
  const [isNewImmunOpen, setIsNewImmunOpen] = useState(false);

  // New Child Form States
  const [newChildName, setNewChildName] = useState("");
  const [newChildBirthDate, setNewChildBirthDate] = useState("");
  const [newChildGender, setNewChildGender] = useState<"MALE" | "FEMALE">("MALE");
  const [newChildSchool, setNewChildSchool] = useState("");
  const [newChildGrade, setNewChildGrade] = useState("");
  const [newChildNotes, setNewChildNotes] = useState("");

  // New Growth Form States
  const [growthDate, setGrowthDate] = useState(new Date().toISOString().split("T")[0]);
  const [growthHeight, setGrowthHeight] = useState("");
  const [growthWeight, setGrowthWeight] = useState("");
  const [growthHead, setGrowthHead] = useState("");
  const [growthNote, setGrowthNote] = useState("");

  // New Immunization Form States
  const [immunName, setImmunName] = useState("");
  const [immunDate, setImmunDate] = useState("");
  const [immunNextDue, setImmunNextDue] = useState("");
  const [immunStatus, setImmunStatus] = useState<"PENDING" | "DONE">("PENDING");
  const [immunLoc, setImmunLoc] = useState("");
  const [immunNote, setImmunNote] = useState("");

  const activeChild = initialChildren.find((c) => c.id === activeChildId);

  // Calculate age helper
  function calculateAge(birthDate: Date) {
    const today = new Date();
    const birth = new Date(birthDate);
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }

    if (years === 0) {
      return `${months} bulan`;
    }
    return `${years} tahun ${months} bulan`;
  }

  async function handleCreateChild(e: React.FormEvent) {
    e.preventDefault();
    if (!newChildName || !newChildBirthDate) {
      toast.error("Nama dan tanggal lahir wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await createChild({
        name: newChildName,
        birthDate: newChildBirthDate,
        gender: newChildGender,
        schoolName: newChildSchool || undefined,
        grade: newChildGrade || undefined,
        notes: newChildNotes || undefined,
      });

      if (res.success) {
        toast.success(`Profil anak "${newChildName}" berhasil dibuat! 👶`);
        setIsNewChildOpen(false);
        resetChildForm();
        router.refresh();
      } else {
        toast.error(res.error || "Gagal membuat profil anak.");
      }
    });
  }

  async function handleAddGrowth(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChildId || !growthDate) {
      toast.error("Tanggal pencatatan wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await addGrowthRecord(activeChildId, {
        date: growthDate,
        height: growthHeight ? parseFloat(growthHeight) : undefined,
        weight: growthWeight ? parseFloat(growthWeight) : undefined,
        headCircumference: growthHead ? parseFloat(growthHead) : undefined,
        note: growthNote || undefined,
      });

      if (res.success) {
        toast.success("Catatan pertumbuhan berhasil disimpan! 📈");
        setIsNewGrowthOpen(false);
        resetGrowthForm();
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menyimpan catatan pertumbuhan.");
      }
    });
  }

  async function handleAddImmunization(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChildId || !immunName) {
      toast.error("Nama imunisasi wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await addImmunization(activeChildId, {
        name: immunName,
        date: immunDate || undefined,
        nextDue: immunNextDue || undefined,
        status: immunStatus,
        location: immunLoc || undefined,
        note: immunNote || undefined,
      });

      if (res.success) {
        toast.success(`Jadwal imunisasi "${immunName}" berhasil dicatat! 💉`);
        setIsNewImmunOpen(false);
        resetImmunForm();
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mencatat imunisasi.");
      }
    });
  }

  async function handleToggleImmun(immunId: string, status: "PENDING" | "DONE") {
    const res = await updateImmunizationStatus(immunId, status);
    if (res.success) {
      toast.success(status === "DONE" ? "Imunisasi ditandai selesai!" : "Imunisasi diubah ke jadwal mendatang.");
      router.refresh();
    } else {
      toast.error("Gagal memperbarui status.");
    }
  }

  function resetChildForm() {
    setNewChildName("");
    setNewChildBirthDate("");
    setNewChildGender("MALE");
    setNewChildSchool("");
    setNewChildGrade("");
    setNewChildNotes("");
  }

  function resetGrowthForm() {
    setGrowthDate(new Date().toISOString().split("T")[0]);
    setGrowthHeight("");
    setGrowthWeight("");
    setGrowthHead("");
    setGrowthNote("");
  }

  function resetImmunForm() {
    setImmunName("");
    setImmunDate("");
    setImmunNextDue("");
    setImmunStatus("PENDING");
    setImmunLoc("");
    setImmunNote("");
  }

  return (
    <div className="space-y-6">
      {/* ─── Header Action ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">👶 Tumbuh Kembang Anak</h2>
          <p className="text-sm text-muted-foreground">Pantau tumbuh kembang dan riwayat imunisasi buah hati Anda</p>
        </div>
        <Button onClick={() => setIsNewChildOpen(true)} className="gradient-primary text-white shadow-soft hover:shadow-soft-lg gap-2">
          <Plus className="h-4 w-4" />
          Tambah Anak
        </Button>
      </div>

      {/* ─── Main Content Grid ───────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar: Children Selection Navigation */}
        <div className="space-y-3 lg:col-span-1">
          <h3 className="font-bold text-base text-foreground">Daftar Anak</h3>

          {initialChildren.length === 0 ? (
            <div className="card-harmoni p-6 text-center text-muted-foreground">
              <p className="text-3xl mb-2">👶</p>
              <p className="text-xs">Belum ada data anak</p>
              <Button onClick={() => setIsNewChildOpen(true)} size="sm" variant="link" className="text-primary mt-1">
                Tambah Profil Anak
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {initialChildren.map((child) => {
                const isSelected = child.id === activeChildId;
                return (
                  <button
                    key={child.id}
                    onClick={() => setActiveChildId(child.id)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3",
                      isSelected
                        ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-soft-sm"
                        : "border-border/60 hover:bg-muted/30"
                    )}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg shrink-0">
                      {child.gender === "FEMALE" ? "👧" : "👦"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-foreground truncate">{child.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{calculateAge(child.birthDate)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Profile Details Area */}
        <div className="lg:col-span-3 space-y-6">
          {activeChild ? (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="card-harmoni p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-center gap-3.5">
                  <div className="h-14 w-14 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-2xl">
                    {activeChild.gender === "FEMALE" ? "👧" : "👦"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{activeChild.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span>{calculateAge(activeChild.birthDate)}</span>
                      <span>•</span>
                      <span>Lahir: {formatDate(new Date(activeChild.birthDate), "dd MMM yyyy")}</span>
                      {activeChild.schoolName && (
                        <>
                          <span>•</span>
                          <span>Sekolah: {activeChild.schoolName} ({activeChild.grade})</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setIsNewGrowthOpen(true)} size="sm" variant="outline" className="text-xs h-9">
                    Catat Pertumbuhan
                  </Button>
                  <Button onClick={() => setIsNewImmunOpen(true)} size="sm" className="gradient-primary text-white text-xs h-9">
                    Catat Imunisasi
                  </Button>
                </div>
              </div>

              {/* Tabs for Growth & Immunization */}
              <Tabs defaultValue="growth" className="w-full">
                <TabsList className="w-full sm:w-80 h-11 mb-4">
                  <TabsTrigger value="growth" className="flex-1 text-xs gap-1.5">
                    <Scale className="h-3.5 w-3.5" />
                    Catatan Pertumbuhan
                  </TabsTrigger>
                  <TabsTrigger value="immunization" className="flex-1 text-xs gap-1.5">
                    <Heart className="h-3.5 w-3.5" />
                    Jadwal Imunisasi
                  </TabsTrigger>
                </TabsList>

                {/* ─── TAB: Growth Records ───────────────────── */}
                <TabsContent value="growth" className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Latest stats */}
                    <div className="card-harmoni p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Ruler className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tinggi Badan</p>
                        <p className="text-base font-extrabold text-foreground mt-0.5">
                          {activeChild.growthRecords.length > 0 && activeChild.growthRecords[0].height
                            ? `${Number(activeChild.growthRecords[0].height)} cm`
                            : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="card-harmoni p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 flex items-center justify-center">
                        <Scale className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Berat Badan</p>
                        <p className="text-base font-extrabold text-foreground mt-0.5">
                          {activeChild.growthRecords.length > 0 && activeChild.growthRecords[0].weight
                            ? `${Number(activeChild.growthRecords[0].weight)} kg`
                            : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="card-harmoni p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Lingkar Kepala</p>
                        <p className="text-base font-extrabold text-foreground mt-0.5">
                          {activeChild.growthRecords.length > 0 && activeChild.growthRecords[0].headCircumference
                            ? `${Number(activeChild.growthRecords[0].headCircumference)} cm`
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Growth History List */}
                  <div className="card-harmoni p-4">
                    <h4 className="font-bold text-sm text-foreground mb-3">Riwayat Pertumbuhan</h4>
                    {activeChild.growthRecords.length === 0 ? (
                      <p className="py-6 text-center text-xs text-muted-foreground">
                        Belum ada catatan pertumbuhan. Klik tombol di atas untuk mencatat.
                      </p>
                    ) : (
                      <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto pr-1">
                        {activeChild.growthRecords.map((record) => (
                          <div key={record.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground">
                                {formatDate(new Date(record.date), "dd MMMM yyyy")}
                              </p>
                              {record.note && (
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  Note: &quot;{record.note}&quot;
                                </p>
                              )}
                            </div>
                            <div className="flex gap-4 shrink-0 text-xs font-medium text-foreground/80">
                              {record.height && <span>📏 {Number(record.height)} cm</span>}
                              {record.weight && <span>⚖️ {Number(record.weight)} kg</span>}
                              {record.headCircumference && <span>🧠 {Number(record.headCircumference)} cm</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* ─── TAB: Immunization Checklist ───────────── */}
                <TabsContent value="immunization" className="space-y-4">
                  <div className="card-harmoni p-4">
                    <h4 className="font-bold text-sm text-foreground mb-3">Imunisasi & Vaksinasi</h4>
                    {activeChild.immunizations.length === 0 ? (
                      <p className="py-6 text-center text-xs text-muted-foreground">
                        Belum ada riwayat imunisasi terdaftar.
                      </p>
                    ) : (
                      <div className="divide-y divide-border/50 max-h-[350px] overflow-y-auto pr-1">
                        {activeChild.immunizations.map((immun) => {
                          const isDone = immun.status === "DONE";

                          return (
                            <div key={immun.id} className={cn("py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3", isDone && "opacity-60")}>
                              <div className="flex items-start gap-2.5 min-w-0">
                                <button
                                  onClick={() => handleToggleImmun(immun.id, isDone ? "PENDING" : "DONE")}
                                  className="text-primary hover:scale-110 active:scale-95 transition-all mt-0.5"
                                >
                                  {isDone ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 fill-green-500/10" />
                                  ) : (
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </button>
                                <div className="min-w-0">
                                  <p className={cn("text-xs font-bold text-foreground truncate", isDone && "line-through text-muted-foreground")}>
                                    {immun.name}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-muted-foreground">
                                    {immun.date && (
                                      <span>Tanggal: {formatDate(new Date(immun.date), "dd MMM yyyy")}</span>
                                    )}
                                    {immun.location && (
                                      <>
                                        <span>·</span>
                                        <span>Tempat: {immun.location}</span>
                                      </>
                                    )}
                                  </div>
                                  {immun.note && (
                                    <p className="text-[10px] text-muted-foreground mt-1 italic">
                                      &quot;{immun.note}&quot;
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="shrink-0">
                                <Badge variant={isDone ? "secondary" : "outline"} className={cn("text-[9px] py-0 h-4.5 font-bold", isDone ? "badge-success" : "badge-warning")}>
                                  {isDone ? "Selesai" : "Menunggu"}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="card-harmoni p-8 text-center text-muted-foreground min-h-[400px] flex flex-col justify-center items-center">
              <Baby className="h-12 w-12 text-muted-foreground/30 mb-2" />
              <p className="font-medium text-sm">Tidak ada profil anak</p>
              <p className="text-xs mt-0.5">Tambahkan data profil anak pertama Anda untuk memulai.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── DIALOG: Tambah Profil Anak ───────────────────── */}
      <Dialog open={isNewChildOpen} onOpenChange={setIsNewChildOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Profil Anak</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateChild} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="child-name">Nama Lengkap</Label>
              <Input
                id="child-name"
                placeholder="cth: Muhammad Al Fatih"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="child-birth">Tanggal Lahir</Label>
                <Input
                  id="child-birth"
                  type="date"
                  value={newChildBirthDate}
                  onChange={(e) => setNewChildBirthDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="child-gender">Jenis Kelamin</Label>
                <Select value={newChildGender} onValueChange={(v: any) => setNewChildGender(v)}>
                  <SelectTrigger id="child-gender">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Laki-laki</SelectItem>
                    <SelectItem value="FEMALE">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="child-school">Nama Sekolah (Opsional)</Label>
                <Input
                  id="child-school"
                  placeholder="cth: SD IT Al-Bayan"
                  value={newChildSchool}
                  onChange={(e) => setNewChildSchool(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="child-grade">Kelas (Opsional)</Label>
                <Input
                  id="child-grade"
                  placeholder="cth: 3 SD, TK-B"
                  value={newChildGrade}
                  onChange={(e) => setNewChildGrade(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="child-notes">Catatan Riwayat / Alergi (Opsional)</Label>
              <Textarea
                id="child-notes"
                placeholder="cth: Alergi makanan laut, Golongan darah O"
                rows={2}
                value={newChildNotes}
                onChange={(e) => setNewChildNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsNewChildOpen(false)}>Batal</Button>
              <Button type="submit" className="gradient-primary text-white" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Profil
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: Catat Pertumbuhan ────────────────────── */}
      <Dialog open={isNewGrowthOpen} onOpenChange={setIsNewGrowthOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Catat Pertumbuhan: {activeChild?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGrowth} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="growth-date">Tanggal Pencatatan</Label>
              <Input
                id="growth-date"
                type="date"
                value={growthDate}
                onChange={(e) => setGrowthDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="growth-h">Tinggi (cm)</Label>
                <Input
                  id="growth-h"
                  type="number"
                  step="any"
                  placeholder="0.0"
                  value={growthHeight}
                  onChange={(e) => setGrowthHeight(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="growth-w">Berat (kg)</Label>
                <Input
                  id="growth-w"
                  type="number"
                  step="any"
                  placeholder="0.0"
                  value={growthWeight}
                  onChange={(e) => setGrowthWeight(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="growth-hc">Lingkar K. (cm)</Label>
                <Input
                  id="growth-hc"
                  type="number"
                  step="any"
                  placeholder="0.0"
                  value={growthHead}
                  onChange={(e) => setGrowthHead(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="growth-note">Catatan Tambahan (Opsional)</Label>
              <Input
                id="growth-note"
                placeholder="cth: Pengukuran berkala posyandu"
                value={growthNote}
                onChange={(e) => setGrowthNote(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsNewGrowthOpen(false)}>Batal</Button>
              <Button type="submit" className="gradient-primary text-white" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Data
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: Catat Imunisasi ─────────────────────── */}
      <Dialog open={isNewImmunOpen} onOpenChange={setIsNewImmunOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Catat Imunisasi: {activeChild?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddImmunization} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="immun-name">Nama Imunisasi / Vaksin</Label>
              <Input
                id="immun-name"
                placeholder="cth: DPT-HB-Hib 1, Polio 2, Campak"
                value={immunName}
                onChange={(e) => setImmunName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="immun-date">Tanggal Imunisasi</Label>
                <Input
                  id="immun-date"
                  type="date"
                  value={immunDate}
                  onChange={(e) => setImmunDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="immun-next">Jatuh Tempo Berikut (Opsional)</Label>
                <Input
                  id="immun-next"
                  type="date"
                  value={immunNextDue}
                  onChange={(e) => setImmunNextDue(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="immun-status">Status Awal</Label>
                <Select value={immunStatus} onValueChange={(v: any) => setImmunStatus(v)}>
                  <SelectTrigger id="immun-status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Jadwal Mendatang</SelectItem>
                    <SelectItem value="DONE">Sudah Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="immun-loc">Lokasi (Puskesmas/Klinik)</Label>
                <Input
                  id="immun-loc"
                  placeholder="cth: Puskesmas Kebayoran"
                  value={immunLoc}
                  onChange={(e) => setImmunLoc(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="immun-note">Catatan Imunisasi (Opsional)</Label>
              <Input
                id="immun-note"
                placeholder="cth: Batch vaksin no #abc"
                value={immunNote}
                onChange={(e) => setImmunNote(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsNewImmunOpen(false)}>Batal</Button>
              <Button type="submit" className="gradient-primary text-white" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
