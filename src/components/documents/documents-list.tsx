"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Calendar, Trash2, Search, ExternalLink, AlertTriangle, Eye, Loader2, Sparkles, Filter } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createDocument, deleteDocument } from "@/actions/modules";
import { cn } from "@/lib/utils";

interface DocumentItem {
  id: string;
  familyId: string;
  name: string;
  category: "KTP" | "KK" | "BPJS" | "STNK" | "BPKB" | "CERTIFICATE" | "PASSPORT" | "INSURANCE" | "BIRTH_CERTIFICATE" | "MARRIAGE_CERTIFICATE" | "TAX" | "PROPERTY" | "EDUCATION" | "OTHER";
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  expiryDate: Date | null;
  description: string | null;
  tags: string[];
}

interface DocumentsListProps {
  initialDocuments: DocumentItem[];
}

const PRESET_CATEGORIES = [
  { label: "KTP (Kartu Tanda Penduduk)", value: "KTP" },
  { label: "KK (Kartu Keluarga)", value: "KK" },
  { label: "BPJS Kesehatan / Ketenagakerjaan", value: "BPJS" },
  { label: "STNK Kendaraan", value: "STNK" },
  { label: "BPKB Kendaraan", value: "BPKB" },
  { label: "Paspor", value: "PASSPORT" },
  { label: "Polis Asuransi", value: "INSURANCE" },
  { label: "Akta Kelahiran", value: "BIRTH_CERTIFICATE" },
  { label: "Buku Nikah", value: "MARRIAGE_CERTIFICATE" },
  { label: "Sertifikat Tanah/Rumah", value: "PROPERTY" },
  { label: "Ijazah & Dokumen Pendidikan", value: "EDUCATION" },
  { label: "Pajak & NPWP", value: "TAX" },
  { label: "Lainnya", value: "OTHER" },
];

export function DocumentsList({ initialDocuments }: DocumentsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Dialog States
  const [isNewDocOpen, setIsNewDocOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  // Form States
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("KTP");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const today = new Date();

  // Documents status and warnings
  const docsStatus = initialDocuments.map((doc) => {
    let daysUntilExpiry: number | null = null;
    let isExpiringSoon = false;
    let isExpired = false;

    if (doc.expiryDate) {
      const expiry = new Date(doc.expiryDate);
      daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      isExpired = daysUntilExpiry < 0;
      isExpiringSoon = !isExpired && daysUntilExpiry <= 30;
    }

    return {
      ...doc,
      daysUntilExpiry,
      isExpiringSoon,
      isExpired,
    };
  });

  const expiringSoonCount = docsStatus.filter(d => d.isExpiringSoon || d.isExpired).length;

  // Filtered Documents
  const filteredDocs = docsStatus.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || (doc.description && doc.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  async function handleCreateDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newFileUrl) {
      toast.error("Nama dokumen dan URL berkas wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await createDocument({
        name: newName,
        category: newCategory,
        fileUrl: newFileUrl,
        expiryDate: newExpiryDate || undefined,
        description: newDesc || undefined,
      });

      if (res.success) {
        toast.success(`Dokumen "${newName}" berhasil disimpan! 📄`);
        setIsNewDocOpen(false);
        resetForm();
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menyimpan dokumen.");
      }
    });
  }

  async function handleDelete() {
    if (!selectedDoc) return;

    startTransition(async () => {
      const res = await deleteDocument(selectedDoc.id);
      if (res.success) {
        toast.success(`Dokumen "${selectedDoc.name}" berhasil dihapus.`);
        setIsDeleteOpen(false);
        setSelectedDoc(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus dokumen.");
      }
    });
  }

  function resetForm() {
    setNewName("");
    setNewCategory("KTP");
    setNewFileUrl("");
    setNewExpiryDate("");
    setNewDesc("");
  }

  return (
    <div className="space-y-6">
      {/* ─── Header Action ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">📄 Berkas Keluarga</h2>
          <p className="text-sm text-muted-foreground">Penyimpanan dokumen penting keluarga digital yang aman</p>
        </div>
        <Button onClick={() => setIsNewDocOpen(true)} className="gradient-primary text-white shadow-soft hover:shadow-soft-lg gap-2">
          <Plus className="h-4 w-4" />
          Simpan Dokumen
        </Button>
      </div>

      {/* ─── Warning / Stats Area ───────────────────────── */}
      {expiringSoonCount > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-red-800 dark:text-red-400">Pemberitahuan Kedaluwarsa Dokumen</h4>
            <p className="text-xs text-red-700 dark:text-red-300/80 leading-relaxed">
              Ada {expiringSoonCount} dokumen penting keluarga yang telah kedaluwarsa atau akan habis masa berlakunya dalam waktu kurang dari 30 hari. Segera periksa dokumen tersebut untuk melakukan perpanjangan.
            </p>
          </div>
        </div>
      )}

      {/* ─── Search & Filters ────────────────────────────── */}
      <div className="card-harmoni p-4 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama dokumen atau keterangan..."
            className="pl-9 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Category */}
        <div className="w-full md:w-64">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-11">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Semua Kategori Berkas" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {PRESET_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── Documents Grid ──────────────────────────────── */}
      <div>
        <h3 className="font-bold text-lg text-foreground mb-4">Brankas Dokumen</h3>

        {filteredDocs.length === 0 ? (
          <div className="card-harmoni p-10 text-center text-muted-foreground">
            <p className="text-4xl mb-3">📂</p>
            <p className="font-medium">Tidak ada dokumen disimpan</p>
            <p className="text-xs mt-1">Belum ada dokumen yang sesuai dengan kriteria pencarian.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredDocs.map((doc) => {
              const categoryObj = PRESET_CATEGORIES.find(c => c.value === doc.category);
              const isUrgent = doc.isExpired || doc.isExpiringSoon;

              return (
                <div
                  key={doc.id}
                  className={cn(
                    "card-harmoni p-4 flex flex-col justify-between transition-all hover:-translate-y-0.5 duration-200",
                    isUrgent && "border-red-300 dark:border-red-800/40 bg-red-50/10 dark:bg-red-950/5"
                  )}
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      {doc.expiryDate && (
                        <Badge variant={doc.isExpired ? "destructive" : "secondary"} className={cn("text-[9px] py-0.5 h-4.5 font-bold", doc.isExpiringSoon && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400")}>
                          {doc.isExpired ? "Expired" : `${doc.daysUntilExpiry} hari lagi`}
                        </Badge>
                      )}
                    </div>

                    {/* Name & Category */}
                    <div>
                      <h4 className="font-bold text-foreground text-sm truncate">{doc.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {categoryObj?.label || doc.category}
                      </p>
                    </div>

                    {/* Desc */}
                    {doc.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {doc.description}
                      </p>
                    )}

                    {/* Expiry detail */}
                    {doc.expiryDate && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Hingga {formatDate(new Date(doc.expiryDate), "dd MMM yyyy")}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[11px] gap-1 px-2.5 border-border"
                      asChild
                    >
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                        <span>Buka Tautan</span>
                      </a>
                    </Button>

                    <Button
                      onClick={() => {
                        setSelectedDoc(doc as any);
                        setIsDeleteOpen(true);
                      }}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── DIALOG: Simpan Dokumen Baru ─────────────────── */}
      <Dialog open={isNewDocOpen} onOpenChange={setIsNewDocOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Simpan Dokumen Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateDoc} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-name">Nama Dokumen</Label>
              <Input
                id="doc-name"
                placeholder="cth: KTP Ayah, Kartu Keluarga Inti, Polis Allianz"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-category">Kategori Berkas</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger id="doc-category">
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
              <Label htmlFor="doc-url">Tautan / Link Berkas Google Drive / Cloud</Label>
              <Input
                id="doc-url"
                type="url"
                placeholder="https://drive.google.com/..."
                value={newFileUrl}
                onChange={(e) => setNewFileUrl(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-expiry">Tanggal Kedaluwarsa (Jika Ada)</Label>
              <Input
                id="doc-expiry"
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-desc">Deskripsi Singkat (Opsional)</Label>
              <Textarea
                id="doc-desc"
                placeholder="Tuliskan keterangan nomor dokumen atau catatan penting..."
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsNewDocOpen(false)}>Batal</Button>
              <Button type="submit" className="gradient-primary text-white" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Berkas
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: Hapus Dokumen ───────────────────────── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">Hapus Dokumen</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus berkas <strong>{selectedDoc?.name}</strong> dari brankas keluarga? Tautan berkas akan dihapus secara permanen.
            </p>
          </div>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => {
              setIsDeleteOpen(false);
              setSelectedDoc(null);
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
