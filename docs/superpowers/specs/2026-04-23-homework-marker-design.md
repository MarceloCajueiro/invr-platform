# Selo de Homework — Design Spec

**Date:** 2026-04-23
**Status:** Approved for planning
**Scope:** `tasks` (aluno + professora)

## Problem

Tarefas hoje não distinguem "fazer quando quiser" de "fazer para a próxima aula". A professora precisa sinalizar ao aluno quais tarefas são **para-casa** — algo que deve estar pronto antes do próximo encontro. O aluno, ao abrir `/tasks`, precisa identificar rapidamente quais tarefas exigem prioridade.

## Goals

1. Professora pode **marcar/desmarcar** qualquer tarefa como homework no editor.
2. Aluno **identifica visualmente** tarefas homework na listagem e no detalhe.
3. Professora **identifica** quais tarefas marcou como homework na sua própria listagem.
4. Filtro opcional na listagem do aluno para ver apenas homework.

## Non-goals

- **Marca d'água elaborada** (carimbo, watermark tipográfico, fita diagonal, etc.) — foi prototipado em v1/v2 mas rejeitado por ora. Fica para refinamento visual futuro.
- **Prazo / data de entrega** — homework é relativo à "próxima aula", não a uma data específica. Sem campo `dueAt`.
- **Notificação** ao aluno quando tarefa vira homework.
- **Estatísticas** de homework concluído/não concluído (pode virar feature depois).
- **Escalonamento** para `lessons`, `posts` ou `challenges` — apenas `tasks` por ora.

## Decisão visual

Decisão final após duas rodadas de protótipo (`src/app/prototypes/homework-watermark/page.tsx`):

**Selo label** — componente simples que vive junto com as outras badges da tarefa.

- **Cor:** `challenges` (`#fdcb6e`, amarelo/gold do DS).
  - Razão: `tarefas` (verde) já identifica o pilar; usar de novo seria redundante. `challenges` está livre no contexto de tarefas.
- **Ícone:** `BookOpenCheck` (Lucide) — representa caderno + feito.
- **Texto:** `Homework` (inglês), uppercase, tracking wide.
- **Tipografia:** mesma família das badges existentes (font-body), weight bold, size `10px`.
- **Shape:** pill radius-full, igual às outras badges.

Especificação visual:

```tsx
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-challenges text-[#5a4300]">
  <BookOpenCheck size={10} />
  Homework
</span>
```

Extraído como **novo componente** `src/components/ui/homework-badge.tsx` (ver seção "Novo componente"). Evita acoplamento rígido ao sistema de variantes do Badge — o selo tem ícone + texto fixos, não é só uma variação de cor.

### Onde aparece

| # | Contexto | Local | Arquivo |
|---|---|---|---|
| 1 | Aluno — listagem | Ao lado dos badges `level` e `taskType` no TaskCard | `src/components/student/task-card.tsx` |
| 2 | Aluno — detalhe | Junto aos badges no topo da página de detalhe | `src/app/(student)/tasks/[id]/page.tsx` |
| 3 | Professora — listagem | Na linha de badges ao lado de `type`, `level`, `status` | `src/components/teacher/task-list.tsx` |
| 4 | Professora — editor | Badge no topo + checkbox "Marcar como homework" no form | `src/components/teacher/task-form.tsx` |

## Comportamento

### Marcação

Professora marca/desmarca no editor de tarefa (checkbox). Default: `false` (tarefa normal). Pode mudar a qualquer momento — não há lock.

### Filtro aluno (opcional, nice-to-have)

Na listagem `/tasks`, adicionar chip de filtro "Só homework" ao lado dos filtros existentes. Não obrigatório para MVP.

### Ordenação

**Sem impacto** em ordenação. A ordem existente (`publishedAt DESC`) se mantém. Homework e não-homework aparecem misturados — o selo basta para diferenciação visual.

### Migração

Tarefas existentes: `isHomework = false`. Nenhuma ação necessária pela professora.

## Schema

Adicionar coluna em `tasks`:

```ts
// src/lib/db/schema.ts — dentro de sqliteTable("tasks", ...)
isHomework: integer("is_homework", { mode: "boolean" })
  .notNull()
  .default(false),
```

- Tipo boolean stored as integer 0/1 (padrão D1).
- `notNull` + `default(false)` — todos registros existentes viram `false` automaticamente na migração.
- Sem index — cardinalidade baixa e filtro é opcional/raro.

### Migration

```bash
npm run db:generate   # gera migration Drizzle
npm run db:migrate:local
```

Aplicar em prod via Cloudflare D1 migration após merge.

## Validação

Em `src/lib/validations/tasks.ts`, adicionar campo ao schema Zod:

```ts
isHomework: z.coerce.boolean().default(false),
```

`coerce` porque FormData chega como string (`"on"` / ausente).

## Server Actions

`src/lib/actions/tasks.ts` — `createTask` e `updateTask` já recebem o FormData completo; basta incluir `isHomework` no Zod schema e no insert/update.

## Queries

`src/lib/queries/tasks.ts` — `getTasks` (lista professora) e query pública do aluno (`getStudentTasks` ou equivalente) retornam o novo campo automaticamente via `select *`. **Apenas** se incluirem explicitamente colunas, adicionar `isHomework`.

Filtro aluno opcional:

```ts
// Se filters.homework === "true"
and(eq(tasks.isHomework, true))
```

## UI — detalhes por contexto

### 1. Student TaskCard (`src/components/student/task-card.tsx`)

Adicionar `task.isHomework?: boolean` à interface `TaskCardProps.task`. Renderizar `<HomeworkBadge />` na linha de badges quando `isHomework === true`:

```tsx
<div className="flex items-center gap-2 mb-1 flex-wrap">
  <Badge variant={task.level as BadgeVariant}>{levelLabels[task.level]}</Badge>
  <Badge variant="default">{config.label}</Badge>
  {task.isHomework && <HomeworkBadge />}
</div>
```

Nota: trocar `flex items-center gap-2` para também ter `flex-wrap` para acomodar o badge extra em telas menores sem quebrar layout.

### 2. Student detail (`src/app/(student)/tasks/[id]/page.tsx`)

Mesma lógica: adicionar `<HomeworkBadge />` à linha de badges no topo quando `task.isHomework`.

### 3. Teacher TaskList (`src/components/teacher/task-list.tsx`)

Adicionar `isHomework: boolean` à interface `Task`. Renderizar na linha de badges existente junto com `typeBadge`, `levelBadge`, `statusBadge`.

### 4. Teacher TaskForm (`src/components/teacher/task-form.tsx`)

Adicionar checkbox `isHomework` ao form. Layout sugerido (seguindo o padrão do protótipo v2):

```tsx
<label className="flex items-start gap-3 cursor-pointer">
  <input type="checkbox" name="isHomework" defaultChecked={task?.isHomework} />
  <div>
    <div className="flex items-center gap-2">
      <span className="font-medium">Marcar como <em>homework</em></span>
      <HomeworkBadge />
    </div>
    <p className="text-sm text-text-muted mt-0.5">
      Sinaliza para o aluno que esta tarefa deve estar pronta para a próxima aula.
    </p>
  </div>
</label>
```

## Novo componente

`src/components/ui/homework-badge.tsx` — componente dedicado com ícone + texto fixos. Motivo: o termo "Homework" + ícone `BookOpenCheck` são acoplados e sempre aparecem juntos; um componente deixa as 4 integrações triviais e fecha a forma visual.

```tsx
import { BookOpenCheck } from "lucide-react";

export function HomeworkBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-challenges text-[#5a4300]">
      <BookOpenCheck size={10} />
      Homework
    </span>
  );
}
```

Observação sobre o texto `#5a4300`: é um tom escuro derivado de `challenges` para contraste AA sobre o fundo amarelo. Não é token nomeado — pode virar `--color-challenges-ink` se reutilizado em outros lugares, mas por ora é hardcoded para não inflar tokens.

## Tests (Playwright E2E)

- `e2e/teacher-homework.spec.ts` — teacher cria tarefa marcada como homework, confirma badge no editor e na listagem.
- `e2e/student-homework.spec.ts` — student vê badge em `/tasks` e no detalhe; cards não-homework não exibem o selo.

## CLAUDE.md

Adicionar à seção "Design System" → "UI Components", abaixo da linha do Badge:

```
import { HomeworkBadge } from "@/components/ui/homework-badge"; // selo fixo para tarefas marcadas como "homework" — cor challenges + ícone BookOpenCheck + termo "Homework" em inglês
```

## Cleanup após merge

- Remover rota `src/app/prototypes/homework-watermark/` (arquivo de brainstorming).
- Remover entrada `/prototypes` de `publicPaths` em `src/middleware.ts`.
- Remover `.playwright-mcp/` screenshots do worktree (mantém no gitignore? já está).

## Plano de rollout

1. Migration schema (isolada, sem impacto UI).
2. Componente `HomeworkBadge` + variant Badge.
3. Validation + server actions.
4. Teacher form (checkbox) — professora pode marcar, mas aluno ainda não vê.
5. Teacher listing badge.
6. Student card + detail badges.
7. (Opcional) Filtro "Só homework" na listagem do aluno.
8. E2E tests.
9. Cleanup protótipo + middleware.

Cada etapa é commit atômico seguindo Conventional Commits.
