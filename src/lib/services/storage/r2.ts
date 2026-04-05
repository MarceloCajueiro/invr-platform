import { AwsClient } from "aws4fetch";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface PresignOptions {
  fileName: string;
  contentType: string;
  folder: string;
  expiresIn?: number;
}

export async function generatePresignedUrl({
  fileName,
  contentType,
  folder,
  expiresIn = 3600,
}: PresignOptions) {
  const { env } = await getCloudflareContext({ async: true });
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  const bucketName = "fluent-storage";

  const client = new AwsClient({
    service: "s3",
    region: "auto",
    accessKeyId,
    secretAccessKey,
  });

  const key = `${folder}/${Date.now()}-${fileName}`;
  const r2Url = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`;

  const signed = await client.sign(
    new Request(`${r2Url}?X-Amz-Expires=${expiresIn}`, {
      method: "PUT",
      headers: { "Content-Type": contentType },
    }),
    { aws: { signQuery: true } }
  );

  return {
    uploadUrl: signed.url.toString(),
    key,
    publicUrl: `https://pub-${accountId}.r2.dev/${key}`,
  };
}

export async function generatePresignedGetUrl(key: string, expiresIn = 3600) {
  const { env } = await getCloudflareContext({ async: true });
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  const bucketName = "fluent-storage";

  const client = new AwsClient({
    service: "s3",
    region: "auto",
    accessKeyId,
    secretAccessKey,
  });

  const r2Url = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`;

  const signed = await client.sign(
    new Request(`${r2Url}?X-Amz-Expires=${expiresIn}`, {
      method: "GET",
    }),
    { aws: { signQuery: true } }
  );

  return signed.url.toString();
}
