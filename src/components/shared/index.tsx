// ============================================================
// Harmoni Shared Components
// EmptyState · ConfirmDialog · LoadingCard · PageHeader
// ============================================================

"use client";

import { type ReactNode, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// ─── EmptyState ───────────────────────────────────────────────
interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  emoji = "📭",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "card-harmoni flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      <span className="text-4xl mb-3">{emoji}</span>
      <h3 className="font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          size="sm"
          className="mt-4 gradient-primary text-white"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────
interface ConfirmDialogProps {
  trigger: ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  variant = "destructive",
  onConfirm,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "rounded-xl min-w-[100px]",
              variant === "destructive"
                ? "bg-destructive hover:bg-destructive/90"
                : "gradient-primary"
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── LoadingCard ──────────────────────────────────────────────
interface LoadingCardProps {
  rows?: number;
  className?: string;
}

export function LoadingCard({ rows = 3, className }: LoadingCardProps) {
  return (
    <div className={cn("card-harmoni p-4 space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 skeleton rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 skeleton rounded-full" style={{ width: `${60 + i * 10}%` }} />
            <div className="h-2.5 skeleton rounded-full w-1/3" />
          </div>
          <div className="h-4 w-16 skeleton rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────
interface PageHeaderProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ emoji, title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          {emoji && <span>{emoji}</span>}
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── SectionCard ─────────────────────────────────────────────
interface SectionCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <div className={cn("card-harmoni overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <div>
          <h3 className="font-semibold text-foreground text-sm">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── CurrencyInput ────────────────────────────────────────────
interface CurrencyInputProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function CurrencyInput({
  id,
  value,
  onChange,
  placeholder = "0",
  className,
  error,
}: CurrencyInputProps) {
  function formatDisplay(val: string) {
    const num = val.replace(/\D/g, "");
    return num ? parseInt(num).toLocaleString("id-ID") : "";
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    onChange?.(raw);
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
          Rp
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value ? formatDisplay(value) : ""}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4",
            "text-sm font-medium tabular-nums ring-offset-background",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive",
            className
          )}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
