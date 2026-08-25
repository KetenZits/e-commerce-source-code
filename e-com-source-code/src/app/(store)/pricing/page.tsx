export default function PricingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-semibold">Pricing</h1>
      <p className="text-sm leading-7 text-muted-foreground">
        Every listing is a one-time license. You pay the price on the card, get a key bound to your account, and download the archive. Updates are included for six months. There is no marketplace commission layered on top of PromptPay — you transfer the listed amount.
      </p>
      <ul className="space-y-3 text-sm leading-6">
        <li>
          <span className="text-amber">Buyer.</span> Price is in Thai baht. Checkout is PromptPay QR plus slip verification.
        </li>
        <li>
          <span className="text-amber">License.</span> Five signed downloads by default. Revoked or expired keys stay visible in My purchases.
        </li>
        <li>
          <span className="text-amber">Seller intake.</span> Not open yet. Use Sell your code if you want to be notified.
        </li>
      </ul>
    </div>
  );
}
