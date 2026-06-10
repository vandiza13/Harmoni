"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, TrendingUp, TrendingDown, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { transactionSchema, type TransactionInput } from "@/lib/validations";
import { createIncome, createExpense } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type TxType = "income" | "expense";

export function AddTransactionFAB() {
  const [open, setOpen] = useState(false);
  const [txType, setTxType] = useState<TxType>("expense");
  const searchParams = useSearchParams();

  // Support URL-based open: ?modal=expense or ?modal=income
  const modalParam = searchParams.get("modal") as TxType | null;

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-24 right-4 z-50 lg:bottom-6",
          "flex h-14 w-14 items-center justify-center rounded-2xl",
          "gradient-primary shadow-soft-lg text-white",
          "hover:shadow-soft-xl active:scale-95 transition-all duration-150"
        )}
        aria-label="Tambah transaksi"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* Transaction sheet */}
      <TransactionSheet
        open={open}
        onClose={() => setOpen(false)}
        defaultType={txType}
        onTypeChange={setTxType}
      />
    </>
  );
}

interface TransactionSheetProps {
  open: boolean;
  onClose: () => void;
  defaultType: TxType;
  onTypeChange: (type: TxType) => void;
}

function TransactionSheet({ open, onClose, defaultType, onTypeChange }: TransactionSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TxType>(defaultType);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  });

  async function onSubmit(data: TransactionInput) {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.set(k, String(v));
    });

    const action = activeTab === "income" ? createIncome : createExpense;
    const result = await action(formData);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(
      activeTab === "income" ? "Pemasukan dicatat!" : "Pengeluaran dicatat!"
    );
    reset();
    onClose();
    router.refresh();
  }

  function handleClose() {
    reset();
    onClose();
  }

  const isIncome = activeTab === "income";

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[92vh] overflow-y-auto pb-safe p-0"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
        </div>

        <SheetHeader className="px-4 pb-3">
          <SheetTitle className="text-left text-lg font-bold">
            Tambah Transaksi
          </SheetTitle>
        </SheetHeader>

        {/* Type selector */}
        <div className="px-4 mb-4">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as TxType);
              onTypeChange(v as TxType);
            }}
          >
            <TabsList className="w-full h-11">
              <TabsTrigger value="expense" className="flex-1 gap-2 text-sm">
                <TrendingDown className="h-4 w-4" />
                Pengeluaran
              </TabsTrigger>
              <TabsTrigger value="income" className="flex-1 gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />
                Pemasukan
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-4 space-y-4 pb-6">
          {/* Amount — large prominent input */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">
              Nominal <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                Rp
              </span>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                placeholder="0"
                className={cn(
                  "h-14 pl-10 text-xl font-bold currency-display",
                  isIncome ? "focus:border-green-500" : "focus:border-red-500"
                )}
                {...register("amount")}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">
              Keterangan <span className="text-destructive">*</span>
            </Label>
            <Input
              id="description"
              placeholder={isIncome ? "cth: Gaji bulanan" : "cth: Belanja sayur"}
              className="h-11"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Tanggal</Label>
            <Input
              id="date"
              type="date"
              className="h-11"
              {...register("date")}
            />
          </div>

          {/* Notes (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">
              Catatan <span className="text-xs text-muted-foreground">(opsional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Tambahkan catatan..."
              rows={2}
              {...register("notes")}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full h-12 font-semibold text-base text-white shadow-soft",
              isIncome
                ? "bg-green-500 hover:bg-green-600"
                : "gradient-primary hover:shadow-soft-lg"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isIncome ? (
              "Catat Pemasukan"
            ) : (
              "Catat Pengeluaran"
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
