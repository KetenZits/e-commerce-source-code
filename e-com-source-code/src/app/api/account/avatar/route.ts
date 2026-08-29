import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db } from "@/lib/db";
import { uploadProductImage } from "@/server/services/storage";
import { writeAuditLog } from "@/server/services/audit";

const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Sign in to change your photo." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose an image file." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Photos must be under 2 MB." }, { status: 400 });
  }

  try {
    const url = await uploadProductImage(
      file.name,
      Buffer.from(await file.arrayBuffer()),
      file.type,
      "avatars",
    );
    await db.user.update({
      where: { id: session.user.id },
      data: { image: url },
    });
    await writeAuditLog({
      actorId: session.user.id,
      action: "auth.avatar-updated",
      entityType: "User",
      entityId: session.user.id,
    });
    return Response.json({ url });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Sign in to change your photo." }, { status: 401 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { image: null },
  });
  await writeAuditLog({
    actorId: session.user.id,
    action: "auth.avatar-removed",
    entityType: "User",
    entityId: session.user.id,
  });
  return Response.json({ ok: true });
}
