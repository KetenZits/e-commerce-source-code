import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { authOptions } from "@/server/auth";
import { uploadProductImage } from "@/server/services/storage";
import { slipFingerprint } from "@/server/services/audit";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const form = await request.formData();
  const orderId = String(form.get("orderId") ?? "");
  const guestToken = String(form.get("guestToken") ?? "");
  const file = form.get("file");
  if (!orderId) return Response.json({ error: "Missing order." }, { status: 400 });
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose a slip image." }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return Response.json({ error: "Slips must be under 8 MB." }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "PENDING") {
    return Response.json({ error: "Order is not waiting for payment." }, { status: 404 });
  }
  const owns =
    (session?.user?.id && order.userId === session.user.id) ||
    (guestToken && order.guestAccessTokenHash === hashToken(guestToken));
  if (!owns) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = Buffer.from(await file.arrayBuffer());
    const fingerprint = slipFingerprint(body.toString("base64"));
    const duplicate = await db.paymentTransaction.findFirst({
      where: { slipFingerprint: fingerprint, orderId: { not: order.id } },
    });
    if (duplicate) {
      return Response.json({ error: "This slip was already used." }, { status: 409 });
    }
    const url = await uploadProductImage(file.name, body, file.type, "slips");
    await db.paymentTransaction.updateMany({
      where: { orderId: order.id, status: "PENDING" },
      data: { slipFingerprint: fingerprint },
    });
    const jar = await cookies();
    void jar;
    return Response.json({ url, fingerprint });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}
