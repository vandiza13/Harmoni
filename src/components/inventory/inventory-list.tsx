"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Package, MapPin, AlertTriangle, PlusCircle, MinusCircle, Search, Edit3, Loader2, Sparkles, Filter } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createInventoryItem, updateInventoryStock } from "@/actions/modules";
import { cn } from "@/lib/utils";

interface InventoryItem {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  currentStock: any; // Decimal type, usually string/number in JS
  minStock: any;
  imageUrl: string | null;
  barcode: string | null;
  location: string | null;
}

interface InventoryListProps {
  initialItems: InventoryItem[];
}

const PRESET_CATEGORIES = [
  { label: "Bahan Pokok (Beras, Tepung)", value: "Bahan Pokok" },
  { label: "Bumbu & Penyedap", value: "Bumbu" },
  { label: "Minyak & Lemak", value: "Minyak" },
  { label: "Sayuran & Buah Segar", value: "Segar" },
  { label: "Daging & Seafood", value: "Protein" },
  { label: "Susu & Olahan", value: "Olahan Susu" },
  { label: "Camilan & Makanan Ringan", value: "Camilan" },
  { label: "Minuman & Teh/Kopi", value: "Minuman" },
  { label: "Kebersihan & Mandi", value: "Sanitasi" },
  { label: "Lainnya", value: "Lainnya" },
];

const PRESET_LOCATIONS = [
  { label: "Kulkas (Fridge)", value: "Kulkas" },
  { label: "Lemari Es (Freezer)", value: "Freezer" },
  { label: "Lemari Dapur (Pantry)", value: "Lemari" },
  { label: "Rak Bumbu", value: "Rak Bumbu" },
  { label: "Gudang Kecil", value: "Gudang" },
  { label: "Lainnya", value: "Lainnya" },
];

export function InventoryList({ initialItems }: InventoryListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  // Dialog States
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // New Item Form States
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Bahan Pokok");
  const [newItemUnit, setNewItemUnit] = useState("pcs");
  const [newItemCurrentStock, setNewItemCurrentStock] = useState("0");
  const [newItemMinStock, setNewItemMinStock] = useState("0");
  const [newItemLocation, setNewItemLocation] = useState("Lemari");

  // Adjustment Form States
  const [adjustType, setAdjustType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  // Statistics
  const lowStockItems = initialItems.filter(
    (item) => Number(item.currentStock) <= Number(item.minStock)
  );

  // Filtered List
  const filteredItems = initialItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesLocation = selectedLocation === "all" || item.location === selectedLocation;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Unique categories & locations present in dataset
  const categoriesPresent = Array.from(new Set(initialItems.map((item) => item.category).filter(Boolean)));
  const locationsPresent = Array.from(new Set(initialItems.map((item) => item.location).filter(Boolean)));

  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName) {
      toast.error("Nama barang wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await createInventoryItem({
        name: newItemName,
        category: newItemCategory,
        unit: newItemUnit,
        currentStock: parseFloat(newItemCurrentStock) || 0,
        minStock: parseFloat(newItemMinStock) || 0,
        location: newItemLocation,
      });

      if (res.success) {
        toast.success(`Barang "${newItemName}" berhasil ditambahkan! 📦`);
        setIsNewItemOpen(false);
        resetNewItemForm();
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menyimpan barang.");
      }
    });
  }

  async function handleAdjustStock(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem || !adjustQty) {
      toast.error("Jumlah penyesuaian wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await updateInventoryStock(
        selectedItem.id,
        adjustType,
        parseFloat(adjustQty),
        adjustNote || undefined
      );

      if (res.success) {
        toast.success("Stok berhasil diperbarui! 🔄");
        setIsAdjustOpen(false);
        setAdjustQty("");
        setAdjustNote("");
        setSelectedItem(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui stok.");
      }
    });
  }

  async function handleQuickAdjust(item: InventoryItem, direction: "UP" | "DOWN") {
    const qty = 1;
    const type = direction === "UP" ? "IN" : "OUT";
    const actionLabel = direction === "UP" ? "ditambah" : "dikurangi";

    const res = await updateInventoryStock(item.id, type, qty, `Penyesuaian cepat via tombol`);
    if (res.success) {
      toast.success(`Stok ${item.name} berhasil ${actionLabel}!`);
      router.refresh();
    } else {
      toast.error("Gagal melakukan penyesuaian cepat.");
    }
  }

  function resetNewItemForm() {
    setNewItemName("");
    setNewItemCategory("Bahan Pokok");
    setNewItemUnit("pcs");
    setNewItemCurrentStock("0");
    setNewItemMinStock("0");
    setNewItemLocation("Lemari");
  }

  return (
    <div className="space-y-6">
      {/* ─── Header Action ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">📦 Stok Dapur</h2>
          <p className="text-sm text-muted-foreground">Pantau ketersediaan bahan pangan dan logistik rumah tangga</p>
        </div>
        <Button onClick={() => setIsNewItemOpen(true)} className="gradient-primary text-white shadow-soft hover:shadow-soft-lg gap-2">
          <Plus className="h-4 w-4" />
          Tambah Barang
        </Button>
      </div>

      {/* ─── Stats cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Items */}
        <div className="card-harmoni p-5 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-primary opacity-20">
            <Package className="h-12 w-12" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Barang Terdaftar</p>
          <p className="text-2xl font-extrabold text-foreground mt-2">{initialItems.length}</p>
          <p className="text-xs text-muted-foreground mt-4 font-medium">
            Di {locationsPresent.length} lokasi penyimpanan berbeda
          </p>
        </div>

        {/* Low Stock count */}
        <div className="card-harmoni p-5 relative overflow-hidden bg-gradient-to-br from-amber-50 dark:from-amber-950/20 to-transparent border-amber-200 dark:border-amber-900/30">
          <div className="absolute right-4 top-4 text-amber-500 opacity-25">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hampir Habis (Low Stock)</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {lowStockItems.length} <span className="text-sm font-normal text-muted-foreground">barang</span>
          </p>
          <p className="text-xs text-muted-foreground mt-4 font-medium">
            Stok saat ini berada di bawah batas minimum
          </p>
        </div>

        {/* Smart suggestion */}
        <div className="card-harmoni p-5 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-primary font-semibold text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Saran Belanja Otomatis</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Kamu bisa langsung membuat daftar belanja untuk barang-barang yang menipis ini di modul **Belanja**.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-fit text-xs border-primary text-primary hover:bg-primary/5 h-8"
            onClick={() => router.push("/dashboard/belanja?from=lowstock")}
          >
            Buka Modul Belanja →
          </Button>
        </div>
      </div>

      {/* ─── Search & Filters ────────────────────────────── */}
      <div className="card-harmoni p-4 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari barang dapur..."
            className="pl-9 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Category */}
        <div className="w-full md:w-56">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-11">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Semua Kategori" />
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

        {/* Filter Location */}
        <div className="w-full md:w-48">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="h-11">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Semua Lokasi" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Lokasi</SelectItem>
              {PRESET_LOCATIONS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── Inventory Grid ──────────────────────────────── */}
      <div>
        <h3 className="font-bold text-lg text-foreground mb-4">Daftar Barang</h3>

        {filteredItems.length === 0 ? (
          <div className="card-harmoni p-10 text-center text-muted-foreground">
            <p className="text-4xl mb-3">📦</p>
            <p className="font-medium">Barang tidak ditemukan</p>
            <p className="text-xs mt-1">Coba sesuaikan filter pencarianmu atau tambahkan barang baru.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map((item) => {
              const current = Number(item.currentStock);
              const min = Number(item.minStock);
              const isLow = current <= min;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "card-harmoni p-4 flex flex-col justify-between transition-all hover:-translate-y-0.5 duration-200",
                    isLow && "border-amber-300 dark:border-amber-800/40 bg-amber-50/10 dark:bg-amber-950/5"
                  )}
                >
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-foreground text-sm truncate">{item.name}</h4>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md mt-1 inline-block">
                          {item.category || "Lainnya"}
                        </span>
                      </div>
                      {isLow && (
                        <Badge variant="secondary" className="badge-warning text-[9px] py-0 h-4 shrink-0">
                          Low Stock
                        </Badge>
                      )}
                    </div>

                    {/* Location */}
                    {item.location && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{item.location}</span>
                      </p>
                    )}
                  </div>

                  {/* Stock adjusters */}
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Persediaan</p>
                      <p className="text-lg font-extrabold text-foreground mt-0.5">
                        {current} <span className="text-xs font-medium text-muted-foreground">{item.unit || "pcs"}</span>
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleQuickAdjust(item, "DOWN")}
                        disabled={current <= 0}
                        className="text-muted-foreground hover:text-destructive hover:scale-115 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <MinusCircle className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => handleQuickAdjust(item, "UP")}
                        className="text-muted-foreground hover:text-primary hover:scale-115 active:scale-95 transition-all"
                      >
                        <PlusCircle className="h-6 w-6" />
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedItem(item);
                          setIsAdjustOpen(true);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── DIALOG: Tambah Barang Baru ───────────────────── */}
      <Dialog open={isNewItemOpen} onOpenChange={setIsNewItemOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Barang Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateItem} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="item-name">Nama Barang</Label>
              <Input
                id="item-name"
                placeholder="cth: Beras Pandan Wangi, Minyak Goreng Bimoli"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="item-category">Kategori</Label>
                <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                  <SelectTrigger id="item-category">
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
                <Label htmlFor="item-unit">Satuan</Label>
                <Input
                  id="item-unit"
                  placeholder="cth: kg, liter, pcs, botol"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="item-current">Stok Saat Ini</Label>
                <Input
                  id="item-current"
                  type="number"
                  placeholder="0"
                  value={newItemCurrentStock}
                  onChange={(e) => setNewItemCurrentStock(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-min">Stok Minimum</Label>
                <Input
                  id="item-min"
                  type="number"
                  placeholder="0"
                  value={newItemMinStock}
                  onChange={(e) => setNewItemMinStock(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-location">Lokasi Penyimpanan</Label>
              <Select value={newItemLocation} onValueChange={setNewItemLocation}>
                <SelectTrigger id="item-location">
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_LOCATIONS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsNewItemOpen(false)}>Batal</Button>
              <Button type="submit" className="gradient-primary text-white" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tambah Barang
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: Penyesuaian Stok Lengkap ──────────────── */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Penyesuaian Stok: {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjustStock} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="adjust-type">Jenis Penyesuaian</Label>
              <Select value={adjustType} onValueChange={(v: any) => setAdjustType(v)}>
                <SelectTrigger id="adjust-type">
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Stok Masuk (+)</SelectItem>
                  <SelectItem value="OUT">Stok Keluar (-)</SelectItem>
                  <SelectItem value="ADJUSTMENT">Atur Stok Baru (=)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adjust-qty">
                Jumlah ({selectedItem?.unit || "pcs"})
              </Label>
              <Input
                id="adjust-qty"
                type="number"
                step="any"
                placeholder="0"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adjust-note">Catatan Penyesuaian (Opsional)</Label>
              <Input
                id="adjust-note"
                placeholder="cth: Belanja mingguan, Rusak/Kedaluwarsa"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsAdjustOpen(false);
                setSelectedItem(null);
              }}>Batal</Button>
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
