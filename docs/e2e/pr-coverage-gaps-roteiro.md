# Roteiro E2E: Gaps de cobertura dos 3 últimos PRs

## Contexto

Revisão apontou gaps de cobertura em três PRs recentemente mergeados:

- **PR #4** `feat: forgot password` — os specs existentes cobrem UI/erros mas não o happy path fim-a-fim (token real → senha redefinida → login).
- **PR #5** `feat: homework marker` — falta regressão do commit `72354ff` (bug em que desmarcar `isHomework` na edição era silenciosamente ignorado).
- **PR #6** `feat: DateBadge` — nenhum teste verifica se o card-agenda renderiza nos listings de aluno.

## Pré-requisitos

- D1 local seedado (`npm run db:reset`) com usuário `marcelo@fluent.app` / senha `senha12345`.
- Dev server em `http://localhost:3001` (Playwright sobe se necessário).
- `wrangler` CLI disponível (usado para ler token da tabela `verification`).
- Storage states existentes em `e2e/.auth/*.json` (setup automático).

## Cenários

### Happy Path — Forgot password

#### CT-60: Fluxo completo de reset de senha com token real

- **Dado que** o usuário `marcelo@fluent.app` tem conta ativa com senha `senha12345`
- **Quando** solicita reset de senha via `/forgot-password`,
  obtém o token real da tabela `verification` (identifier `reset-password:<token>`),
  acessa `/reset-password?token=<token>`,
  define senha nova e confirma
- **Então** é redirecionado para `/sign-in?reset=success`,
  consegue fazer login com a senha nova,
  e (cleanup) a senha é restaurada para `senha12345` para não quebrar outros specs.

**Detalhes técnicos:**
- Request inicial pode ser via fetch direto na route de better-auth: `POST /api/auth/request-password-reset` com `{ email }`. Evita depender da UI do `/forgot-password` (já testada em outro spec).
- Token: `wrangler d1 execute fluent-db --local --json --command "SELECT identifier, expiresAt FROM verification WHERE identifier LIKE 'reset-password:%' ORDER BY createdAt DESC LIMIT 1"` → `identifier.split(':')[1]`.
- Formulário usa labels "Nova senha" e "Confirmar nova senha" (match `getByLabel`).
- Redirect final: `waitForURL('**/sign-in?reset=success')`.
- **Cleanup obrigatório:** após verificar o login com a nova senha, rodar o fluxo novamente para restaurar `senha12345`. Sem isso, o storage state do student quebra na próxima execução de `npx playwright test`.

### Regressão — Homework uncheck

#### CT-61: Desmarcar `isHomework` em tarefa existente persiste no banco

- **Dado que** a task do seed "Present Simple Quiz" tem `isHomework = true` (HomeworkBadge visível na listagem)
- **Quando** o teacher abre o editor da task, desmarca o checkbox "Marcar como homework" e salva
- **Então** o redirect leva de volta para `/teacher/tasks`,
  o HomeworkBadge NÃO aparece mais no card da "Present Simple Quiz",
  e (cleanup) o checkbox é re-marcado para preservar o estado do seed.

**Detalhes técnicos:**
- O bug corrigido em `72354ff` era: `FormData` omite checkboxes desmarcados; o server action `updateTask` lia `formData.get("isHomework")` e, quando ausente, mantinha o valor antigo em vez de setar `false`.
- O PR #5 já testa o path positivo (criar tarefa marcada). Falta o negativo: *desmarcar e garantir que persiste*.
- Seletor do checkbox: `page.locator('input[name="isHomework"]')`.
- Botão submit: `getByRole("button", { name: /salvar|atualizar/i })` — verificar qual label aparece na edição.
- Reverter: após a asserção final, navegar de volta para o editor, marcar de novo, salvar. Isso mantém o seed consistente entre runs.

### Smoke — DateBadge nos listings

#### CT-62: DateBadge aparece em cada card da lista de aulas do aluno

- **Dado que** o student está autenticado e há aulas publicadas no seed
- **Quando** acessa `/lessons`
- **Então** cada card (`a` wrapper com classe `flex items-stretch gap-3`) contém um `<time datetime>` do DateBadge.

#### CT-63: DateBadge aparece em cada card da lista de tarefas

- **Dado que** o student está autenticado
- **Quando** acessa `/tasks`
- **Então** cada card de tarefa contém um `<time datetime>`.

#### CT-64: DateBadge aparece em cada card do blog

- **Dado que** o student está autenticado e há posts publicados
- **Quando** acessa `/blog`
- **Então** cada card de post contém um `<time datetime>`.

#### CT-65: DateBadge respeita o canal da categoria (atributo dateTime válido)

- **Dado que** o student está em `/lessons`
- **Quando** inspeciona o DateBadge do primeiro card
- **Então** o elemento `<time>` tem atributo `datetime` parseável para uma data válida,
  e `aria-label` em português (contém nome de mês em pt-BR).

**Detalhes técnicos:**
- O componente renderiza `<time dateTime={iso} aria-label={pt-BR}>` com 3 spans (dia, mês curto, ano).
- Seletor estável: `locator('time[datetime]')`. Não há `data-testid`.
- Assertion de cor/canal é frágil (classe Tailwind) — preferir asserções semânticas (existe, tem dateTime válido, aria-label em pt-BR) em vez de checar classes CSS. Isso segue a lição de `1cf983a` (evitar xpath por Tailwind).
- `/blog` usa `section` com grid; listings de aulas/tarefas usam `Link` diretos. Contar `time[datetime]` dentro do `main` é suficiente para smoke.

## Fora do escopo

- Expiração de token de reset-password (better-auth lib testa isso).
- Cobertura de homework para outros `taskType` além de writing (já parcialmente coberto).
- Regressão visual de cor do DateBadge (depende de snapshot — fora do escopo de E2E).
