import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  slug: z
    .string()
    .min(1, "Slug é obrigatório")
    .regex(/^[a-z0-9-]+$/, "Slug inválido"),
  content: z.string().optional(),
  coverImageUrl: z.string().optional(),
  category: z.enum(["tips", "grammar", "culture", "vocabulary"]),
  featured: z.boolean().optional(),
  publishedAt: z.coerce.date().optional(),
});

export const updatePostSchema = createPostSchema.partial();

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
