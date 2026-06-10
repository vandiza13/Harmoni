"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { checkGoogleConfig } from "@/actions/auth";
import type { Metadata } from "next";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    checkGoogleConfig().then(setGoogleConfigured);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "EMAIL_NOT_VERIFIED") {
          toast.error("Email belum diverifikasi. Cek inbox kamu.");
        } else {
          toast.error("Email atau password salah.");
        }
        return;
      }

      toast.success("Berhasil masuk!");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    }
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
    try {
      await signIn("google", { callbackUrl });
    } catch {
      toast.error("Gagal login dengan Google.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="space-y-6 bg-card p-8 rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-border/40">
      {/* Header */}
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-foreground">Selamat datang!</h1>
        <p className="text-sm text-muted-foreground">
          Masuk ke akun Harmoni kamu
        </p>
      </div>

      {/* Google login */}
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
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Lanjutkan dengan Google
      </Button>

      {/* Divider */}
      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
          atau masuk dengan email
        </span>
      </div>

      {/* Email / Password form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nama@email.com"
            autoComplete="email"
            className="h-11"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Lupa password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-11 pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 gradient-primary text-white font-semibold shadow-soft hover:shadow-soft-lg transition-shadow"
          disabled={isSubmitting || googleLoading}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Masuk"
          )}
        </Button>
      </form>

      {/* Register link */}
      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary hover:underline"
        >
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
