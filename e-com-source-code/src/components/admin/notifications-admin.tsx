"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";

export function NotificationsAdmin({
  logs,
}: {
  logs: { id: string; channel: string; event: string; status: string; error: string | null }[];
}) {
  const router = useRouter();
  const retry = trpc.admin.retryNotifications.useMutation({
    onSuccess: (result) => {
      toast.message(`Retried ${result.count} notification(s)`);
      router.refresh();
    },
  });

  return (
    <div className="space-y-4">
      <Button size="sm" onClick={() => retry.mutate()} disabled={retry.isPending}>
        Retry failed
      </Button>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <p>
              {log.channel} · {log.event} · {log.status.toLowerCase()}
            </p>
            {log.error ? <p className="mt-1 text-xs text-destructive">{log.error}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
