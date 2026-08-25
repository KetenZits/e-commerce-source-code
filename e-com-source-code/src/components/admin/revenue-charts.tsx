"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { formatMoney } from "@/lib/money";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip);

export function RevenueCharts({
  totalCents,
  paidCount,
  pendingCount,
  series,
  topProducts,
}: {
  totalCents: number;
  paidCount: number;
  pendingCount: number;
  series: { date: string; cents: number }[];
  topProducts: { title: string; cents: number; count: number }[];
}) {
  const grid = "#E3DFD6";
  const tick = "#6E6A62";
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Revenue" value={formatMoney(totalCents)} />
        <Stat label="Paid orders" value={String(paidCount)} />
        <Stat label="Pending payment" value={String(pendingCount)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="eyebrow mb-3">Revenue over time</p>
          <Line
            data={{
              labels: series.map((row) => row.date),
              datasets: [
                {
                  data: series.map((row) => row.cents / 100),
                  borderColor: "#2C3B32",
                  backgroundColor: "rgba(44,59,50,0.08)",
                  tension: 0.3,
                },
              ],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: tick }, grid: { color: grid } },
                y: { ticks: { color: tick }, grid: { color: grid } },
              },
            }}
          />
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="eyebrow mb-3">Top products</p>
          <Bar
            data={{
              labels: topProducts.map((row) => row.title),
              datasets: [{ data: topProducts.map((row) => row.cents / 100), backgroundColor: "#B08D57" }],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: tick }, grid: { display: false } },
                y: { ticks: { color: tick }, grid: { color: grid } },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="eyebrow">{label}</p>
      <p className="font-display mt-2 text-2xl">{value}</p>
    </div>
  );
}
