"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addressSchema } from "@/server/schemas";
import { trpc } from "@/trpc/client";
import { THAI_PROVINCES } from "@/lib/constants";
import type { z } from "zod";

type Form = z.infer<typeof addressSchema>;

export function AddressBook() {
  const list = trpc.address.list.useQuery();
  const create = trpc.address.create.useMutation({
    onSuccess: () => {
      toast.message("Address saved");
      list.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const update = trpc.address.update.useMutation({
    onSuccess: () => {
      toast.message("Address updated");
      list.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const remove = trpc.address.remove.useMutation({
    onSuccess: () => list.refetch(),
  });
  const form = useForm<Form>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      recipientName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      subdistrict: "",
      district: "",
      province: "Bangkok",
      postalCode: "",
      isDefault: false,
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {list.data?.map((address) => (
          <div key={address.id} className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
            <p className="text-sm leading-6">
              <strong>{address.recipientName}</strong>
              <br />
              {address.addressLine1}, {address.subdistrict}, {address.district}, {address.province} {address.postalCode}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  update.mutate({
                    id: address.id,
                    recipientName: address.recipientName,
                    phone: address.phone,
                    addressLine1: address.addressLine1,
                    addressLine2: address.addressLine2 ?? "",
                    subdistrict: address.subdistrict,
                    district: address.district,
                    province: address.province,
                    postalCode: address.postalCode,
                    isDefault: true,
                  })
                }
              >
                Default
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove.mutate({ id: address.id })}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      <form className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2" onSubmit={form.handleSubmit((values) => create.mutate(values))}>
        <Input placeholder="Recipient" {...form.register("recipientName")} />
        <Input placeholder="Phone" {...form.register("phone")} />
        <Input className="sm:col-span-2" placeholder="Address" {...form.register("addressLine1")} />
        <Input placeholder="Subdistrict" {...form.register("subdistrict")} />
        <Input placeholder="District" {...form.register("district")} />
        <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" {...form.register("province")}>
          {THAI_PROVINCES.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </select>
        <Input placeholder="Postal code" {...form.register("postalCode")} />
        <Button type="submit" disabled={create.isPending}>
          Save address
        </Button>
      </form>
    </div>
  );
}
