"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const pullDistance = isPulling ? Math.max(0, currentY - startY) : 0;
  const maxPullDistance = 100;
  const threshold = 60;
  
  // Apply resistance to the pull
  const pullHeight = pullDistance > 0 
    ? Math.min(maxPullDistance, pullDistance * 0.4) 
    : 0;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull to refresh if we are at the very top of the page
      if (window.scrollY <= 0) {
        setStartY(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY <= 0 && startY > 0) {
        const y = e.touches[0].clientY;
        if (y > startY) {
          setIsPulling(true);
          setCurrentY(y);
          // Prevent default scrolling behavior when pulling
          if (e.cancelable) e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (isPulling) {
        if (pullHeight >= threshold) {
          setIsRefreshing(true);
          // Simulate network request or trigger next.js router refresh
          router.refresh();
          
          // Minimum refresh animation time to feel natural
          setTimeout(() => {
            setIsRefreshing(false);
          }, 1000);
        }
        setIsPulling(false);
        setStartY(0);
        setCurrentY(0);
      }
    };

    // Attach to document to ensure we catch all touches
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    // Not passive because we might need to preventDefault
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [startY, isPulling, pullHeight, threshold, router]);

  return (
    <div ref={containerRef} className="relative min-h-full w-full bg-background">
      {/* Refresh Indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center items-center overflow-hidden z-20 pointer-events-none"
        style={{ 
          height: `${isRefreshing ? 50 : pullHeight}px`,
          transition: isPulling ? 'none' : 'height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        <div 
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary shadow-md dark:bg-zinc-800",
            isRefreshing && "animate-spin",
            !isRefreshing && !isPulling && "opacity-0 transition-opacity duration-300"
          )}
          style={{
            transform: isPulling ? `rotate(${pullHeight * 2}deg)` : 'none'
          }}
        >
          <RefreshCw className="h-4 w-4" />
        </div>
      </div>

      {/* Content wrapper that moves down */}
      <div 
        className="min-h-full w-full bg-background relative z-10"
        style={{
          transform: `translateY(${isRefreshing ? 50 : pullHeight}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
}
