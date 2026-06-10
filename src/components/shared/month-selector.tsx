"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonth } from "@/lib/utils";

interface MonthSelectorProps {
  month: number;
  year: number;
}

export function MonthSelector({ month, year }: MonthSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(direction: "prev" | "next") {
    let newMonth = month;
    let newYear = year;

    if (direction === "prev") {
      newMonth = month === 1 ? 12 : month - 1;
      newYear = month === 1 ? year - 1 : year;
    } else {
      newMonth = month === 12 ? 1 : month + 1;
      newYear = month === 12 ? year + 1 : year;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("month", String(newMonth));
    params.set("year", String(newYear));
    router.push(`${pathname}?${params.toString()}`);
  }

  const isCurrentMonth =
    month === new Date().getMonth() + 1 && year === new Date().getFullYear();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigate("prev")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-sm font-medium text-foreground min-w-[110px] text-center">
        {formatMonth(month, year)}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigate("next")}
        disabled={isCurrentMonth}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
