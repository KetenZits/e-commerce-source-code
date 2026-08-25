import { CartView } from "@/components/cart/cart-view";

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <h1 className="font-display text-3xl">Cart</h1>
      <CartView />
    </div>
  );
}
