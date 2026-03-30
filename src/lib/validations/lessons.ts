import { z } from "zod";

export const createLessonSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  category: z.enum([
    "conversation",
    "grammar",
    "vocabulary",
    "listening",
    "culture",
  ]),
  videoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  coverImageUrl: z.string().optional(),
  audioUrls: z.string().optional(), // JSON array
  documentUrls: z.string().optional(), // JSON array
  durationMinutes: z.coerce.number().min(0).optional(),
  position: z.coerce.number().min(0).optional(),
});

export const updateLessonSchema = createLessonSchema.partial();

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
