import { createAuth } from "@/lib/auth/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const auth = await createAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = formData.get("folder") as string | null;

  if (!file || !folder) {
    return Response.json({ error: "Missing file or folder" }, { status: 400 });
  }

  const { env } = await getCloudflareContext({ async: true });
  const bucket = env.BUCKET;

  const key = `${folder}/${Date.now()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();

  await bucket.put(key, arrayBuffer, {
    httpMetadata: { contentType: file.type },
  });

  return Response.json({
    url: `/api/files/${key}`,
    name: file.name,
    size: file.size,
  });
}
