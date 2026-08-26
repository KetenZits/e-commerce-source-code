import Link from "next/link";
import { WishlistView } from "@/components/wishlist/wishlist-view";

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-9 px-4 py-10">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <span>Wishlist</span>
      </nav>
      <div>
        <p className="eyebrow">Saved pieces</p>
        <h1 className="font-display mt-2 text-4xl">Wishlist</h1>
      </div>
      <WishlistView />
    </div>
  );
}
