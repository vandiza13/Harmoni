import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Harmoni — Manajemen Keluarga Modern",
    template: "%s | Harmoni",
  },
  description:
    "Harmoni membantu keluarga Indonesia mengelola keuangan, anggaran, belanja, jadwal, dan lebih banyak lagi dalam satu aplikasi yang mudah digunakan.",
  keywords: [
    "manajemen keluarga",
    "keuangan keluarga",
    "anggaran rumah tangga",
    "aplikasi ibu rumah tangga",
    "daftar belanja",
    "stok dapur",
    "meal planner",
    "harmoni",
  ],
  authors: [{ name: "Harmoni" }],
  creator: "Harmoni",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "id_ID",
    title: "Harmoni — Manajemen Keluarga Modern",
    description:
      "Platform manajemen keluarga lengkap untuk keluarga Indonesia.",
    siteName: "Harmoni",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Harmoni",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F9FBF8" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${inter.variable} ${plusJakarta.variable}`}
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased relative flex flex-col overflow-x-hidden">
        {/* Ambient Dark Mode Mesh Gradient */}
        <div className="fixed inset-0 z-0 hidden dark:block overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        </div>
        <SessionProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <div className="relative z-10 flex-1 flex flex-col">
                {children}
              </div>
              <Toaster
                position="top-center"
                richColors
                closeButton
                toastOptions={{
                  style: {
                    fontFamily: "var(--font-inter)",
                  },
                }}
              />
            </ThemeProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
