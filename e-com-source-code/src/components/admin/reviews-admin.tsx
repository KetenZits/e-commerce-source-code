"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";

export function ReviewsAdmin({
  reviews,
}: {
  reviews: {
    id: string;
    rating: number;
    comment: string;
    status: string;
    product: { title: string };
    user: { email: string | null; name: string | null };
  }[];
}) {
  const router = useRouter();
  const moderate = trpc.admin.moderateReview.useMutation({
    onSuccess: () => {
      toast.message("Review updated");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <article key={review.id} className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm">
            {review.product.title} · {review.rating}/5 · {review.status.toLowerCase()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{review.user.email}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.comment}</p>
          {review.status === "PENDING" ? (
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => moderate.mutate({ reviewId: review.id, status: "PUBLISHED" })}>
                Publish
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => moderate.mutate({ reviewId: review.id, status: "REJECTED" })}
              >
                Reject
              </Button>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
