"use client";

export function InventoryMovements({
  rows,
}: {
  rows: {
    id: string;
    type: string;
    quantity: number;
    note: string | null;
    createdAt: Date;
    variant: { sku: string; product: { title: string } };
  }[];
}) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No stock movements yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-xs tracking-[0.12em] text-muted-foreground uppercase">
          <tr>
            <th className="px-3 py-2 font-medium">When</th>
            <th className="px-3 py-2 font-medium">Product</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Qty</th>
            <th className="px-3 py-2 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border">
              <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                {new Date(row.createdAt).toLocaleString()}
              </td>
              <td className="px-3 py-2">
                {row.variant.product.title}
                <span className="block font-tabular text-xs text-muted-foreground">{row.variant.sku}</span>
              </td>
              <td className="px-3 py-2">{row.type.toLowerCase()}</td>
              <td className="font-tabular px-3 py-2">{row.quantity}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.note ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
