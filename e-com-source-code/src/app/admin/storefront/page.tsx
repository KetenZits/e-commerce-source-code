import { StorefrontSettingsForm } from "@/components/admin/storefront-settings";
import { serverCaller } from "@/trpc/server";

export default async function StorefrontSettingsPage() {
  const settings = await (await serverCaller()).admin.storefrontSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Storefront</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Manage the store type, home banner, orbit photos, brand copy, and public page
          introductions. Changes are visible as soon as they are saved.
        </p>
      </div>
      <StorefrontSettingsForm defaultValues={settings} />
    </div>
  );
}
