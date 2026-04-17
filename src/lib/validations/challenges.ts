import { z } from "zod";

export const createChallengeSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  coverImageUrl: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional(),
});

export const updateChallengeSchema = createChallengeSchema.partial();

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
export type UpdateChallengeInput = z.infer<typeof updateChallengeSchema>;
