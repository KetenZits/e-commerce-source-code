"use client";

import { useState } from "react";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Legend,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { formatChartTick } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

export function RevenueCharts({
  totalCents,
  paidCount,
  pendingCount,
  ordersToday,
  ordersThisMonth,
  averageOrderCents,
  dailySeries,
  weeklySeries,
  topProducts,
}: {
  totalCents: number;
  paidCount: number;
  pendingCount: number;
  ordersToday: number;
  ordersThisMonth: number;
  averageOrderCents: number;
  dailySeries: { date: string; cents: number }[];
  weeklySeries: { date: string; cents: number }[];
  topProducts: { title: string; cents: number; count: number }[];
}) {
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  const series = period === "daily" ? dailySeries : weeklySeries;
  const grid = "#E3DFD6";
  const tick = "#6E6A62";
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Revenue" value={formatMoney(totalCents)} />
        <Stat label="Orders today" value={String(ordersToday)} />
        <Stat label="Orders this month" value={String(ordersThisMonth)} />
        <Stat label="Average order" value={formatMoney(averageOrderCents)} />
        <Stat
          label="Best seller"
          value={topProducts[0]?.title ?? "—"}
          detail={topProducts[0] ? `${topProducts[0].count} sold` : undefined}
        />
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">Sales over time</p>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={period === "daily" ? "default" : "ghost"}
              onClick={() => setPeriod("daily")}
            >
              Daily
            </Button>
            <Button
              size="sm"
              variant={period === "weekly" ? "default" : "ghost"}
              onClick={() => setPeriod("weekly")}
            >
              Weekly
            </Button>
          </div>
        </div>
        <div className="h-72">
          <Line
            data={{
              labels: series.map((row) => formatChartTick(row.date, period)),
              datasets: [
                {
                  data: series.map((row) => row.cents / 100),
                  borderColor: "#2C3B32",
                  tension: 0.3,
                  fill: false,
                },
              ],
            }}
            options={{
              plugins: { legend: { display: false } },
              maintainAspectRatio: false,
              scales: {
                x: { ticks: { color: tick }, grid: { color: grid } },
                y: { ticks: { color: tick }, grid: { color: grid } },
              },
            }}
          />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="eyebrow mb-3">Top products</p>
          <Bar
            data={{
              labels: topProducts.map((row) => row.title),
              datasets: [{ data: topProducts.map((row) => row.cents / 100), backgroundColor: "#B08D57" }],
            }}
            options={{
              plugins: { legend: { display: false } },
              indexAxis: "y",
              scales: {
                x: { ticks: { color: tick }, grid: { display: false } },
                y: { ticks: { color: tick }, grid: { color: grid } },
              },
            }}
          />
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="eyebrow mb-4">Order mix</p>
          {paidCount + pendingCount === 0 ? (
            <p className="text-sm text-muted-foreground">No orders to chart yet.</p>
          ) : (
            <div className="mx-auto h-56 max-w-xs">
              <Doughnut
                data={{
                  labels: ["Paid / fulfilled", "Awaiting payment"],
                  datasets: [
                    {
                      data: [paidCount, pendingCount],
                      backgroundColor: ["#2C3B32", "#B08D57"],
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { color: tick, boxWidth: 10, font: { size: 11 } },
                    },
                  },
                  cutout: "62%",
                }}
              />
            </div>
          )}
          <ol className="mt-4 space-y-3">
            {topProducts.map((product, index) => (
              <li key={product.title} className="flex items-center gap-3 border-b border-border pb-3 last:border-0">
                <span className="font-tabular text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{product.title}</span>
                <span className="font-tabular text-xs">{product.count} sold</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="eyebrow">{label}</p>
      <p className="font-display mt-2 truncate text-2xl">{value}</p>
      {detail ? <p className="font-tabular mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}
