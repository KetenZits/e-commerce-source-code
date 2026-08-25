import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PaymentClient } from "@/components/checkout/checkout-client";
import { authOptions } from "@/server/auth";

export default async function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");
  const { orderId } = await params;
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="font-display mb-6 text-2xl">PromptPay</h1>
      <PaymentClient orderId={orderId} />
    </div>
  );
}
