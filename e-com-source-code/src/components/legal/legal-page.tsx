import Link from "next/link";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <p className="eyebrow">Legal</p>
      <h1 className="font-display text-3xl">{title}</h1>
      <div className="space-y-4 text-sm leading-7 text-muted-foreground">{children}</div>
      <p className="text-xs">
        <Link href="/legal/contact" className="text-primary">
          Contact
        </Link>
      </p>
    </div>
  );
}
