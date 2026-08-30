import { AddressBook } from "@/components/account/address-book";
import { getI18n } from "@/lib/i18n/get-locale";

export default async function AddressesPage() {
  const { t } = await getI18n();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-3xl">{t("addresses.title")}</h1>
      <AddressBook />
    </div>
  );
}
