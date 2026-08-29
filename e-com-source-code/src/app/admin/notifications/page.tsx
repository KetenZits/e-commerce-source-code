import { NotificationsAdmin } from "@/components/admin/notifications-admin";
import { serverCaller } from "@/trpc/server";

export default async function NotificationsPage() {
  const logs = await (await serverCaller()).admin.notifications();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Notifications</h1>
      <NotificationsAdmin logs={logs} />
    </div>
  );
}
