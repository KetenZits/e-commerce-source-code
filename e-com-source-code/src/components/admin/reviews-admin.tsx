"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminDataTable, createAdminColumnHelper } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string;
  status: string;
  product: { title: string };
  user: { email: string | null; name: string | null };
};

const columnHelper = createAdminColumnHelper<ReviewRow>();

export function ReviewsAutoToggle({ autoPublish }: { autoPublish: boolean }) {
  const router = useRouter();
  const save = trpc.admin.saveReviewSettings.useMutation({
    onSuccess: (settings) => {
      toast.message(
        settings.autoPublish
          ? "New reviews appear on the product page immediately"
          : "New reviews wait for approval",
      );
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
      <div>
        <p className="text-sm font-medium">Auto-publish reviews</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {autoPublish
            ? "Customer reviews go live as soon as they are submitted."
            : "Customer reviews stay hidden until you publish them."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={autoPublish}
        disabled={save.isPending}
        onClick={() => save.mutate({ autoPublish: !autoPublish })}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          autoPublish ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-sm transition-transform",
            autoPublish && "translate-x-5",
          )}
        />
        <span className="sr-only">{autoPublish ? "Disable auto-publish" : "Enable auto-publish"}</span>
      </button>
    </div>
  );
}

export function ReviewsAdmin({ reviews }: { reviews: ReviewRow[] }) {
  const router = useRouter();
  const moderate = trpc.admin.moderateReview.useMutation({
    onSuccess: () => {
      toast.message("Review updated");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor((row) => row.product.title, {
          id: "product",
          header: "Product",
        }),
        columnHelper.accessor("rating", {
          header: "Rating",
          cell: (info) => <StarRating value={info.getValue()} size="sm" />,
        }),
        columnHelper.accessor("status", {
          header: "Status",
          cell: (info) => {
            const status = info.getValue();
            return (
              <StatusChip
                tone={status === "PUBLISHED" ? "forest" : status === "REJECTED" ? "brick" : "brass"}
              >
                {status.toLowerCase()}
              </StatusChip>
            );
          },
        }),
        columnHelper.accessor((row) => row.user.email ?? row.user.name ?? "—", {
          id: "customer",
          header: "Customer",
          cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
        }),
        columnHelper.accessor("comment", {
          header: "Comment",
          cell: (info) => (
            <p className="max-w-md text-sm leading-6 text-muted-foreground">{info.getValue()}</p>
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: "Action",
          enableSorting: false,
          enableGlobalFilter: false,
          cell: (info) => {
            const review = info.row.original;
            if (review.status === "PENDING") {
              return (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => moderate.mutate({ reviewId: review.id, status: "PUBLISHED" })}
                  >
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
              );
            }
            if (review.status === "PUBLISHED") {
              return (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => moderate.mutate({ reviewId: review.id, status: "REJECTED" })}
                >
                  Hide
                </Button>
              );
            }
            return (
              <Button
                size="sm"
                variant="outline"
                onClick={() => moderate.mutate({ reviewId: review.id, status: "PUBLISHED" })}
              >
                Restore
              </Button>
            );
          },
        }),
      ]),
    [moderate],
  );

  return (
    <AdminDataTable
      data={reviews}
      columns={columns}
      getRowId={(row) => row.id}
      searchPlaceholder="Search product, customer, or comment"
      minWidth="900px"
    />
  );
}
