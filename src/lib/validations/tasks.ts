import { z } from "zod";

const quizQuestionSchema = z.object({
  number: z.number(),
  text: z.string().min(1),
  options: z
    .array(
      z.object({
        letter: z.string(),
        text: z.string(),
        correct: z.boolean(),
      }),
    )
    .length(4),
  explanation: z.string().optional(),
});

const fillGapQuestionSchema = z.object({
  number: z.number(),
  text: z.string().min(1),
  answer: z.string().min(1),
  alternatives: z.array(z.string()).optional(),
  explanation: z.string().optional(),
});

const writingPromptSchema = z.object({
  prompt: z.string().min(1),
  instructions: z.string().optional(),
});

const listeningQuestionSchema = z.object({
  text: z.string().min(1),
  audioUrl: z.string().optional(),
  questions: z.array(quizQuestionSchema).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  taskType: z.enum(["quiz", "listening", "fill_gaps", "writing"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  lessonId: z.string().optional(),
  questions: z.string().optional(), // JSON string, validated per type
  publishedAt: z.coerce.date().optional(),
  isHomework: z.coerce.boolean().default(false),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type FillGapQuestion = z.infer<typeof fillGapQuestionSchema>;
export type WritingPrompt = z.infer<typeof writingPromptSchema>;
export type ListeningQuestion = z.infer<typeof listeningQuestionSchema>;
