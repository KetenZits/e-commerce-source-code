"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { asStringArray } from "@/lib/product";
import { formatMoney } from "@/lib/money";
import { trpc } from "@/trpc/client";

type Zone = {
  id: string;
  name: string;
  provinces: unknown;
  minWeightGrams: number;
  maxWeightGrams: number | null;
  feeCents: number;
  sortOrder: number;
};

export function ShippingAdmin({ zones }: { zones: Zone[] }) {
  const router = useRouter();
  const save = trpc.admin.upsertShippingZone.useMutation({
    onSuccess: () => {
      toast.message("Zone saved");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const remove = trpc.admin.deleteShippingZone.useMutation({
    onSuccess: () => router.refresh(),
    onError: (error) => toast.error(error.message),
  });

  function submit(event: React.FormEvent<HTMLFormElement>, id?: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    save.mutate({
      id,
      name: String(data.get("name")),
      provinces: String(data.get("provinces"))
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      minWeightGrams: Number(data.get("min")),
      maxWeightGrams: data.get("max") ? Number(data.get("max")) : null,
      feeCents: Number(data.get("fee")),
      sortOrder: Number(data.get("sort")),
    });
    if (!id) event.currentTarget.reset();
  }

  return (
    <div className="space-y-4">
      <form className="grid gap-2 rounded-xl border border-dashed border-border bg-card p-4 sm:grid-cols-2" onSubmit={(event) => submit(event)}>
        <p className="eyebrow sm:col-span-2">New zone</p>
        <Input name="name" placeholder="Name" required />
        <Input name="provinces" placeholder="Provinces, comma-separated, or *" defaultValue="*" required />
        <Input name="min" type="number" placeholder="Min grams" defaultValue={0} />
        <Input name="max" type="number" placeholder="Max grams (blank = none)" />
        <Input name="fee" type="number" placeholder="Fee satang" required />
        <Input name="sort" type="number" placeholder="Sort order" defaultValue={50} />
        <div className="sm:col-span-2">
          <Button size="sm" type="submit">
            Add zone
          </Button>
        </div>
      </form>
      {zones.map((zone) => (
        <form
          key={zone.id}
          className="grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-2"
          onSubmit={(event) => submit(event, zone.id)}
        >
          <Input name="name" defaultValue={zone.name} />
          <Input name="provinces" defaultValue={asStringArray(zone.provinces).join(", ")} />
          <Input name="min" type="number" defaultValue={zone.minWeightGrams} />
          <Input name="max" type="number" defaultValue={zone.maxWeightGrams ?? ""} placeholder="Max grams (blank = none)" />
          <Input name="fee" type="number" defaultValue={zone.feeCents} />
          <Input name="sort" type="number" defaultValue={zone.sortOrder} />
          <p className="font-tabular text-sm text-brass">{formatMoney(zone.feeCents)}</p>
          <div className="flex gap-2">
            <Button size="sm" type="submit">
              Save
            </Button>
            <Button size="sm" variant="destructive" type="button" onClick={() => remove.mutate({ id: zone.id })}>
              Delete
            </Button>
          </div>
        </form>
      ))}
    </div>
  );
}
