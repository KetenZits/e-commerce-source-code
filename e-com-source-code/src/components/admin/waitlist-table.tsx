"use client";

import { useMemo } from "react";
import { AdminDataTable, createAdminColumnHelper } from "@/components/admin/data-table";
import { StatusChip } from "@/components/ui/status-chip";
import { formatRelative } from "@/lib/datetime";
import type { StockAlertListItem } from "@/server/services/stock-alert-store";

const columnHelper = createAdminColumnHelper<StockAlertListItem>();

export function WaitlistTable({ alerts }: { alerts: StockAlertListItem[] }) {
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("email", { header: "Email" }),
        columnHelper.accessor((row) => row.product.title, {
          id: "product",
          header: "Product",
        }),
        columnHelper.accessor((row) => row.variant.sku, {
          id: "sku",
          header: "SKU",
          meta: { tabular: true },
        }),
        columnHelper.accessor((row) => (row.notifiedAt ? "Emailed" : "Waiting"), {
          id: "status",
          header: "Status",
          cell: (info) => (
            <StatusChip tone={info.getValue() === "Waiting" ? "brass" : "forest"}>
              {info.getValue()}
            </StatusChip>
          ),
        }),
        columnHelper.accessor((row) => new Date(row.createdAt).getTime(), {
          id: "createdAt",
          header: "Requested",
          cell: (info) => (
            <span className="text-muted-foreground">{formatRelative(info.row.original.createdAt)}</span>
          ),
          meta: { tabular: true, nowrap: true },
        }),
      ]),
    [],
  );

  return (
    <AdminDataTable
      data={alerts}
      columns={columns}
      getRowId={(row) => row.id}
      searchPlaceholder="Search email, product, or SKU"
    />
  );
}
