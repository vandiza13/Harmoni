// ============================================================
// Harmoni Custom Hooks
// ============================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// ─── useFamily ────────────────────────────────────────────────
export function useFamily() {
  const { data: session } = useSession();
  const user = session?.user as {
    id?: string;
    familyId?: string;
    familyRole?: string;
    familyName?: string;
  } | undefined;

  return {
    familyId: user?.familyId,
    familyRole: user?.familyRole,
    familyName: user?.familyName,
    isOwner: user?.familyRole === "OWNER",
    isAdmin: ["OWNER", "ADMIN"].includes(user?.familyRole || ""),
    hasFamily: !!user?.familyId,
  };
}

// ─── useUpload ────────────────────────────────────────────────
interface UploadOptions {
  folder?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  onSuccess?: (url: string, key: string) => void;
  onError?: (error: string) => void;
}

export function useUpload(options: UploadOptions = {}) {
  const {
    folder = "uploads",
    maxSizeMB = 10,
    allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    onSuccess,
    onError,
  } = options;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File): Promise<{ url: string; key: string } | null> => {
      if (!allowedTypes.includes(file.type)) {
        const msg = `Tipe file tidak diizinkan. Gunakan: ${allowedTypes.join(", ")}`;
        toast.error(msg);
        onError?.(msg);
        return null;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        const msg = `File terlalu besar. Maksimal ${maxSizeMB}MB`;
        toast.error(msg);
        onError?.(msg);
        return null;
      }

      setUploading(true);
      setProgress(0);

      try {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("folder", folder);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload gagal");
        }

        const data = await response.json();
        setUploadedUrl(data.url);
        setProgress(100);
        onSuccess?.(data.url, data.key);
        return { url: data.url, key: data.key };
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Upload gagal";
        toast.error(msg);
        onError?.(msg);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [folder, maxSizeMB, allowedTypes, onSuccess, onError]
  );

  const deleteFile = useCallback(async (key: string) => {
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      setUploadedUrl(null);
    } catch {
      toast.error("Gagal menghapus file");
    }
  }, []);

  return { upload, deleteFile, uploading, progress, uploadedUrl };
}

// ─── useDebounce ──────────────────────────────────────────────
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// ─── useLocalStorage ─────────────────────────────────────────
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback(
    (newValue: T | ((val: T) => T)) => {
      try {
        const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
        setValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch {
        console.error("LocalStorage write error");
      }
    },
    [key, value]
  );

  return [value, setStoredValue] as const;
}

// ─── usePWA ───────────────────────────────────────────────────
export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setIsInstallable(true);
    };

    // Network status
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("SW registered:", reg.scope))
        .catch((err) => console.error("SW registration failed:", err));
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt.current) return false;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setIsInstallable(false);
    if (outcome === "accepted") setIsInstalled(true);
    return outcome === "accepted";
  }, []);

  return { isInstallable, isInstalled, isOnline, installApp };
}

// Type extension for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ─── useCurrency ─────────────────────────────────────────────
export function useCurrency() {
  const format = useCallback((amount: number | string, compact = false) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "Rp 0";

    if (compact) {
      if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)} M`;
      if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)} jt`;
      if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)} rb`;
    }

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  }, []);

  const parse = useCallback((formatted: string) => {
    return parseFloat(formatted.replace(/[^0-9.]/g, "")) || 0;
  }, []);

  return { format, parse };
}

// ─── useMonthYear ─────────────────────────────────────────────
export function useMonthYear(initialMonth?: number, initialYear?: number) {
  const now = new Date();
  const [month, setMonth] = useState(initialMonth || now.getMonth() + 1);
  const [year, setYear] = useState(initialYear || now.getFullYear());

  const prev = useCallback(() => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }, [month]);

  const next = useCallback(() => {
    const now = new Date();
    if (month === now.getMonth() + 1 && year === now.getFullYear()) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }, [month, year]);

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  return { month, year, prev, next, isCurrentMonth };
}
