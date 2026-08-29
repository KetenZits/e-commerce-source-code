"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-20 text-center">
      <h1 className="font-display text-3xl">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        The page failed to load. Try again, or return to the catalog.
      </p>
      <button
        type="button"
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
