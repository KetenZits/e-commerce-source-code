import { redirect } from "next/navigation";
import { ProfilePanel } from "@/components/account/profile-panel";
import { serverCaller } from "@/trpc/server";

export default async function ProfilePage() {
  const caller = await serverCaller();
  const [profile, orders, addresses] = await Promise.all([
    caller.auth.me(),
    caller.order.mine(),
    caller.address.list(),
  ]);
  if (!profile) redirect("/auth/signin?callbackUrl=/dashboard");

  return (
    <ProfilePanel
      profile={profile}
      orderCount={orders.length}
      addressCount={addresses.length}
    />
  );
}
