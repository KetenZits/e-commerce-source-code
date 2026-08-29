import { CategoriesAdmin } from "@/components/admin/categories-admin";
import { serverCaller } from "@/trpc/server";

export default async function CategoriesPage() {
  const categories = await (await serverCaller()).admin.categories();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Collections</h1>
      <CategoriesAdmin categories={categories} />
    </div>
  );
}
