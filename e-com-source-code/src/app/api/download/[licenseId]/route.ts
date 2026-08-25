import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/server/auth";
import { presignDownload } from "@/server/services/storage";

export async function GET(req: NextRequest, context: { params: Promise<{ licenseId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to download." }, { status: 401 });
  }

  const { licenseId } = await context.params;
  const license = await db.license.findFirst({
    where: { id: licenseId, userId: session.user.id },
    include: { product: { include: { assets: true } } },
  });
  if (!license) return NextResponse.json({ error: "License not found." }, { status: 404 });
  if (license.revokedAt) return NextResponse.json({ error: "This license has been revoked." }, { status: 403 });
  if (license.expiresAt && license.expiresAt < new Date()) {
    return NextResponse.json({ error: "This license has expired." }, { status: 403 });
  }
  if (license.downloadCount >= license.maxDownloads) {
    return NextResponse.json({ error: "Download limit reached." }, { status: 403 });
  }

  await db.$transaction([
    db.license.update({
      where: { id: license.id },
      data: { downloadCount: { increment: 1 } },
    }),
    db.downloadLog.create({
      data: {
        licenseId: license.id,
        userId: session.user.id,
        productId: license.productId,
        ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent"),
      },
    }),
  ]);

  const asset = license.product.assets[0];
  const signed = asset ? await presignDownload(asset.r2Key) : null;
  if (signed) {
    return NextResponse.redirect(signed);
  }

  const body = [
    `# ${license.product.title}`,
    ``,
    `License key: ${license.licenseKey}`,
    `This is a local placeholder archive. Connect Cloudflare R2 to serve the real zip.`,
    ``,
    license.product.tagline,
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${license.product.slug}-license.txt"`,
    },
  });
}
