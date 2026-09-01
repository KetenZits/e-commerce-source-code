"use client";

import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFns,
  globalFilteringFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const adminTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns,
  columnMeta: {} as { align?: "left" | "right"; tabular?: boolean; nowrap?: boolean },
});

export type AdminColumnDef<TData extends RowData> = ColumnDef<typeof adminTableFeatures, TData>;

export function createAdminColumnHelper<TData extends RowData>() {
  return createColumnHelper<typeof adminTableFeatures, TData>();
}

export function AdminDataTable<TData extends RowData>({
  data,
  columns,
  getRowId,
  searchPlaceholder = "Search",
  empty = "No matching rows.",
  onRowClick,
  minWidth = "720px",
}: {
  data: TData[];
  columns: Array<AdminColumnDef<TData>>;
  getRowId?: (row: TData) => string;
  searchPlaceholder?: string;
  empty?: string;
  onRowClick?: (row: TData) => void;
  minWidth?: string;
}) {
  const table = useTable(
    {
      features: adminTableFeatures,
      columns,
      data,
      getRowId,
      globalFilterFn: "includesString",
    },
    (state) => ({
      globalFilter: state.globalFilter,
      sorting: state.sorting,
    }),
  );
  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-3">
      <Input
        value={table.state.globalFilter ?? ""}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        placeholder={searchPlaceholder}
        className="h-9 max-w-sm"
        aria-label={searchPlaceholder}
      />
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead className="border-b border-border text-xs tracking-[0.12em] text-muted-foreground uppercase">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta;
                  const sortable = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "px-4 py-3 font-medium",
                        meta?.align === "right" && "text-right",
                      )}
                    >
                        {header.isPlaceholder ? null : sortable ? (
                          <button
                            type="button"
                            className={cn(
                              "inline-flex items-center gap-1 uppercase",
                              meta?.align === "right" && "ml-auto",
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <table.FlexRender header={header} />
                            {sorted === "asc" ? (
                              <ArrowUp className="size-3" />
                            ) : sorted === "desc" ? (
                              <ArrowDown className="size-3" />
                            ) : (
                              <ChevronsUpDown className="size-3 opacity-40" />
                            )}
                          </button>
                        ) : (
                          <table.FlexRender header={header} />
                        )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "link" : undefined}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === "Enter") onRowClick(row.original);
                        }
                      : undefined
                  }
                  className={cn(
                    "border-b border-border last:border-b-0",
                    onRowClick &&
                      "cursor-pointer hover:bg-muted/50 focus:bg-muted/50 focus:outline-none",
                  )}
                >
                  {row.getAllCells().map((cell) => {
                    const meta = cell.column.columnDef.meta;
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-4 py-4",
                          meta?.align === "right" && "text-right",
                          meta?.tabular && "font-tabular",
                          meta?.nowrap && "whitespace-nowrap",
                        )}
                      >
                        <table.FlexRender cell={cell} />
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
