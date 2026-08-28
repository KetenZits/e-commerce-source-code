import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { uploadProductImage } from "@/server/services/storage";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const area =
    new URL(request.url).searchParams.get("area") === "marketing"
      ? "marketing"
      : "products";
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose an image file." }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return Response.json({ error: "Images must be under 8 MB." }, { status: 400 });
  }

  const url = await uploadProductImage(
    file.name,
    Buffer.from(await file.arrayBuffer()),
    file.type,
    area,
  );
  return Response.json({ url });
}
