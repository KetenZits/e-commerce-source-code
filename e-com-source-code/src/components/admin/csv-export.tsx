"use client";

import { Button } from "@/components/ui/button";
import { downloadCsv, toCsv } from "@/lib/csv";
import { trpc } from "@/trpc/client";

export function CatalogExportButton() {
  const query = trpc.admin.exportProducts.useQuery(undefined, { enabled: false });

  return (
    <Button
      type="button"
      variant="outline"
      disabled={query.isFetching}
      onClick={async () => {
        const result = await query.refetch();
        if (result.data) downloadCsv("products.csv", toCsv(result.data));
      }}
    >
      {query.isFetching ? "Exporting" : "Export CSV"}
    </Button>
  );
}

export function OrdersExportButton() {
  const query = trpc.admin.exportOrders.useQuery(undefined, { enabled: false });

  return (
    <Button
      type="button"
      variant="outline"
      disabled={query.isFetching}
      onClick={async () => {
        const result = await query.refetch();
        if (result.data) downloadCsv("orders.csv", toCsv(result.data));
      }}
    >
      {query.isFetching ? "Exporting" : "Export CSV"}
    </Button>
  );
}
