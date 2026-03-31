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

  const { text, voice, level } = (await req.json()) as {
    text?: string;
    voice?: string;
    level?: "beginner" | "intermediate" | "advanced";
  };

  if (!text || typeof text !== "string") {
    return Response.json({ error: "Text is required" }, { status: 400 });
  }

  const validVoices = ["Kore", "Aoede", "Charon", "Puck"];
  const selectedVoice = validVoices.includes(voice ?? "") ? voice! : "Kore";

  const prompt = buildTTSPrompt(text, level ?? "intermediate");

  try {
    const audio = await generateTTS(text, selectedVoice, prompt);

    // Decode base64 to raw PCM bytes
    const binaryString = atob(audio.data);
    const pcmBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      pcmBytes[i] = binaryString.charCodeAt(i);
    }

    // Gemini TTS returns raw PCM (audio/L16;rate=24000). Wrap in WAV header
    // so browsers can play it natively.
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const wavBytes = createWavFromPcm(pcmBytes, sampleRate, numChannels, bitsPerSample);

    // Upload to R2 via binding
    const { env } = await getCloudflareContext({ async: true });
    const key = `tts/${Date.now()}-${crypto.randomUUID()}.wav`;
    await env.BUCKET.put(key, wavBytes, {
      httpMetadata: { contentType: "audio/wav" },
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

function buildTTSPrompt(
  text: string,
  level: "beginner" | "intermediate" | "advanced",
): string {
  const pacing: Record<string, string> = {
    beginner:
      "Read very slowly and clearly, with noticeable pauses between sentences. " +
      "Enunciate each word carefully and distinctly, as if speaking to someone " +
      "learning English for the first time. Prioritize clarity over natural flow.",
    intermediate:
      "Read at a moderate, steady pace. Speak clearly and naturally, with brief " +
      "pauses between sentences. Pronounce words distinctly but without sounding " +
      "artificially slow. Aim for clear, teacher-like delivery.",
    advanced:
      "Read at a natural conversational pace and rhythm, as a native English " +
      "speaker would in everyday speech. Use natural intonation, connected speech, " +
      "and normal sentence flow.",
  };

  return (
    `You are recording audio for an English language lesson. ` +
    `${pacing[level]} ` +
    `Here is the text to read aloud:\n\n${text}`
  );
}

function createWavFromPcm(
  pcm: Uint8Array,
  sampleRate: number,
  numChannels: number,
  bitsPerSample: number,
): Uint8Array {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  // fmt sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const output = new Uint8Array(buffer);
  output.set(pcm, 44);
  return output;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
