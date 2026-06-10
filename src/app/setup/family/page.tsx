"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, Link2, Loader2, Home } from "lucide-react";
import { toast } from "sonner";
import { createFamilySchema, joinFamilySchema, type CreateFamilyInput } from "@/lib/validations";
import { createFamily, joinFamily } from "@/actions/family";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Mode = "choose" | "create" | "join";

export default function FamilySetupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-soft-lg mb-3">
            <Home className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Setup Keluarga</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Buat atau bergabung dengan keluarga untuk mulai menggunakan Harmoni
          </p>
        </div>

        {/* Mode chooser */}
        {mode === "choose" && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("create")}
              className={cn(
                "w-full flex items-center gap-4 rounded-2xl border-2 border-border p-4",
                "hover:border-primary hover:bg-primary/5 transition-all text-left"
              )}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-primary">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Buat Keluarga Baru</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kamu akan menjadi admin dan bisa mengundang anggota keluarga
                </p>
              </div>
            </button>

            <button
              onClick={() => setMode("join")}
              className={cn(
                "w-full flex items-center gap-4 rounded-2xl border-2 border-border p-4",
                "hover:border-primary hover:bg-primary/5 transition-all text-left"
              )}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/30">
                <Link2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Bergabung ke Keluarga</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Punya kode undangan dari anggota keluarga lain
                </p>
              </div>
            </button>
          </div>
        )}

        {mode === "create" && <CreateFamilyForm onBack={() => setMode("choose")} />}
        {mode === "join" && <JoinFamilyForm onBack={() => setMode("choose")} />}
      </div>
    </div>
  );
}

// ─── Create Family Form ───────────────────────────────────────
function CreateFamilyForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { update } = useSession();
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<CreateFamilyInput>({ resolver: zodResolver(createFamilySchema) });

  async function onSubmit(data: CreateFamilyInput) {
    const result = await createFamily(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    if (!result.data) {
      toast.error("Gagal mendapatkan data keluarga.");
      return;
    }
    toast.success("Keluarga berhasil dibuat! 🎉");
    await update({ familyId: result.data.familyId });
    window.location.href = "/dashboard";
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
        ← Kembali
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Keluarga</Label>
          <Input id="name" placeholder='cth: "Keluarga Budi"' className="h-11"
            {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Deskripsi (opsional)</Label>
          <Textarea id="description" placeholder="Deskripsi singkat keluarga..."
            rows={3} {...register("description")} />
        </div>

        <Button type="submit" className="w-full h-11 gradient-primary text-white font-semibold"
          disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buat Keluarga"}
        </Button>
      </form>
    </div>
  );
}

// ─── Join Family Form ─────────────────────────────────────────
function JoinFamilyForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { update } = useSession();
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<{ inviteCode: string }>({ resolver: zodResolver(joinFamilySchema) });

  async function onSubmit(data: { inviteCode: string }) {
    const result = await joinFamily(data.inviteCode);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    if (!result.data) {
      toast.error("Gagal mendapatkan data keluarga.");
      return;
    }
    toast.success("Berhasil bergabung dengan keluarga! 🎉");
    await update({ familyId: result.data.familyId });
    window.location.href = "/dashboard";
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
        ← Kembali
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="inviteCode">Kode Undangan</Label>
          <Input id="inviteCode" placeholder="Masukkan kode undangan"
            className="h-11 uppercase tracking-widest font-mono text-center"
            {...register("inviteCode")} />
          {errors.inviteCode && (
            <p className="text-xs text-destructive">{(errors.inviteCode as { message?: string }).message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Minta kode undangan dari anggota keluarga yang sudah terdaftar.
          </p>
        </div>

        <Button type="submit" className="w-full h-11 gradient-primary text-white font-semibold"
          disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Bergabung"}
        </Button>
      </form>
    </div>
  );
}
