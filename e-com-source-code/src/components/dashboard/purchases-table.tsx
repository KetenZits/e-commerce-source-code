"use client";

import { useMemo } from "react";
import { flexRender } from "@tanstack/react-table";
import { getCoreRowModel, useLegacyTable } from "@tanstack/react-table/legacy";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/trpc/client";

type Row = {
  id: string;
  title: string;
  licenseKey: string;
  remaining: number;
  purchasedAt: string;
  status: "active" | "expired" | "revoked";
};

export function PurchasesTable({ rows }: { rows: Row[] }) {
  const download = trpc.license.downloadUrl.useMutation({
    onSuccess: (result) => {
      window.location.href = result.url;
    },
    onError: (error) => toast.error(error.message),
  });

  const columns = useMemo(
    () => [
      { accessorKey: "title", header: "Product" },
      {
        accessorKey: "licenseKey",
        header: "License",
        cell: ({ row }: { row: { original: Row } }) => (
          <button
            type="button"
            className="font-mono text-xs hover:text-amber"
            onClick={() => {
              navigator.clipboard.writeText(row.original.licenseKey);
              toast.message("License key copied");
            }}
          >
            {row.original.licenseKey}
          </button>
        ),
      },
      {
        accessorKey: "remaining",
        header: "Downloads",
        cell: ({ row }: { row: { original: Row } }) => `${row.original.remaining} left`,
      },
      {
        accessorKey: "purchasedAt",
        header: "Purchased",
        cell: ({ row }: { row: { original: Row } }) => format(new Date(row.original.purchasedAt), "d MMM yyyy"),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: { row: { original: Row } }) => {
          const status = row.original.status;
          return (
            <StatusChip tone={status === "active" ? "add" : "del"}>
              {status}
            </StatusChip>
          );
        },
      },
      {
        id: "download",
        header: "",
        cell: ({ row }: { row: { original: Row } }) => (
          <Button
            size="sm"
            disabled={row.original.status !== "active" || download.isPending}
            onClick={() => download.mutate({ licenseId: row.original.id })}
          >
            Download
          </Button>
        ),
      },
    ],
    [download]
  );

  const table = useLegacyTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => (
              <TableHead key={header.id} className="font-plex text-[10px] tracking-[0.14em] uppercase">
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className={row.original.status !== "active" ? "opacity-50" : undefined}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
