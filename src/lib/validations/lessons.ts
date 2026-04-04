import { z } from "zod";

export const createLessonSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  content: z.string().optional(),
  category: z.enum([
    "conversation",
    "grammar",
    "vocabulary",
    "listening",
    "culture",
  ]),
  coverImageUrl: z.string().optional(),
  durationMinutes: z.coerce.number().min(0).optional(),
  position: z.coerce.number().min(0).optional(),
});

export const updateLessonSchema = createLessonSchema.partial();

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
