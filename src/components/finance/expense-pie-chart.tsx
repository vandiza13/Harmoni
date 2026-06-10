"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatIDR, calcPercent } from "@/lib/utils";

interface CategoryData {
  categoryId: string | null;
  categoryName: string;
  icon: string;
  color: string;
  amount: number;
}

interface ExpensePieChartProps {
  data: CategoryData[];
  total: number;
}

const FALLBACK_COLORS = [
  "#4CAF50", "#FF8A65", "#42A5F5", "#AB47BC", "#EC407A",
  "#FFB300", "#29B6F6", "#26C6DA", "#EF5350", "#66BB6A",
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: unknown[] }) {
  if (!active || !payload || !payload.length) return null;
  const entry = (payload as Array<{ payload: CategoryData }>)[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-card text-sm">
      <p className="font-semibold text-foreground">
        {entry.icon} {entry.categoryName}
      </p>
      <p className="text-muted-foreground mt-0.5">{formatIDR(entry.amount)}</p>
    </div>
  );
}

export function ExpensePieChart({ data, total }: ExpensePieChartProps) {
  const chartData = data
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
    .map((d, i) => ({
      ...d,
      color: d.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      percentage: calcPercent(d.amount, total),
    }));

  if (chartData.length === 0) {
    return (
      <div className="card-harmoni p-4">
        <h3 className="font-semibold text-foreground mb-4">Pengeluaran per Kategori</h3>
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <span className="text-3xl mb-2">📊</span>
          <p className="text-sm">Belum ada data pengeluaran</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-harmoni p-4">
      <h3 className="font-semibold text-foreground mb-1">Pengeluaran per Kategori</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Total: {formatIDR(total)}
      </p>

      {/* Pie chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="amount"
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.categoryId || index} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend list */}
      <div className="mt-3 space-y-1.5">
        {chartData.map((item) => (
          <div key={item.categoryId} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="flex-1 text-xs text-muted-foreground truncate">
              {item.icon} {item.categoryName}
            </span>
            <span className="text-xs font-semibold text-foreground tabular-nums">
              {item.percentage}%
            </span>
            <span className="text-xs text-muted-foreground tabular-nums w-20 text-right">
              {formatIDR(item.amount, { compact: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
