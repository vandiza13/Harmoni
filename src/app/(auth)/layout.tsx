import type { Metadata } from "next";
import Link from "next/link";

import Image from "next/image";

export const metadata: Metadata = {
  title: {
    template: "%s | Harmoni",
    default: "Masuk | Harmoni",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side: Elegant Branding Showcase */}
      <div className="hidden lg:flex flex-col w-[50%] bg-[#F9FBF8] dark:bg-zinc-950 p-12 justify-between relative overflow-hidden border-r border-border/50">
        {/* Subtle background decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/10 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <Link href="/" className="inline-block">
            {/* The user will drop logo.png in public folder */}
            <div className="relative h-20 w-20 md:h-28 md:w-28 rounded-3xl overflow-hidden shadow-soft-lg border border-border/50 bg-white">
              <Image 
                src="/logo.png" 
                alt="Harmoni Logo" 
                fill
                className="object-contain p-2"
                priority
              />
            </div>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg mt-12 mb-auto">
          <h1 className="text-4xl font-display font-bold text-foreground leading-tight mb-4">
            Kelola Keuangan, <br />
            Rumah, dan Keluarga <br />
            <span className="text-primary">dalam Harmoni</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Satu aplikasi cerdas untuk mengatur semua kebutuhan finansial, rutinitas dapur, hingga agenda seluruh anggota keluarga Anda dengan mudah dan elegan.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-muted-foreground font-medium">
            © {new Date().getFullYear()} Harmoni · Platform Manajemen Keluarga
          </p>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <main className="flex flex-1 flex-col items-center justify-center p-6 md:p-10 relative">
        <div className="w-full max-w-sm">
          {/* Mobile Logo (visible only on small screens) */}
          <div className="flex lg:hidden justify-center mb-8">
            <Link href="/" className="relative h-20 w-20 rounded-2xl overflow-hidden shadow-soft-sm border border-border bg-white">
              <Image 
                src="/logo.png" 
                alt="Harmoni Logo" 
                fill
                className="object-contain p-1.5"
                priority
              />
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
