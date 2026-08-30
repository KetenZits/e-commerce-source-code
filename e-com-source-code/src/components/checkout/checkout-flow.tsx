"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { nanoid } from "nanoid";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionDivider } from "@/components/section-divider";
import { THAI_PROVINCES } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import type { StoreMode } from "@/lib/storefront-config";
import { useI18n } from "@/components/i18n/locale-provider";
import { addressSchema } from "@/server/schemas";
import { trpc } from "@/trpc/client";
import type { z } from "zod";

type AddressForm = z.infer<typeof addressSchema>;

export function CheckoutFlow({ storeMode }: { storeMode: StoreMode }) {
  const router = useRouter();
  const { t } = useI18n();
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const [addressId, setAddressId] = useState<string | null>(null);
  const [promo, setPromo] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const idempotencyKey = useMemo(() => `ck_${nanoid(20)}`, []);
  const cart = trpc.cart.get.useQuery();
  const needsShipping =
    storeMode !== "digital" &&
    (cart.data?.lines.length
      ? cart.data.lines.some((line) => line.fulfillmentType !== "DIGITAL")
      : true);
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
  const guestProvince = useWatch({ control: form.control, name: "province" });
  const addresses = trpc.address.list.useQuery(undefined, {
    enabled: signedIn && needsShipping,
  });
  const quote = trpc.order.quoteShipping.useQuery(
    signedIn ? { addressId: addressId ?? undefined } : { province: guestProvince },
    { enabled: needsShipping && (signedIn ? Boolean(addressId) : Boolean(guestProvince)) },
  );
  const totals = trpc.order.previewTotals.useQuery({
    promotionCode: promo || undefined,
    addressId: addressId ?? undefined,
    province: signedIn ? undefined : guestProvince,
  });
  const createAddress = trpc.address.create.useMutation({
    onSuccess: (address) => {
      setAddressId(address.id);
      addresses.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const place = trpc.order.createFromCart.useMutation({
    onSuccess: (order) => {
      const token = order.guestAccessToken;
      router.push(`/checkout/${order.id}${token ? `?g=${token}` : ""}`);
    },
    onError: (error) => toast.error(error.message),
  });

  const outOfStock = cart.data?.lines.some((line) => line.stockQty < line.quantity || line.stockQty < 1) ?? false;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-xl">{t("checkout.cartReview")}</h2>
        {!cart.data || cart.data.lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("checkout.empty")}{" "}
            <Link href="/catalog" className="text-primary">
              {t("checkout.continue")}
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
                    {line.fulfillmentType === "DIGITAL" ? ` · ${t("checkout.digital")}` : ""}
                    {line.stockQty < 1 ? ` · ${t("checkout.outOfStock")}` : ""}
                  </span>
                </span>
                <span className="font-tabular text-right">{formatMoney(line.lineTotalCents)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm">
              <span>{t("checkout.subtotal")}</span>
              <span className="font-tabular">{formatMoney(cart.data.subtotalCents)}</span>
            </div>
            {totals.data?.discountCents ? (
              <div className="flex justify-between text-sm text-primary">
                <span>{t("checkout.discount")}</span>
                <span className="font-tabular">-{formatMoney(totals.data.discountCents)}</span>
              </div>
            ) : null}
            {totals.data?.taxCents ? (
              <div className="flex justify-between text-sm">
                <span>{t("checkout.vat")}</span>
                <span className="font-tabular">{formatMoney(totals.data.taxCents)}</span>
              </div>
            ) : null}
            <Link href="/cart" className="text-sm text-primary">
              {t("checkout.editCart")}
            </Link>
          </div>
        )}
      </section>

      {!signedIn ? (
        <>
          <SectionDivider />
          <section className="space-y-3">
            <h2 className="font-display text-xl">{t("checkout.guestDetails")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("checkout.guestHint")}{" "}
              <Link href="/auth/signin?callbackUrl=/checkout" className="text-primary">
                {t("checkout.signIn")}
              </Link>
              .
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("checkout.name")}>
                <Input value={guestName} onChange={(event) => setGuestName(event.target.value)} />
              </Field>
              <Field label={t("checkout.email")}>
                <Input type="email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} />
              </Field>
            </div>
          </section>
        </>
      ) : null}

      {needsShipping ? (
        <>
          <SectionDivider />
          <section className="space-y-4">
            <h2 className="font-display text-xl">{t("checkout.shippingAddress")}</h2>
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
              onSubmit={form.handleSubmit((values) => signedIn && createAddress.mutate(values))}
            >
              <p className="eyebrow sm:col-span-2">{signedIn ? t("checkout.newAddress") : t("checkout.deliveryAddress")}</p>
              <Field label={t("checkout.recipient")}>
                <Input {...form.register("recipientName")} />
              </Field>
              <Field label={t("checkout.phone")}>
                <Input {...form.register("phone")} />
              </Field>
              <Field label={t("checkout.address")} className="sm:col-span-2">
                <Input {...form.register("addressLine1")} />
              </Field>
              <Field label={t("checkout.subdistrict")}>
                <Input {...form.register("subdistrict")} />
              </Field>
              <Field label={t("checkout.district")}>
                <Input {...form.register("district")} />
              </Field>
              <Field label={t("checkout.province")}>
                <select className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm" {...form.register("province")}>
                  {THAI_PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("checkout.postalCode")}>
                <Input {...form.register("postalCode")} />
              </Field>
              {signedIn ? (
                <div className="sm:col-span-2">
                  <Button type="submit" variant="outline" disabled={createAddress.isPending}>
                    {t("checkout.saveAddress")}
                  </Button>
                </div>
              ) : null}
            </form>
          </section>

          <SectionDivider />
          <section className="space-y-3">
            <h2 className="font-display text-xl">{t("checkout.shippingMethod")}</h2>
            {quote.data ? (
              <div className="rounded-xl border border-primary bg-card p-4 text-sm">
                <p>{quote.data.zone.name}</p>
                <p className="font-tabular mt-1 text-brass">{formatMoney(quote.data.feeCents)}</p>
                <p className="mt-1 text-muted-foreground">{t("checkout.eta")} {quote.data.estimatedDelivery}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("checkout.selectAddress")}</p>
            )}
          </section>
        </>
      ) : (
        <>
          <SectionDivider />
          <section className="rounded-xl border border-primary/40 bg-card p-5">
            <p className="eyebrow">{t("checkout.digitalDelivery")}</p>
            <h2 className="font-display mt-2 text-xl">{t("checkout.noShipping")}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("checkout.digitalHint")}
            </p>
          </section>
        </>
      )}

      <SectionDivider />
      <section className="space-y-3">
        <h2 className="font-display text-xl">{t("checkout.promo")}</h2>
        <Input
          placeholder={t("checkout.promoPlaceholder")}
          value={promo}
          onChange={(event) => setPromo(event.target.value.toUpperCase())}
        />
      </section>

      <SectionDivider />
      <section className="space-y-3">
        <h2 className="font-display text-xl">{needsShipping ? "4" : "2"}. {t("checkout.payment")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("checkout.qrHint")}
        </p>
        {outOfStock ? <p className="text-sm text-destructive">{t("checkout.removeOos")}</p> : null}
        <Button
          disabled={
            (needsShipping && signedIn && (!addressId || !quote.data)) ||
            (needsShipping && !signedIn && (!quote.data || !form.getValues("recipientName"))) ||
            (!signedIn && (!guestEmail || !guestName)) ||
            !cart.data?.lines.length ||
            outOfStock ||
            place.isPending
          }
          onClick={() => {
            const guest = signedIn ? undefined : { email: guestEmail.trim(), name: guestName.trim() };
            const shippingAddress = !signedIn && needsShipping ? form.getValues() : undefined;
            place.mutate({
              addressId: signedIn && needsShipping ? addressId ?? undefined : undefined,
              shippingZoneId: needsShipping ? quote.data?.zone.id : undefined,
              promotionCode: promo || undefined,
              idempotencyKey,
              guest,
              shippingAddress,
            });
          }}
        >
          {place.isPending ? t("checkout.placing") : t("checkout.continuePay")}
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
