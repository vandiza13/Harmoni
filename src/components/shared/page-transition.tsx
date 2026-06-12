"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    if (pathname) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setIsTransitioning(false);
      }, 150); // Matches the CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [pathname, children]);

  return (
    <div
      className={cn(
        "transition-all duration-200 ease-out",
        isTransitioning ? "opacity-0 translate-y-2 scale-[0.99]" : "opacity-100 translate-y-0 scale-100",
        className
      )}
    >
      {displayChildren}
    </div>
  );
}
