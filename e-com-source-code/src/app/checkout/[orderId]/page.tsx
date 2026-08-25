import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { authOptions } from "@/server/auth";

export default async function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");
  const { orderId } = await params;
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Checkout</h1>
      <CheckoutClient orderId={orderId} />
    </div>
  );
}
