import { z } from "zod";

export const createTurmaSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  color: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

export const updateTurmaSchema = createTurmaSchema.partial().extend({
  notifyNewLesson: z.boolean().optional(),
  notifyNewTask: z.boolean().optional(),
});

export type CreateTurmaInput = z.infer<typeof createTurmaSchema>;
export type UpdateTurmaInput = z.infer<typeof updateTurmaSchema>;
