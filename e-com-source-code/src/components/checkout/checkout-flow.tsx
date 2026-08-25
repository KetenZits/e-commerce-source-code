"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionDivider } from "@/components/section-divider";
import { THAI_PROVINCES } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { addressSchema } from "@/server/schemas";
import { trpc } from "@/trpc/client";
import type { z } from "zod";

type AddressForm = z.infer<typeof addressSchema>;

export function CheckoutFlow() {
  const router = useRouter();
  const { status } = useSession();
  const [addressId, setAddressId] = useState<string | null>(null);
  const cart = trpc.cart.get.useQuery(undefined, { enabled: status === "authenticated" });
  const addresses = trpc.address.list.useQuery(undefined, { enabled: status === "authenticated" });
  const quote = trpc.order.quoteShipping.useQuery(
    { addressId: addressId ?? "" },
    { enabled: Boolean(addressId) }
  );
  const createAddress = trpc.address.create.useMutation({
    onSuccess: (address) => {
      setAddressId(address.id);
      addresses.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const place = trpc.order.createFromCart.useMutation({
    onSuccess: (order) => router.push(`/checkout/${order.id}`),
    onError: (error) => toast.error(error.message),
  });
  const form = useForm<AddressForm>({
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
      isDefault: true,
    },
  });

  if (status === "unauthenticated") {
    router.push("/auth/signin?callbackUrl=/checkout");
    return null;
  }

  const outOfStock = cart.data?.lines.some((line) => line.stockQty < line.quantity || line.stockQty < 1) ?? false;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-xl">1. Cart review</h2>
        {!cart.data || cart.data.lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Your cart is empty.{" "}
            <Link href="/catalog" className="text-primary">
              Continue shopping
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-2">
            {cart.data.lines.map((line) => (
              <div key={line.id} className="flex justify-between gap-4 text-sm">
                <span>
                  {line.product.title}
                  <span className="block text-muted-foreground">
                    {line.attributeLabel} × {line.quantity}
                    {line.stockQty < 1 ? " · Out of stock" : ""}
                  </span>
                </span>
                <span className="font-tabular text-right">{formatMoney(line.lineTotalCents)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-tabular">{formatMoney(cart.data.subtotalCents)}</span>
            </div>
            <Link href="/cart" className="text-sm text-primary">
              Edit cart
            </Link>
          </div>
        )}
      </section>

      <SectionDivider />

      <section className="space-y-4">
        <h2 className="font-display text-xl">2. Shipping address</h2>
        <div className="space-y-2">
          {addresses.data?.map((address) => (
            <label
              key={address.id}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${addressId === address.id ? "border-primary" : "border-border"}`}
            >
              <input type="radio" name="address" checked={addressId === address.id} onChange={() => setAddressId(address.id)} />
              <span className="text-sm leading-6">
                <strong>{address.recipientName}</strong>
                <br />
                {address.addressLine1}, {address.subdistrict}, {address.district}, {address.province} {address.postalCode}
              </span>
            </label>
          ))}
        </div>
        <form
          className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit((values) => createAddress.mutate(values))}
        >
          <p className="eyebrow sm:col-span-2">New address</p>
          <Field label="Recipient">
            <Input {...form.register("recipientName")} />
          </Field>
          <Field label="Phone">
            <Input {...form.register("phone")} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Input {...form.register("addressLine1")} />
          </Field>
          <Field label="Subdistrict">
            <Input {...form.register("subdistrict")} />
          </Field>
          <Field label="District">
            <Input {...form.register("district")} />
          </Field>
          <Field label="Province">
            <select className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm" {...form.register("province")}>
              {THAI_PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Postal code">
            <Input {...form.register("postalCode")} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" variant="outline" disabled={createAddress.isPending}>
              Save address
            </Button>
          </div>
        </form>
      </section>

      <SectionDivider />

      <section className="space-y-3">
        <h2 className="font-display text-xl">3. Shipping method</h2>
        {quote.data ? (
          <div className="rounded-xl border border-primary bg-card p-4 text-sm">
            <p>{quote.data.zone.name}</p>
            <p className="font-tabular mt-1 text-brass">{formatMoney(quote.data.feeCents)}</p>
            <p className="mt-1 text-muted-foreground">Estimated delivery {quote.data.estimatedDelivery}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select an address to see the shipping fee.</p>
        )}
      </section>

      <SectionDivider />

      <section className="space-y-3">
        <h2 className="font-display text-xl">4. Payment</h2>
        <p className="text-sm text-muted-foreground">
          You will receive a PromptPay QR on the next screen. The order is packed after the transfer is verified.
        </p>
        {outOfStock ? <p className="text-sm text-destructive">Remove out-of-stock items before paying.</p> : null}
        <Button
          disabled={!addressId || !quote.data || !cart.data?.lines.length || outOfStock || place.isPending}
          onClick={() => {
            if (!addressId || !quote.data) return;
            place.mutate({ addressId, shippingZoneId: quote.data.zone.id });
          }}
        >
          {place.isPending ? "Placing order" : "Continue to PromptPay"}
        </Button>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
