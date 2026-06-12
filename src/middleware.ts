import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/api/auth",
];

// Routes accessible only without auth (redirect to dashboard if logged in)
const AUTH_ONLY_ROUTES = ["/login", "/register", "/forgot-password"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // ─── Not authenticated ─────────────────────────────────
  if (!session) {
    if (!isPublicRoute) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ─── Authenticated ─────────────────────────────────────
  if (session) {
    // Redirect away from auth pages
    if (isAuthOnlyRoute) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // Redirect to family setup if no family
    const user = session.user as { familyId?: string };
    if (
      !user.familyId &&
      !pathname.startsWith("/setup") &&
      !pathname.startsWith("/api")
    ) {
      return NextResponse.redirect(new URL("/setup/family", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|js)).*)",
  ],
};
