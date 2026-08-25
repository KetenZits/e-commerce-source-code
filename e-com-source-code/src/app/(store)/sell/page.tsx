export default function SellPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-12">
      <h1 className="text-3xl font-semibold">Sell your code</h1>
      <pre className="rounded-lg border border-hair bg-void p-6 font-mono text-sm leading-7 text-muted-foreground">
        {`$ waitlist --sellers
> seller onboarding is not open.
> this marketplace is single-vendor for now.
> email admin@sourcecode.dev if you have a listing.`}
      </pre>
    </div>
  );
}
