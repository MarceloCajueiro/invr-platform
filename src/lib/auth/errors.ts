const errorTranslations: Record<string, string> = {
  "user already exists.": "Este e-mail já está cadastrado.",
  "user already exists. use another email.":
    "Este e-mail já está cadastrado. Use outro e-mail.",
  "invalid email or password": "E-mail ou senha inválidos.",
  "invalid email or password.": "E-mail ou senha inválidos.",
  "invalid email": "E-mail inválido.",
  "invalid password": "Senha inválida.",
  "password too short": "A senha é muito curta.",
  "password too long": "A senha é muito longa.",
  "user not found": "Usuário não encontrado.",
  "invalid token": "Token inválido.",
  "token expired": "Token expirado.",
  "email not verified": "E-mail não verificado.",
  "session expired. re-authenticate to perform this action.":
    "Sessão expirada. Faça login novamente.",
  "invalid origin": "Origem inválida.",
  "failed to create user": "Erro ao criar usuário.",
  "failed to create session": "Erro ao criar sessão.",
  "credential account not found": "Conta não encontrada.",
  "validation error": "Erro de validação.",
  "field is required": "Campo obrigatório.",
};

export function translateAuthError(
  message: string | undefined,
  fallback: string,
): string {
  if (!message) return fallback;
  const normalized = message.toLowerCase().trim();
  return errorTranslations[normalized] ?? fallback;
}
