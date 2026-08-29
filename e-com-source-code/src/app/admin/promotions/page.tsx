import { PromotionsAdmin } from "@/components/admin/promotions-admin";
import { serverCaller } from "@/trpc/server";

export default async function PromotionsPage() {
  const promotions = await (await serverCaller()).admin.promotions();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Promotions</h1>
      <PromotionsAdmin promotions={promotions} />
    </div>
  );
}
