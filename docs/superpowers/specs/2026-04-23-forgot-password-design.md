# Esqueci minha senha (Password Reset)

## Summary

Usuários (teachers e students) podem recuperar o acesso à conta caso esqueçam a senha. Um link "Esqueci minha senha" na página de sign-in leva a um formulário de solicitação por email; o better-auth gera token, envia email via Resend, e o usuário define uma nova senha por um link único que expira em 24 horas.

## Decisions

- **Biblioteca:** better-auth nativo (`emailAndPassword.sendResetPassword` callback). Sem tabela nova — usa a tabela `verification` existente. Sem server actions custom.
- **Escopo:** Ambos os roles (teacher e student). Um único fluxo atende os dois.
- **Anti-enumeração:** Mensagem genérica ("Se o email existir, enviaremos instruções"), independente de o email existir. É o comportamento built-in do better-auth e não requer código adicional.
- **Expiração:** 24 horas. Token é one-time use (invalidado após reset) — comportamento padrão do better-auth.
- **Pós-reset:** Redirect para `/sign-in?reset=success` com banner verde "Senha redefinida com sucesso. Faça login com sua nova senha." Escolhemos login manual em vez de auto sign-in porque (a) evita acoplar email em query string, (b) é o padrão de mercado (GitHub, Linear), e (c) um clique adicional é aceitável num fluxo de baixa frequência. Detalhes em §4.
- **Invalidação de sessões:** Após reset, todas as sessões existentes são invalidadas pelo better-auth. Usuário volta logado apenas na sessão do reset.
- **Email:** HTML inline no mesmo padrão do email de convite (`src/lib/actions/invitations.ts`): fonte sans-serif, botão purple (`#6c5ce7` / `aulas`), fallback de link em texto. Assinatura "Equipe Inglês na Vida Real". Sender permanece `Fluent <noreply@inglesnavidareal.com.br>`.
- **Validação de senha:** Mínimo 8 caracteres (consistente com a seed `senha12345` e o default do better-auth). Sem requisitos de complexidade extra.
- **Rate limit:** Não aplicar nesta versão. Resend tem rate limit próprio e o volume esperado é baixo. Ficar de olho e adicionar rate limit custom se houver abuso.

## Arquitetura

```
[/sign-in] ── link "Esqueci minha senha" ──▶ [/forgot-password]
                                                     │
                                                     │ authClient.forgetPassword({
                                                     │   email, redirectTo: "/reset-password"
                                                     │ })
                                                     ▼
                                           [better-auth gera token em `verification`]
                                                     │
                                                     │ callback sendResetPassword({ user, url })
                                                     ▼
                                           [sendEmail (Resend) → inbox]
                                                     │
                                                     ▼
                                           [Email com CTA → /reset-password?token=XYZ]
                                                     │
                                                     ▼
                                           [/reset-password?token=XYZ]
                                                     │
                                                     │ authClient.resetPassword({
                                                     │   newPassword, token
                                                     │ })
                                                     ▼
                                           [better-auth valida token, atualiza senha,
                                            invalida sessões existentes]
                                                     │
                                                     │ sign-in automático usando auth.signIn.email
                                                     ▼
                                           [Redirect por role]
```

## Mudanças de código

### 1. `src/lib/auth/server.ts` — adicionar callback `sendResetPassword`

```ts
emailAndPassword: {
  enabled: true,
  autoSignIn: true,
  sendResetPassword: async ({ user, url }) => {
    await sendEmail({
      to: user.email,
      subject: "Redefinir sua senha — Inglês na Vida Real",
      html: renderResetPasswordEmail({ url, name: user.name }),
    });
  },
  resetPasswordTokenExpiresIn: 60 * 60 * 24, // 24h em segundos
},
```

### 2. Novo: `src/lib/services/email/templates/reset-password.ts`

Função pura `renderResetPasswordEmail({ url, name }): string` que retorna HTML inline. Segue o mesmo estilo visual do template de convite (fonte sans-serif, container 480px, botão `#6c5ce7`, radius 8px, footer `#999` 13px). Conteúdo:

- Título: "Redefinir sua senha"
- Parágrafo: `Olá, ${name}. Recebemos uma solicitação para redefinir a senha da sua conta.`
- Botão CTA: "Redefinir senha" → `url`
- Fallback: "Se o botão não funcionar, copie e cole este link no navegador: {url}"
- Footer: "Este link expira em 24 horas. Se você não solicitou, pode ignorar este email. — Equipe Inglês na Vida Real"

Motivo de extrair em módulo separado: o template de convite hoje vive inline dentro de `actions/invitations.ts`. Manter o de reset em `services/email/templates/` estabelece o padrão pra extrair o de convite no futuro (fora de escopo).

### 3. Nova página: `src/app/(auth)/forgot-password/page.tsx`

Client component. Formulário com campo email. Ao submeter:
- `authClient.forgetPassword({ email, redirectTo: "/reset-password" })`
- Independente do resultado (incluindo erro), renderizar estado de sucesso: "Se existir uma conta para este email, você receberá as instruções em alguns minutos."
- Estilo visual consistente com `/sign-in` (mesmo layout, headline `text-3xl font-extrabold`, inputs com classes Tailwind do design system).
- Link "Voltar para o login" no rodapé.

### 4. Nova página: `src/app/(auth)/reset-password/page.tsx`

Client component. Lê `token` de `searchParams` (Next 16: `Promise<{ token?: string }>`, usar `use()`). Se ausente, renderiza estado "Link inválido" com link pra `/forgot-password`.

Formulário:
- Campo "Nova senha" (type password, mínimo 8 chars, toggle show/hide igual sign-in)
- Campo "Confirmar nova senha"
- Validação client: senhas iguais, mínimo 8 chars. Exibir erro inline.

Ao submeter:
- `authClient.resetPassword({ newPassword, token })`
- Em caso de erro (token inválido/expirado), exibir mensagem traduzida via `translateAuthError` com link pra `/forgot-password`.
- Em caso de sucesso, redirect para `/sign-in?reset=success`. A página de sign-in exibe banner verde (`bg-success/10 text-success`) "Senha redefinida com sucesso. Faça login com sua nova senha."

Razão de não fazer auto sign-in: o better-auth não faz auto sign-in pós-reset (precisaríamos ter o email no client para chamar `signIn.email`). Alternativas para obter o email no client acoplariam o email em query string, o que é indesejável por segurança. Um clique adicional em um fluxo de baixa frequência é aceitável e consistente com GitHub/Linear.

### 5. `src/app/(auth)/sign-in/page.tsx`

Duas mudanças:
- Adicionar link `<Link href="/forgot-password">Esqueci minha senha</Link>` abaixo do campo de senha, alinhado à direita, classe `text-sm text-aulas hover:underline`.
- Ler `searchParams.reset === "success"` e renderizar banner verde de sucesso acima do form. Next 16: usar hook `useSearchParams` do `next/navigation`.

### 6. `src/lib/auth/errors.ts`

Adicionar traduções pt-BR para mensagens do better-auth relacionadas a reset:

- `"Invalid token"` → `"Link inválido ou expirado. Solicite um novo."`
- `"Token has expired"` → `"Este link expirou. Solicite um novo."`
- `"Password too short"` → `"A senha deve ter no mínimo 8 caracteres."`

(Os strings exatos do better-auth serão confirmados no passo de implementação; o mapa aceita ambos.)

## Fluxo de erros

| Situação | Comportamento |
|---|---|
| Email vazio ou inválido em `/forgot-password` | Validação HTML5 (`type="email" required`) |
| Email não existe no sistema | Mesma mensagem de sucesso (anti-enumeração) |
| Envio de email falha (Resend down) | better-auth propaga o erro; exibir mensagem "Não foi possível enviar o email no momento. Tente novamente em instantes." |
| Token inválido em `/reset-password` | Mensagem de erro + link pra `/forgot-password` |
| Token expirado | Idem |
| Token já usado | Idem (better-auth invalida após uso) |
| Senha < 8 caracteres | Validação client + server (better-auth rejeita) |
| Senhas não conferem | Validação client apenas (erro inline) |

## Testes (Playwright)

Suite em `e2e/forgot-password.spec.ts`, projeto `auth` (sem storage state):

1. **Feliz:** ir para `/sign-in` → clicar "Esqueci minha senha" → preencher email do teacher seed → submeter → esperar estado de sucesso.
2. **Sign-in banner pós-reset:** navegar direto para `/sign-in?reset=success` → esperar banner verde visível.
3. **Token ausente:** `/reset-password` sem query → esperar estado "Link inválido".
4. **Token inválido:** `/reset-password?token=xxxxx-invalid` → preencher senhas → submeter → esperar mensagem de erro traduzida.
5. **Validação client:** `/reset-password?token=qualquer` → senhas diferentes → submeter → esperar erro "As senhas não conferem" sem fazer request.

Geração de token válido para teste end-to-end completo (solicitar → receber email → reset → sign-in) depende de interceptar o email enviado. Para o escopo desta PR, testamos até o ponto de submissão no `/forgot-password`; o reset real com token válido fica coberto por teste manual antes do deploy (usando Resend). Deixar TODO na spec para teste E2E completo com mock de email em iteração futura.

## Fora de escopo

- Rate limit / captcha no endpoint `forgetPassword` (adicionar se abuso for detectado).
- Extração do template do email de convite para `services/email/templates/` (já é um TODO, não vamos puxar agora).
- Inconsistência de brand "Fluent" vs "Inglês na Vida Real" — usamos "Inglês na Vida Real" aqui conforme decisão do usuário; alinhar os dois emails é iteração futura.
- Teste E2E que intercepta email real (requer infra de email mock).
