import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const key = path.join("/");

  const { env } = await getCloudflareContext({ async: true });
  const object = await env.BUCKET.get(key);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type":
        object.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${key.split("/").pop()}"`,
    },
  });
}
