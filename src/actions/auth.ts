"use server";

import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { registerSchema, resetPasswordSchema } from "@/lib/validations";

// ─── Register ─────────────────────────────────────────────────
export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<ActionResult<{ isDev: boolean }>> {
  try {
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Data yang dimasukkan tidak valid." };
    }

    const existing = await db.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      return { success: false, error: "Email sudah terdaftar." };
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const verificationToken = nanoid(32);
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await db.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          password: hashedPassword,
          emailVerified: process.env.NODE_ENV === "development" ? new Date() : null, // Auto-verified only in dev
        },
      });

      await tx.verificationToken.create({
        data: {
          identifier: data.email.toLowerCase(),
          token: verificationToken,
          expires: tokenExpiry,
        },
      });
    });

    // TODO: Send verification email via SMTP in production
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Verification token for ${data.email}: ${verificationToken}`);
    }

    return {
      success: true,
      message: "Akun berhasil dibuat. Silakan masuk!",
      data: { isDev: process.env.NODE_ENV === "development" },
    };
  } catch (error) {
    console.error("Register error:", error);
    return { success: false, error: "Gagal membuat akun. Coba lagi." };
  }
}

// ─── Verify Email ─────────────────────────────────────────────
export async function verifyEmail(token: string): Promise<ActionResult> {
  try {
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return { success: false, error: "Token tidak valid." };
    }

    if (verificationToken.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } });
      return { success: false, error: "Token sudah kadaluarsa. Minta token baru." };
    }

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { email: verificationToken.identifier },
        data: { emailVerified: new Date() },
      });
      await tx.verificationToken.delete({ where: { token } });
    });

    return { success: true, message: "Email berhasil diverifikasi!" };
  } catch (error) {
    return { success: false, error: "Verifikasi gagal." };
  }
}

// ─── Forgot Password ──────────────────────────────────────────
export async function forgotPassword(email: string): Promise<ActionResult> {
  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Don't reveal if email exists
    if (!user) {
      return { success: true, message: "Jika email terdaftar, link reset akan dikirim." };
    }

    const resetToken = nanoid(32);
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

    // Delete any existing token
    await db.verificationToken.deleteMany({
      where: { identifier: `reset:${email.toLowerCase()}` },
    });

    await db.verificationToken.create({
      data: {
        identifier: `reset:${email.toLowerCase()}`,
        token: resetToken,
        expires: tokenExpiry,
      },
    });

    // TODO: Send reset email
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Reset token for ${email}: ${resetToken}`);
    }

    return { success: true, message: "Link reset password telah dikirim ke email kamu." };
  } catch {
    return { success: false, error: "Gagal mengirim email. Coba lagi." };
  }
}

// ─── Reset Password ───────────────────────────────────────────
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ActionResult> {
  try {
    const parsed = resetPasswordSchema.safeParse({ password: newPassword, confirmPassword: newPassword });
    if (!parsed.success) {
      return { success: false, error: "Password baru tidak valid." };
    }

    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || !verificationToken.identifier.startsWith("reset:")) {
      return { success: false, error: "Token tidak valid." };
    }

    if (verificationToken.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } });
      return { success: false, error: "Token sudah kadaluarsa." };
    }

    const email = verificationToken.identifier.replace("reset:", "");
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { email },
        data: { password: hashedPassword },
      });
      await tx.verificationToken.delete({ where: { token } });
    });

    return { success: true, message: "Password berhasil direset!" };
  } catch {
    return { success: false, error: "Gagal mereset password." };
  }
}

// ─── Check Google OAuth Config ────────────────────────────────
export async function checkGoogleConfig(): Promise<boolean> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) return false;
  if (
    clientId === "your-google-client-id.apps.googleusercontent.com" ||
    clientSecret === "your-google-client-secret"
  ) {
    return false;
  }
  return true;
}
