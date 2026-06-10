import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  trend,
  trendUp,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "card-harmoni p-4 flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground leading-tight">
          {title}
        </p>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </div>
      <div>
        <p className="currency-display text-lg font-bold text-foreground leading-tight">
          {value}
        </p>
        {trend && (
          <p
            className={cn(
              "mt-1 text-[11px] font-medium",
              trendUp === true
                ? "text-green-600"
                : trendUp === false
                ? "text-red-500"
                : "text-muted-foreground"
            )}
          >
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
