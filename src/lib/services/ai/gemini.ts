import { GoogleGenAI } from "@google/genai";
import { getCloudflareContext } from "@opennextjs/cloudflare";

async function getGeminiClient() {
  const { env } = await getCloudflareContext({ async: true });
  return new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
}

export async function generateTTS(
  text: string,
): Promise<{ data: string; mimeType: string }> {
  const ai = await getGeminiClient();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: `Read this text aloud clearly: ${text}`,
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Kore",
          },
        },
      },
    },
  });

  const audioPart = response.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.mimeType?.startsWith("audio/"),
  );

  if (!audioPart?.inlineData?.data || !audioPart.inlineData.mimeType) {
    throw new Error("No audio generated");
  }

  return {
    data: audioPart.inlineData.data,
    mimeType: audioPart.inlineData.mimeType,
  };
}
