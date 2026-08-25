import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

export async function presignDownload(key: string) {
  if (!hasR2()) return null;
  const command = new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key });
  return getSignedUrl(client(), command, { expiresIn: env.DOWNLOAD_URL_TTL_MINUTES * 60 });
}

export async function uploadObject(key: string, body: Buffer, contentType: string) {
  if (!hasR2()) return `local://${key}`;
  await client().send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return key;
}
