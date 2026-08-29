"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";

export function CategoriesAdmin({
  categories,
}: {
  categories: { id: string; name: string; slug: string; parentId: string | null }[];
}) {
  const router = useRouter();
  const save = trpc.admin.upsertCategory.useMutation({
    onSuccess: () => {
      toast.message("Collection saved");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const remove = trpc.admin.deleteCategory.useMutation({
    onSuccess: () => {
      toast.message("Collection removed");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          save.mutate({
            name: String(data.get("name") ?? ""),
            slug: String(data.get("slug") ?? ""),
            parentId: String(data.get("parentId") ?? "") || null,
            sortOrder: Number(data.get("sortOrder") ?? 0),
          });
        }}
      >
        <Input name="name" placeholder="Name" required />
        <Input name="slug" placeholder="slug" required className="font-tabular" />
        <select name="parentId" className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm">
          <option value="">Top-level collection</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <Input name="sortOrder" type="number" defaultValue={0} className="font-tabular" />
        <Button type="submit" disabled={save.isPending}>
          Add collection
        </Button>
      </form>
      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <div>
              <p className="text-sm">{category.name}</p>
              <p className="font-tabular text-xs text-muted-foreground">{category.slug}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => remove.mutate({ id: category.id })}>
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
