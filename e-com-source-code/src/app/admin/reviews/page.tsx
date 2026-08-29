import { ReviewsAdmin } from "@/components/admin/reviews-admin";
import { serverCaller } from "@/trpc/server";

export default async function ReviewsPage() {
  const reviews = await (await serverCaller()).admin.reviews();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Reviews</h1>
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <ReviewsAdmin reviews={reviews} />
      )}
    </div>
  );
}
