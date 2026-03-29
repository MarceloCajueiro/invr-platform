import { createAuth } from "@/lib/auth/server";
import { generatePresignedUrl } from "@/lib/services/storage/r2";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const auth = await createAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileName, contentType, folder } = (await req.json()) as {
    fileName?: string;
    contentType?: string;
    folder?: string;
  };

  if (!fileName || !contentType || !folder) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = await generatePresignedUrl({ fileName, contentType, folder });
  return Response.json(result);
}
