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
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Revenue" value={formatMoney(totalCents)} />
        <Stat label="Paid orders" value={String(paidCount)} />
        <Stat label="Pending" value={String(pendingCount)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-hair bg-surface p-4">
          <p className="util-label mb-3">Revenue over time</p>
          <Line
            data={{
              labels: series.map((row) => row.date),
              datasets: [
                {
                  label: "Revenue",
                  data: series.map((row) => row.cents / 100),
                  borderColor: "#F0A93D",
                  backgroundColor: "rgba(240,169,61,0.15)",
                  tension: 0.3,
                },
              ],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: "#8890A3" }, grid: { color: "#242938" } },
                y: { ticks: { color: "#8890A3" }, grid: { color: "#242938" } },
              },
            }}
          />
        </div>
        <div className="rounded-lg border border-hair bg-surface p-4">
          <p className="util-label mb-3">Top products</p>
          <Bar
            data={{
              labels: topProducts.map((row) => row.title),
              datasets: [
                {
                  label: "Revenue",
                  data: topProducts.map((row) => row.cents / 100),
                  backgroundColor: "#3FB950",
                },
              ],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: "#8890A3" }, grid: { display: false } },
                y: { ticks: { color: "#8890A3" }, grid: { color: "#242938" } },
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
    <div className="rounded-lg border border-hair bg-surface p-4">
      <p className="util-label">{label}</p>
      <p className="font-heading mt-2 text-2xl">{value}</p>
    </div>
  );
}
