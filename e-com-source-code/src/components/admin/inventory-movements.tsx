"use client";

import { useMemo } from "react";
import Image from "next/image";
import { AdminDataTable, createAdminColumnHelper } from "@/components/admin/data-table";
import { formatDateTime, formatRelative } from "@/lib/datetime";
import { productImages } from "@/lib/product";

type MovementRow = {
  id: string;
  type: string;
  quantity: number;
  note: string | null;
  createdAt: Date;
  variant: {
    sku: string;
    imageUrl?: string | null;
    product: { title: string; images?: unknown };
  };
};

const columnHelper = createAdminColumnHelper<MovementRow>();

export function InventoryMovements({ rows }: { rows: MovementRow[] }) {
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor((row) => new Date(row.createdAt).getTime(), {
          id: "createdAt",
          header: "When",
          cell: (info) => (
            <span title={formatDateTime(info.row.original.createdAt)}>
              {formatRelative(info.row.original.createdAt)}
            </span>
          ),
          meta: { tabular: true, nowrap: true },
        }),
        columnHelper.accessor((row) => `${row.variant.product.title} ${row.variant.sku}`, {
          id: "product",
          header: "Product",
          cell: (info) => {
            const row = info.row.original;
            const image = row.variant.imageUrl || productImages(row.variant.product.images)[0];
            return (
              <div className="flex items-center gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                  {image ? (
                    <Image src={image} alt="" fill sizes="48px" className="object-cover" />
                  ) : null}
                </div>
                <span>
                  {row.variant.product.title}
                  <span className="block font-tabular text-xs text-muted-foreground">
                    {row.variant.sku}
                  </span>
                </span>
              </div>
            );
          },
        }),
        columnHelper.accessor("type", {
          header: "Type",
          cell: (info) => info.getValue().toLowerCase(),
        }),
        columnHelper.accessor("quantity", {
          header: "Qty",
          meta: { tabular: true },
        }),
        columnHelper.accessor((row) => row.note ?? "—", {
          id: "note",
          header: "Note",
          cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
        }),
      ]),
    [],
  );

  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No stock movements yet.</p>;
  }

  return (
    <AdminDataTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      searchPlaceholder="Search product, SKU, or type"
    />
  );
}
