import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ─── Desktop Sidebar ────────────────────────── */}
      <Sidebar className="hidden lg:flex" />

      {/* ─── Main Content ───────────────────────────── */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <Header />

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
            {children}
          </div>
        </main>

        {/* ─── Mobile Bottom Nav ──────────────────── */}
        <MobileNav className="lg:hidden" />
      </div>
    </div>
  );
}
