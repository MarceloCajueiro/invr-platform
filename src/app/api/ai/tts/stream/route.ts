import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return new Response("Missing key", { status: 400 });
  }

  const { env } = await getCloudflareContext({ async: true });
  const object = await env.BUCKET.get(key);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "audio/mpeg",
      "Cache-Control": "public, max-age=31536000",
    },
  });
}
