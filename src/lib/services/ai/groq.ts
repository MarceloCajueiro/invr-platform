import Groq from "groq-sdk";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { QuizQuestion, FillGapQuestion, WritingPrompt } from "@/lib/validations/tasks";

export type WritingCorrection = {
  score: number;
  feedback: string;
  errors: Array<{
    original: string;
    correction: string;
    type: "grammar" | "vocabulary" | "spelling";
    explanation: string;
  }>;
  tips: string[];
};

async function getGroqClient() {
  const { env } = await getCloudflareContext({ async: true });
  return new Groq({ apiKey: env.GROQ_API_KEY });
}

function parseJsonResponse<T>(content: string): T {
  // Strip potential markdown fencing
  const cleaned = content
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  // If the response is wrapped in an object with a single array key, unwrap it
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const keys = Object.keys(parsed);
    if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
      return parsed[keys[0]] as T;
    }
  }

  return parsed as T;
}

export async function generateQuizQuestions(
  prompt: string,
  level: string,
  count: number,
): Promise<QuizQuestion[]> {
  const groq = await getGroqClient();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an English language teacher creating quiz questions. Generate exactly ${count} multiple-choice questions about "${prompt}" for ${level} level students.

Return a JSON array where each item has:
- number: sequential number starting from 1
- text: the question text
- options: array of exactly 4 objects, each with "letter" (a/b/c/d), "text" (option text), "correct" (boolean, exactly one true)
- explanation: brief explanation of the correct answer

Return ONLY valid JSON, no markdown, no extra text.`,
      },
      {
        role: "user",
        content: `Generate ${count} quiz questions about "${prompt}" for ${level} level.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from Groq");
  }

  try {
    const questions = parseJsonResponse<QuizQuestion[]>(content);

    if (!Array.isArray(questions)) {
      throw new Error("Response is not an array");
    }

    return questions.map((q, i) => ({
      number: q.number ?? i + 1,
      text: q.text,
      options: q.options.map((opt) => ({
        letter: opt.letter,
        text: opt.text,
        correct: opt.correct,
      })),
      explanation: q.explanation,
    }));
  } catch (error) {
    throw new Error(
      `Failed to parse quiz questions: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function generateFillGapQuestions(
  prompt: string,
  level: string,
  count: number,
): Promise<FillGapQuestion[]> {
  const groq = await getGroqClient();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an English language teacher creating fill-in-the-gap exercises. Generate exactly ${count} sentences about "${prompt}" for ${level} level students.

Return a JSON array where each item has:
- number: sequential number starting from 1
- text: a sentence with "______" (6 underscores) replacing the word to fill
- answer: the correct word/phrase to fill the gap
- alternatives: array of acceptable alternative answers
- explanation: brief explanation

Return ONLY valid JSON, no markdown, no extra text.`,
      },
      {
        role: "user",
        content: `Generate ${count} fill-in-the-gap sentences about "${prompt}" for ${level} level.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from Groq");
  }

  try {
    const questions = parseJsonResponse<FillGapQuestion[]>(content);

    if (!Array.isArray(questions)) {
      throw new Error("Response is not an array");
    }

    return questions.map((q, i) => ({
      number: q.number ?? i + 1,
      text: q.text,
      answer: q.answer,
      alternatives: q.alternatives ?? [],
      explanation: q.explanation,
    }));
  } catch (error) {
    throw new Error(
      `Failed to parse fill-gap questions: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function generateWritingPrompt(
  theme: string,
  level: string,
): Promise<WritingPrompt> {
  const groq = await getGroqClient();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an English language teacher creating a writing exercise. Create a writing prompt about "${theme}" for ${level} level students.

Return a JSON object with:
- prompt: the writing task description (2-3 sentences)
- instructions: specific requirements (grammar focus, word count, structure tips)

Return ONLY valid JSON, no markdown, no extra text.`,
      },
      {
        role: "user",
        content: `Create a writing prompt about "${theme}" for ${level} level.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from Groq");
  }

  try {
    const result = parseJsonResponse<WritingPrompt>(content);

    return {
      prompt: result.prompt,
      instructions: result.instructions,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse writing prompt: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function correctWriting(
  text: string,
  prompt: string,
  level: string,
): Promise<WritingCorrection> {
  const groq = await getGroqClient();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an English teacher reviewing a student's writing exercise. The student is at ${level} level.

Original prompt: ${prompt}
Student's text: ${text}

Evaluate grammar, vocabulary, coherence, and task compliance. Provide feedback in Portuguese (Brazilian).

Return a JSON object with:
- score: number from 0 to 10
- feedback: a brief encouraging message in Portuguese
- errors: array of objects with "original" (the error), "correction" (the fix), "type" ("grammar"/"vocabulary"/"spelling"), "explanation" (in Portuguese)
- tips: array of 2-3 improvement tips in Portuguese

Return ONLY valid JSON, no markdown, no extra text.`,
      },
      {
        role: "user",
        content: `Please review this writing:\n\n${text}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from Groq");
  }

  try {
    const result = parseJsonResponse<WritingCorrection>(content);

    return {
      score: Math.min(10, Math.max(0, result.score)),
      feedback: result.feedback,
      errors: (result.errors ?? []).map((e) => ({
        original: e.original,
        correction: e.correction,
        type: e.type,
        explanation: e.explanation,
      })),
      tips: result.tips ?? [],
    };
  } catch (error) {
    throw new Error(
      `Failed to parse writing correction: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
