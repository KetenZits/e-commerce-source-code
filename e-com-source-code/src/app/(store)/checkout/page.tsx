import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { authOptions } from "@/server/auth";

export default async function CheckoutStartPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin?callbackUrl=/checkout");
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <h1 className="font-display text-3xl">Checkout</h1>
      <CheckoutFlow />
    </div>
  );
}
