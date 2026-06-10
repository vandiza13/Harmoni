"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { registerUser, checkGoogleConfig } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    checkGoogleConfig().then(setGoogleConfigured);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");
  const passwordStrength = getPasswordStrength(password);

  async function onSubmit(data: RegisterInput) {
    const result = await registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setIsDev(!!result.data?.isDev);
    setRegistered(true);
  }

  async function handleGoogleLogin() {
    if (googleConfigured === false) {
      toast.error("Google OAuth belum dikonfigurasi di file .env lokal Anda.", {
        description: "Harap setel GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di .env.local terlebih dahulu.",
        duration: 5000,
      });
      return;
    }
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  if (registered) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {isDev ? "Registrasi Berhasil! (Mode Dev)" : "Cek email kamu!"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isDev
            ? "Akun Anda berhasil dibuat dan otomatis diaktifkan untuk pengujian lokal. Silakan masuk dengan email dan password Anda."
            : "Kami mengirimkan link verifikasi ke email kamu. Klik link tersebut untuk mengaktifkan akun."}
        </p>
        <Button variant="default" className="w-full gradient-primary text-white font-semibold" asChild>
          <Link href="/login">Masuk Sekarang</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-foreground">Buat akun baru</h1>
        <p className="text-sm text-muted-foreground">
          Mulai kelola keluargamu bersama Harmoni
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2.5 h-11"
        onClick={handleGoogleLogin}
        disabled={googleLoading || isSubmitting}
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Daftar dengan Google
      </Button>

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
          atau daftar dengan email
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama lengkap</Label>
          <Input id="name" placeholder="Nama kamu" className="h-11" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="nama@email.com" className="h-11" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 karakter"
              className="h-11 pr-10"
              {...register("password")}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" tabIndex={-1}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= passwordStrength.score
                    ? passwordStrength.score <= 1 ? "bg-red-500"
                    : passwordStrength.score <= 2 ? "bg-amber-500"
                    : passwordStrength.score <= 3 ? "bg-yellow-500"
                    : "bg-green-500"
                    : "bg-muted"
                }`} />
              ))}
            </div>
          )}
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Konfirmasi password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Ulangi password"
              className="h-11 pr-10"
              {...register("confirmPassword")}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" tabIndex={-1}>
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full h-11 gradient-primary text-white font-semibold shadow-soft"
          disabled={isSubmitting || googleLoading}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buat Akun"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Masuk
        </Link>
      </p>

      <p className="text-center text-[11px] text-muted-foreground">
        Dengan mendaftar, kamu menyetujui{" "}
        <Link href="/syarat" className="underline">Syarat & Ketentuan</Link>{" "}
        dan{" "}
        <Link href="/privasi" className="underline">Kebijakan Privasi</Link> kami.
      </p>
    </div>
  );
}

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return { score };
}
