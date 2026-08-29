import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AddressBook } from "@/components/account/address-book";
import { authOptions } from "@/server/auth";

export default async function AddressesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard/addresses");
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <h1 className="font-display text-3xl">Addresses</h1>
      <AddressBook />
    </div>
  );
}
