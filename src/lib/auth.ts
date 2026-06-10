import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import type { UserRole, FamilyRole } from "@prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),

  providers: [
    // ─── Google OAuth ────────────────────────────────────
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ─── Email + Password ────────────────────────────────
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/verify-email",
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role as UserRole;

        // Attach active family to token
        const familyMember = await db.familyMember.findFirst({
          where: { userId: user.id! },
          include: { family: true },
          orderBy: { joinedAt: "asc" },
        });

        if (familyMember) {
          token.familyId = familyMember.familyId;
          token.familyRole = familyMember.role;
          token.familyName = familyMember.family.name;
        }
      }

      // Handle session update (family switch or refresh after create/join)
      if (trigger === "update") {
        const targetFamilyId = session?.familyId as string | undefined;

        const familyMember = await db.familyMember.findFirst({
          where: {
            userId: token.id as string,
            ...(targetFamilyId ? { familyId: targetFamilyId } : {}),
          },
          include: { family: true },
          orderBy: { joinedAt: "asc" },
        });

        if (familyMember) {
          token.familyId = familyMember.familyId;
          token.familyRole = familyMember.role;
          token.familyName = familyMember.family.name;
        } else {
          token.familyId = undefined;
          token.familyRole = undefined;
          token.familyName = undefined;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.familyId = token.familyId as string | undefined;
        session.user.familyRole = token.familyRole as FamilyRole | undefined;
        session.user.familyName = token.familyName as string | undefined;
        session.user.role = token.role as UserRole | undefined;
      }
      return session;
    },
  },

  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser && user.id) {
        // Log first sign in
        console.log(`New user registered: ${user.email}`);
      }
    },
  },

  trustHost: true,
});
