"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n/locale-provider";
import { trpc } from "@/trpc/client";

export function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const create = trpc.review.create.useMutation({
    onSuccess: (review) => {
      toast.message(review.status === "PUBLISHED" ? t("review.published") : t("review.submitted"));
      setComment("");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form
      className="space-y-3 rounded-xl border border-border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        create.mutate({ productId, rating, comment });
      }}
    >
      <p className="text-sm font-medium">{t("review.write")}</p>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">{t("review.rating")}</span>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <Textarea
        required
        minLength={10}
        rows={4}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder={t("review.placeholder")}
      />
      <Button type="submit" size="sm" disabled={create.isPending}>
        {create.isPending ? t("review.sending") : t("review.submit")}
      </Button>
    </form>
  );
}
