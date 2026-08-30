"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/locale-provider";
import { trpc } from "@/trpc/client";

export function OrderCustomerActions({
  orderId,
  status,
  guestToken,
  invoiceNumber,
}: {
  orderId: string;
  status: string;
  guestToken?: string;
  invoiceNumber?: string | null;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const cancel = trpc.order.cancelPending.useMutation({
    onSuccess: () => {
      toast.message(t("orders.cancelled"));
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING" ? (
        <Button
          variant="outline"
          onClick={() =>
            cancel.mutate({ orderId, guestToken, reason: "Cancelled by customer" })
          }
          disabled={cancel.isPending}
        >
          {t("orders.cancelUnpaid")}
        </Button>
      ) : null}
      {invoiceNumber && ["PAID", "PACKED", "SHIPPED", "DELIVERED"].includes(status) ? (
        <a
          href={`/orders/${orderId}/invoice${guestToken ? `?g=${guestToken}` : ""}`}
          className="inline-flex h-8 items-center rounded-lg border border-border px-2.5 text-sm"
        >
          {t("orders.viewInvoice")}
        </a>
      ) : null}
    </div>
  );
}
