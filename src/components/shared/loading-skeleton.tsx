"use client";

import { cn } from "@/lib/utils";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 pt-2 pb-safe animate-pulse">
      {/* Greeting Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-muted/60 dark:bg-muted/10"></div>
        <div className="h-4 w-32 rounded-lg bg-muted/60 dark:bg-muted/10"></div>
      </div>

      {/* Balance Card Skeleton */}
      <div className="h-48 w-full rounded-[1.5rem] bg-muted/60 dark:bg-muted/10"></div>

      {/* Stat Cards Horizontal Scroll Skeleton */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex overflow-hidden gap-3 pb-2">
          <div className="h-28 w-[160px] shrink-0 rounded-2xl bg-muted/60 dark:bg-muted/10 sm:w-1/4"></div>
          <div className="h-28 w-[160px] shrink-0 rounded-2xl bg-muted/60 dark:bg-muted/10 sm:w-1/4"></div>
          <div className="h-28 w-[140px] shrink-0 rounded-2xl bg-muted/60 dark:bg-muted/10 sm:w-1/4"></div>
          <div className="h-28 w-[140px] shrink-0 rounded-2xl bg-muted/60 dark:bg-muted/10 sm:w-1/4"></div>
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left col */}
        <div className="space-y-4 lg:col-span-2">
          <div className="h-[300px] w-full rounded-2xl bg-muted/60 dark:bg-muted/10"></div>
          <div className="h-[400px] w-full rounded-2xl bg-muted/60 dark:bg-muted/10"></div>
        </div>
        
        {/* Right col */}
        <div className="space-y-4">
          <div className="h-[250px] w-full rounded-2xl bg-muted/60 dark:bg-muted/10"></div>
          <div className="h-[250px] w-full rounded-2xl bg-muted/60 dark:bg-muted/10"></div>
        </div>
      </div>
    </div>
  );
}
