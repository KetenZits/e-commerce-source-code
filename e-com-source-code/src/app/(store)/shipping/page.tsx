export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <h1 className="font-display text-3xl">Shipping</h1>
      <p className="leading-7 text-muted-foreground">
        Orders ship from Bangkok after payment is confirmed. Bangkok metropolitan deliveries usually arrive in two to four days. The rest of Thailand, four to seven.
      </p>
      <ul className="space-y-3 text-sm leading-6">
        <li>
          <span className="text-brass">Metro.</span> Bangkok and neighbouring provinces, from ฿50 depending on weight.
        </li>
        <li>
          <span className="text-brass">Nationwide.</span> A flat upcountry rate, from ฿80.
        </li>
        <li>
          <span className="text-brass">Payment.</span> PromptPay QR. The parcel is packed after the transfer is verified.
        </li>
      </ul>
    </div>
  );
}
