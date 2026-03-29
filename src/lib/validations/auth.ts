import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const signUpSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export const inviteStudentSchema = z.object({
  email: z.string().email("Email inválido"),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type InviteStudentInput = z.infer<typeof inviteStudentSchema>;
