"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n/locale-provider";
import { trpc } from "@/trpc/client";

export function ReviewForm({ productId }: { productId: string }) {
  const { t } = useI18n();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const create = trpc.review.create.useMutation({
    onSuccess: () => {
      toast.message(t("review.submitted"));
      setComment("");
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
      <select
        className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
        value={rating}
        onChange={(event) => setRating(Number(event.target.value))}
      >
        {[5, 4, 3, 2, 1].map((value) => (
          <option key={value} value={value}>
            {value} {value === 1 ? t("review.star") : t("review.stars")}
          </option>
        ))}
      </select>
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
