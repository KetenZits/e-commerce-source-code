import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import { serverCaller } from "@/trpc/server";

export default async function BuyPage({ params }: { params: Promise<{ productId: string }> }) {
  const session = await getServerSession(authOptions);
  const { productId } = await params;
  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/buy/${productId}`)}`);
  }
  const order = await (await serverCaller()).order.create({ productId });
  redirect(`/checkout/${order.id}`);
}
