import { RevenueCharts } from "@/components/admin/revenue-charts";
import { serverCaller } from "@/trpc/server";

export default async function AdminRevenuePage() {
  const data = await (await serverCaller()).admin.revenue();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Revenue</h1>
      <RevenueCharts {...data} />
    </div>
  );
}
