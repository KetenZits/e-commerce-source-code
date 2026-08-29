import { AddressBook } from "@/components/account/address-book";

export default function AddressesPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-3xl">Addresses</h1>
      <AddressBook />
    </div>
  );
}
