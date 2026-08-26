import { RevenueCharts } from "@/components/admin/revenue-charts";
import { serverCaller } from "@/trpc/server";

export default async function AdminRevenuePage() {
  const data = await (await serverCaller()).admin.revenue();
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Overview</p>
        <h1 className="font-display mt-2 text-3xl">Dashboard</h1>
      </div>
      <RevenueCharts {...data} />
    </div>
  );
}
