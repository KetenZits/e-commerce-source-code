"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminDataTable, createAdminColumnHelper } from "@/components/admin/data-table";
import { OrderActions } from "@/components/admin/order-actions";
import { StatusChip } from "@/components/ui/status-chip";
import { formatRelative } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";

type OrderRow = {
  id: string;
  status: string;
  fulfillmentType: string;
  slipUncertain: boolean;
  totalCents: number;
  promptpayRef: string;
  createdAt: Date;
  user: { email: string | null } | null;
  guestEmail?: string | null;
  items: { quantity: number }[];
};

const columnHelper = createAdminColumnHelper<OrderRow>();

export function OrdersQueue({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("promptpayRef", {
          header: "Order",
          meta: { tabular: true },
        }),
        columnHelper.accessor((row) => row.user?.email ?? row.guestEmail ?? "Guest", {
          id: "customer",
          header: "Customer",
          cell: (info) => (
            <span className="text-muted-foreground">{info.getValue()}</span>
          ),
        }),
        columnHelper.accessor((row) => new Date(row.createdAt).getTime(), {
          id: "createdAt",
          header: "Date",
          cell: (info) => (
            <span className="text-xs text-muted-foreground" title={String(info.row.original.createdAt)}>
              {formatRelative(info.row.original.createdAt)}
            </span>
          ),
          meta: { tabular: true, nowrap: true },
        }),
        columnHelper.accessor((row) => row.items.reduce((sum, item) => sum + item.quantity, 0), {
          id: "items",
          header: "Items",
          meta: { align: "right", tabular: true },
        }),
        columnHelper.accessor("totalCents", {
          header: "Total",
          cell: (info) => (
            <span className="text-brass">{formatMoney(info.getValue())}</span>
          ),
          meta: { align: "right", tabular: true },
        }),
        columnHelper.accessor("status", {
          header: "Status",
          cell: (info) => {
            const order = info.row.original;
            return (
              <StatusChip
                tone={
                  order.status === "CANCELLED" || order.status === "REFUNDED"
                    ? "brick"
                    : order.status === "PENDING"
                      ? "brass"
                      : "forest"
                }
              >
                {order.slipUncertain && order.status === "PENDING"
                  ? "needs review"
                  : order.status.toLowerCase()}
              </StatusChip>
            );
          },
        }),
        columnHelper.display({
          id: "actions",
          header: "Action",
          enableSorting: false,
          enableGlobalFilter: false,
          meta: { nowrap: true, align: "right" },
          cell: (info) => (
            <div onClick={(event) => event.stopPropagation()}>
              <OrderActions order={info.row.original} />
            </div>
          ),
        }),
      ]),
    [],
  );

  return (
    <AdminDataTable
      data={orders}
      columns={columns}
      getRowId={(row) => row.id}
      searchPlaceholder="Search orders, email, or status"
      onRowClick={(order) => router.push(`/admin/orders/${order.id}`)}
      minWidth="860px"
    />
  );
}
