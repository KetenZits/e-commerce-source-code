import { ReviewsAdmin, ReviewsAutoToggle } from "@/components/admin/reviews-admin";
import { serverCaller } from "@/trpc/server";

export default async function ReviewsPage() {
  const caller = await serverCaller();
  const [reviews, settings] = await Promise.all([
    caller.admin.reviews(),
    caller.admin.reviewSettings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {reviews.length} review{reviews.length === 1 ? "" : "s"}
        </p>
      </div>
      <ReviewsAutoToggle autoPublish={settings.autoPublish} />
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <ReviewsAdmin reviews={reviews} />
      )}
    </div>
  );
}
