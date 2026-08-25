import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { env, hasR2 } from "@/lib/env";

function client() {
  return new S3Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

function safeExt(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "jpg";
  return ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext) ? ext : "jpg";
}

export async function uploadProductImage(originalName: string, body: Buffer, contentType: string) {
  const filename = `${nanoid()}.${safeExt(originalName)}`;
  const key = `products/${filename}`;

  if (!hasR2()) {
    const dir = join(process.cwd(), "public", "uploads", "products");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), body);
    return `/uploads/products/${filename}`;
  }

  await client().send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType || "image/jpeg",
    })
  );

  const base = env.R2_PUBLIC_BASE_URL.replace(/\/$/, "");
  if (base) return `${base}/${key}`;
  return key;
}
