import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { protectedProcedure, router } from "@/server/trpc";
import { presignDownload } from "@/server/services/storage";

export const licenseRouter = router({
  mine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.license.findMany({
      where: { userId: ctx.user.id },
      include: { product: true, order: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  downloadUrl: protectedProcedure.input(z.object({ licenseId: z.string() })).mutation(async ({ ctx, input }) => {
    const license = await ctx.db.license.findFirst({
      where: { id: input.licenseId, userId: ctx.user.id },
      include: { product: { include: { assets: true } } },
    });
    if (!license) throw new TRPCError({ code: "NOT_FOUND" });
    if (license.revokedAt) throw new TRPCError({ code: "FORBIDDEN", message: "This license has been revoked." });
    if (license.expiresAt && license.expiresAt < new Date()) {
      throw new TRPCError({ code: "FORBIDDEN", message: "This license has expired." });
    }
    if (license.downloadCount >= license.maxDownloads) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Download limit reached." });
    }

    const asset = license.product.assets[0];
    const signed = asset ? await presignDownload(asset.r2Key) : null;

    return {
      url: signed ?? `/api/download/${license.id}`,
      expiresInMinutes: env.DOWNLOAD_URL_TTL_MINUTES,
      remaining: license.maxDownloads - license.downloadCount,
    };
  }),
});
