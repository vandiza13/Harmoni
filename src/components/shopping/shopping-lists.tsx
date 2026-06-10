"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, ShoppingCart, CheckSquare, Square, Trash2, Calendar, Loader2, Sparkles, PlusCircle, AlertCircle, RefreshCw } from "lucide-react";
import { formatIDR, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createShoppingList, addShoppingItem, toggleShoppingItem, generateShoppingFromLowStock } from "@/actions/modules";
import { cn } from "@/lib/utils";

interface ShoppingItem {
  id: string;
  shoppingListId: string;
  inventoryId: string | null;
  name: string;
  quantity: any;
  unit: string | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  category: string | null;
  isChecked: boolean;
  price: any;
  note: string | null;
}

interface ShoppingList {
  id: string;
  name: string;
  isActive: boolean;
  isCompleted: boolean;
  completedAt: Date | null;
  createdAt: Date;
  items: ShoppingItem[];
  _count: {
    items: number;
  };
}

interface ShoppingListsProps {
  initialLists: ShoppingList[];
}

const PRESET_PRIORITIES = [
  { label: "Tinggi 🔴", value: "HIGH" },
  { label: "Sedang 🟡", value: "MEDIUM" },
  { label: "Rendah 🟢", value: "LOW" },
];

export function ShoppingLists({ initialLists }: ShoppingListsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Selected List for display or action
  const [activeListId, setActiveListId] = useState<string | null>(
    initialLists.length > 0 ? initialLists[0].id : null
  );

  // Dialog States
  const [isNewListOpen, setIsNewListOpen] = useState(false);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);

  // Form States
  const [newListName, setNewListName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("pcs");
  const [newItemPriority, setNewItemPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [newItemNote, setNewItemNote] = useState("");

  const activeList = initialLists.find((l) => l.id === activeListId);

  // Trigger low-stock auto-generation if requested via URL
  useEffect(() => {
    if (searchParams.get("from") === "lowstock") {
      handleGenerateFromLowStock();
    }
  }, [searchParams]);

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName) {
      toast.error("Nama daftar belanja wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await createShoppingList(newListName);
      if (!res.success) {
        toast.error(res.error || "Gagal membuat daftar belanja.");
        return;
      }
      if (res.data) {
        toast.success(`Daftar belanja "${newListName}" berhasil dibuat! 🛒`);
        setIsNewListOpen(false);
        setNewListName("");
        setActiveListId(res.data.id);
        router.refresh();
      }
    });
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!activeListId || !newItemName) {
      toast.error("Nama item wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await addShoppingItem(activeListId, {
        name: newItemName,
        quantity: newItemQty ? parseFloat(newItemQty) : undefined,
        unit: newItemUnit || undefined,
        priority: newItemPriority,
        note: newItemNote || undefined,
      });

      if (res.success) {
        toast.success(`Barang "${newItemName}" ditambahkan ke daftar!`);
        setIsNewItemOpen(false);
        resetNewItemForm();
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menambah barang.");
      }
    });
  }

  async function handleToggleItem(itemId: string, currentStatus: boolean) {
    const res = await toggleShoppingItem(itemId, !currentStatus);
    if (res.success) {
      router.refresh();
    } else {
      toast.error("Gagal memperbarui item.");
    }
  }

  async function handleGenerateFromLowStock() {
    startTransition(async () => {
      const res = await generateShoppingFromLowStock();
      if (!res.success) {
        toast.error(res.error || "Gagal menghasilkan daftar belanja.");
        return;
      }
      if (res.data) {
        if (res.data.count > 0) {
          toast.success(`Berhasil membuat daftar belanja berisi ${res.data.count} item stok menipis! 🥦`);
          // Set active list to the newest one
          router.replace("/dashboard/belanja");
          router.refresh();
        } else {
          toast.info("Semua persediaan barang dapur masih dalam batas aman.");
        }
      }
    });
  }

  function resetNewItemForm() {
    setNewItemName("");
    setNewItemQty("");
    setNewItemUnit("pcs");
    setNewItemPriority("MEDIUM");
    setNewItemNote("");
  }

  return (
    <div className="space-y-6">
      {/* ─── Header Action ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">🛒 Daftar Belanja</h2>
          <p className="text-sm text-muted-foreground">Rencanakan pembelian kebutuhan rumah tangga bulanan dan mingguan</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateFromLowStock}
            variant="outline"
            className="border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100/30 gap-2 h-10 shadow-soft-sm"
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Auto-Stok Habis
          </Button>
          <Button onClick={() => setIsNewListOpen(true)} className="gradient-primary text-white shadow-soft hover:shadow-soft-lg gap-2 h-10">
            <Plus className="h-4 w-4" />
            Daftar Baru
          </Button>
        </div>
      </div>

      {/* ─── Main Content Grid ───────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar: Lists Navigation */}
        <div className="space-y-3 lg:col-span-1">
          <h3 className="font-bold text-base text-foreground">Daftar Belanja Anda</h3>

          {initialLists.length === 0 ? (
            <div className="card-harmoni p-6 text-center text-muted-foreground">
              <p className="text-2xl mb-1">🛒</p>
              <p className="text-xs">Belum ada daftar belanja</p>
              <Button onClick={() => setIsNewListOpen(true)} size="sm" variant="link" className="text-primary mt-1 h-7">
                Buat Sekarang
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {initialLists.map((list) => {
                const checkedCount = list.items.filter((i) => i.isChecked).length;
                const totalCount = list.items.length;
                const isSelected = list.id === activeListId;

                return (
                  <button
                    key={list.id}
                    onClick={() => setActiveListId(list.id)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-1.5",
                      isSelected
                        ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-soft-sm"
                        : "border-border/60 hover:bg-muted/30"
                    )}
                  >
                    <div className="flex justify-between items-start gap-2 min-w-0">
                      <p className="font-bold text-xs text-foreground truncate">{list.name}</p>
                      {totalCount > 0 && checkedCount === totalCount && (
                        <Badge className="bg-green-500 text-white text-[8px] py-0 h-4">Selesai</Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>{formatDate(new Date(list.createdAt), "dd MMM yyyy")}</span>
                      <span className="font-bold text-foreground/80">
                        {checkedCount}/{totalCount} item
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* List Detail & Items Area */}
        <div className="lg:col-span-3 space-y-4">
          {activeList ? (
            <div className="card-harmoni p-5 space-y-4 min-h-[400px] flex flex-col justify-between">
              {/* List Header */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border/60 gap-3">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{activeList.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Dibuat pada {formatDate(new Date(activeList.createdAt), "dd MMMM yyyy")}
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsNewItemOpen(true)}
                    className="gradient-primary text-white text-xs font-semibold h-9 px-3 gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Barang
                  </Button>
                </div>

                {/* Items List */}
                {activeList.items.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <p className="text-3xl mb-2">🛍️</p>
                    <p className="font-medium text-sm">Belum ada barang di daftar ini</p>
                    <p className="text-xs mt-0.5">Klik tombol di atas untuk mulai menambahkan barang belanjaan.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50 max-h-[450px] overflow-y-auto pr-1">
                    {activeList.items.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start justify-between py-3 transition-colors hover:bg-muted/10 px-1",
                          item.isChecked && "opacity-60"
                        )}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Checkbox */}
                          <button
                            onClick={() => handleToggleItem(item.id, item.isChecked)}
                            className="text-primary hover:scale-110 active:scale-95 transition-all mt-0.5"
                          >
                            {item.isChecked ? (
                              <CheckSquare className="h-5 w-5 fill-primary/20" />
                            ) : (
                              <Square className="h-5 w-5" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <p className={cn(
                              "text-sm font-semibold text-foreground truncate",
                              item.isChecked && "line-through text-muted-foreground"
                            )}>
                              {item.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                              {item.quantity && (
                                <span className="font-bold text-foreground/80">
                                  {Number(item.quantity)} {item.unit || "pcs"}
                                </span>
                              )}
                              {item.quantity && item.note && <span>·</span>}
                              {item.note && <span className="italic">&quot;{item.note}&quot;</span>}
                            </div>
                          </div>
                        </div>

                        {/* Priority / Badge */}
                        <div className="shrink-0">
                          <Badge
                            className={cn(
                              "text-[8px] py-0.5 px-1.5 h-5 font-semibold",
                              item.priority === "HIGH"
                                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                                : item.priority === "MEDIUM"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                                : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                            )}
                          >
                            {item.priority === "HIGH" ? "Penting" : item.priority === "MEDIUM" ? "Sedang" : "Rendah"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Progress Summary bottom */}
              {activeList.items.length > 0 && (
                <div className="pt-3.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Progres belanjaan: <strong>{activeList.items.filter(i => i.isChecked).length}</strong> dari <strong>{activeList.items.length}</strong> barang dibeli
                  </span>
                  <span className="font-bold text-primary">
                    {Math.round((activeList.items.filter(i => i.isChecked).length / activeList.items.length) * 100)}% selesai
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="card-harmoni p-8 text-center text-muted-foreground min-h-[400px] flex flex-col justify-center items-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-2" />
              <p className="font-medium text-sm">Tidak ada daftar belanja aktif</p>
              <p className="text-xs mt-0.5">Buat daftar belanja baru di panel sebelah kiri.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── DIALOG: Buat Daftar Baru ───────────────────────── */}
      <Dialog open={isNewListOpen} onOpenChange={setIsNewListOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Buat Daftar Belanja Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateList} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="list-name">Nama Daftar Belanja</Label>
              <Input
                id="list-name"
                placeholder="cth: Belanja Bulanan Juni, Kebutuhan Dapur Mingguan"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsNewListOpen(false)}>Batal</Button>
              <Button type="submit" className="gradient-primary text-white" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Daftar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: Tambah Item Baru ───────────────────────── */}
      <Dialog open={isNewItemOpen} onOpenChange={setIsNewItemOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Barang Belanjaan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="item-name">Nama Barang</Label>
              <Input
                id="item-name"
                placeholder="cth: Gula Pasir, Wortel Segar, Sabun Cuci Piring"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="item-qty">Jumlah (Opsional)</Label>
                <Input
                  id="item-qty"
                  type="number"
                  placeholder="0"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-unit">Satuan (Opsional)</Label>
                <Input
                  id="item-unit"
                  placeholder="cth: kg, liter, pcs, botol"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-priority">Skala Prioritas</Label>
              <Select value={newItemPriority} onValueChange={(v: any) => setNewItemPriority(v)}>
                <SelectTrigger id="item-priority">
                  <SelectValue placeholder="Pilih prioritas" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-note">Catatan Tambahan (Opsional)</Label>
              <Input
                id="item-note"
                placeholder="cth: Beli yang merk lokal saja"
                value={newItemNote}
                onChange={(e) => setNewItemNote(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsNewItemOpen(false)}>Batal</Button>
              <Button type="submit" className="gradient-primary text-white" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tambah Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
