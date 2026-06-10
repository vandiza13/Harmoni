"use client";

import { useState } from "react";
import { formatIDR, formatDate, formatRelative, truncate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, TrendingUp, TrendingDown, Filter } from "lucide-react";
import { deleteTransaction } from "@/actions/finance";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  amount: unknown;
  description: string | null;
  date: Date;
  type?: "income" | "expense";
  category?: { name: string; icon?: string | null; color?: string | null } | null;
  receiptUrl?: string | null;
}

interface TransactionListProps {
  transactions: Transaction[];
  total: number;
  type?: "income" | "expense";
}

export function TransactionList({ transactions, total, type }: TransactionListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string, txType: "income" | "expense") {
    setDeleting(id);
    const result = await deleteTransaction(id, txType);
    if (result.success) {
      toast.success("Transaksi dihapus");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setDeleting(null);
  }

  const typeFilter = type;

  return (
    <div className="card-harmoni">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-foreground">Riwayat Transaksi</h3>
          <p className="text-xs text-muted-foreground">{total} transaksi</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <Filter className="h-3 w-3" />
              {type === "income" ? "Pemasukan" : type === "expense" ? "Pengeluaran" : "Semua"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push("/dashboard/keuangan")}>
              Semua
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/keuangan?type=income")}>
              <TrendingUp className="h-4 w-4 mr-2 text-green-500" /> Pemasukan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/keuangan?type=expense")}>
              <TrendingDown className="h-4 w-4 mr-2 text-red-500" /> Pengeluaran
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* List */}
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-muted-foreground">
          <span className="text-3xl mb-2">💸</span>
          <p className="text-sm font-medium">Belum ada transaksi</p>
          <p className="text-xs mt-0.5">Tambah transaksi pertama kamu</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {transactions.map((tx) => {
            const isIncome = tx.type === "income";
            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base",
                    isIncome
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-red-100 dark:bg-red-900/30"
                  )}
                >
                  {tx.category?.icon || (isIncome ? "💰" : "💸")}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {tx.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {tx.category && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                        {tx.category.name}
                      </Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {formatRelative(tx.date)}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center gap-2 shrink-0">
                  <p
                    className={cn(
                      "currency-display text-sm font-bold",
                      isIncome ? "text-green-600" : "text-red-500"
                    )}
                  >
                    {isIncome ? "+" : "-"}
                    {formatIDR(Number(tx.amount), { compact: true })}
                  </p>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-destructive focus:text-destructive"
                        disabled={deleting === tx.id}
                        onClick={() => handleDelete(tx.id, tx.type || "expense")}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > transactions.length && (
        <div className="p-3 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full text-primary text-xs">
            Lihat {total - transactions.length} transaksi lainnya
          </Button>
        </div>
      )}
    </div>
  );
}
