"use server";

import { getTeacher } from "@/lib/auth/get-teacher";
import {
  generateQuizQuestions,
  generateFillGapQuestions,
  generateWritingPrompt,
} from "@/lib/services/ai/groq";

export async function generateTaskQuestions(
  taskType: "quiz" | "fill_gaps" | "writing",
  prompt: string,
  level: "beginner" | "intermediate" | "advanced",
  count: number,
) {
  // 1. Auth check
  await getTeacher();

  // 2. Validate inputs
  if (!prompt || prompt.length < 3) throw new Error("Prompt muito curto");
  if (count < 1 || count > 30)
    throw new Error("Quantidade deve ser entre 1 e 30");

  // 3. Call appropriate service
  try {
    switch (taskType) {
      case "quiz": {
        const quizQuestions = await generateQuizQuestions(prompt, level, count);
        return {
          success: true as const,
          questions: JSON.stringify(quizQuestions),
          type: "quiz" as const,
        };
      }

      case "fill_gaps": {
        const fillQuestions = await generateFillGapQuestions(
          prompt,
          level,
          count,
        );
        return {
          success: true as const,
          questions: JSON.stringify(fillQuestions),
          type: "fill_gaps" as const,
        };
      }

      case "writing": {
        const writingPrompt = await generateWritingPrompt(prompt, level);
        return {
          success: true as const,
          questions: JSON.stringify(writingPrompt),
          type: "writing" as const,
        };
      }

      default:
        throw new Error("Tipo de tarefa não suportado para geração IA");
    }
  } catch (error) {
    console.error("AI generation error:", error);
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Erro ao gerar conteúdo",
    };
  }
}
