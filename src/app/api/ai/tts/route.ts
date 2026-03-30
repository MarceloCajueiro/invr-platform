import { createAuth } from "@/lib/auth/server";
import { generateTTS } from "@/lib/services/ai/gemini";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const auth = await createAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "teacher") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text } = (await req.json()) as { text?: string };

  if (!text || typeof text !== "string") {
    return Response.json({ error: "Text is required" }, { status: 400 });
  }

  try {
    const audio = await generateTTS(text);

    // Decode base64 to bytes
    const binaryString = atob(audio.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to R2 via binding
    const { env } = await getCloudflareContext({ async: true });
    const key = `tts/${Date.now()}-${crypto.randomUUID()}.mp3`;
    await env.BUCKET.put(key, bytes, {
      httpMetadata: { contentType: audio.mimeType },
    });

    const audioUrl = `/api/ai/tts/stream?key=${encodeURIComponent(key)}`;

    return Response.json({ audioUrl, key });
  } catch (error) {
    console.error("TTS error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate audio",
      },
      { status: 500 },
    );
  }
}
