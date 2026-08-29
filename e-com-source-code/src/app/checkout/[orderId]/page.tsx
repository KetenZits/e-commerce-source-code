import { PaymentClient } from "@/components/checkout/checkout-client";

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ g?: string }>;
}) {
  const { orderId } = await params;
  const { g } = await searchParams;
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="font-display mb-6 text-2xl">PromptPay</h1>
      <PaymentClient orderId={orderId} guestToken={g} />
    </div>
  );
}
