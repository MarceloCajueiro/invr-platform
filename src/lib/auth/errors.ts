const errorTranslations: Record<string, string> = {
  "User already exists.": "Este e-mail já está cadastrado.",
  "User already exists. Use another email.":
    "Este e-mail já está cadastrado. Use outro e-mail.",
  "Invalid email or password": "E-mail ou senha inválidos.",
  "Invalid email": "E-mail inválido.",
  "Invalid password": "Senha inválida.",
  "Password too short": "A senha é muito curta.",
  "Password too long": "A senha é muito longa.",
  "User not found": "Usuário não encontrado.",
  "Invalid token": "Token inválido.",
  "Token expired": "Token expirado.",
  "Email not verified": "E-mail não verificado.",
  "Session expired. Re-authenticate to perform this action.":
    "Sessão expirada. Faça login novamente.",
  "Invalid origin": "Origem inválida.",
  "Failed to create user": "Erro ao criar usuário.",
  "Failed to create session": "Erro ao criar sessão.",
  "Credential account not found": "Conta não encontrada.",
  "Validation Error": "Erro de validação.",
  "Field is required": "Campo obrigatório.",
};

export function translateAuthError(
  message: string | undefined,
  fallback: string,
): string {
  if (!message) return fallback;
  return errorTranslations[message] ?? fallback;
}
