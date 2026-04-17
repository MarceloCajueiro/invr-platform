# Publicação agendada — Design Spec

**Date:** 2026-04-17
**Status:** Approved for planning
**Scope:** `lessons`, `posts`, `tasks`, `challenges`

## Problem

Teacher precisa planejar conteúdo com antecedência. Hoje, qualquer item publicado aparece imediatamente para o aluno. Falta:

- Campo de data de publicação editável no form.
- Default: data de hoje.
- Suporte a data futura (agendamento).
- Filtro para ocultar itens com `publishedAt > hoje` do aluno.
- Exibição da data para o aluno (contextualização temporal).

## Goals

1. Teacher agenda item para publicação futura (só data, sem hora).
2. Aluno só vê itens cujo `publishedAt <= hoje` (e `status = 'published'`).
3. Aluno vê a data de publicação em cards e páginas de detalhe.
4. Itens existentes migram sem quebrar: `publishedAt = createdAt`.

## Non-goals

- Agendamento com hora específica (apenas granularidade dia).
- Notificação/email quando item agendado é publicado.
- Despublicação agendada (expiração).
- Fuso horário por usuário (usa UTC server-side).

## Comportamento

### Filtro aluno

```sql
status = 'published' AND publishedAt <= date('now')
```

### Ordenação aluno

`publishedAt DESC` (mais recentes primeiro).

### Teacher

Vê tudo, inclusive agendados. Badge visual identifica `publishedAt > hoje`.

### Granularidade

Data apenas. Comparações em start-of-day UTC. Display `pt-BR` (`DD/MM/YYYY`).

## Schema

Adicionar coluna em cada uma das 4 tabelas (`lessons`, `posts`, `tasks`, `challenges`):

```ts
publishedAt: integer("published_at", { mode: "timestamp" }),
```

Nullable. Novos registros recebem default `now()` via action/validação (não via DB default, pois tecnicamente permite null via fallback `createdAt` em queries).

### Migration

1. `ALTER TABLE` adiciona coluna nullable em cada tabela.
2. `UPDATE` popula `published_at = created_at` para registros existentes.
3. Index opcional em `(teacher_id, status, published_at)` para queries student (avaliar em plan).

## UI Teacher

### Form fields

Todos 4 forms (`lesson-form`, `task-form`, `post-form`, `challenge-form`):

- `<input type="date">` estilizado consistente com DS `Input`.
- Label: "Data de publicação"
- Default: hoje (`new Date().toISOString().split('T')[0]`)
- Helper text: "Pode agendar para o futuro — alunos só veem a partir dessa data."

### Badge "Agendado"

Nova variant `scheduled` em `src/components/ui/badge.tsx`:

```ts
scheduled: "bg-challenges-bg text-challenges"
```

Uso:

```tsx
{publishedAt > today && (
  <Badge variant="scheduled">
    <Clock size={12} /> Agendado · {formatDate(publishedAt)}
  </Badge>
)}
```

### Cards/listas teacher

Mostrar data de publicação em todos teacher cards:
- `text-xs text-text-muted`
- Se agendado: badge "Agendado · DD/MM" em vez do texto plano.

## UI Aluno

### Cards

Mostrar `publishedAt` em todos 4 cards:
- `src/components/student/lesson-card.tsx`
- `src/components/student/task-card.tsx`
- `src/components/student/post-card.tsx` (já tem `createdAt` → trocar)
- `src/components/student/challenge-card.tsx`

Padrão: `text-xs text-text-muted`, formato `DD/MM/YYYY`, no footer do card.

### Páginas detail

- `src/app/(student)/blog/[slug]/page.tsx` — já usa `createdAt` → trocar por `publishedAt`.
- `src/components/student/challenge-response-section.tsx` — revisar se deve usar data do challenge ou do response.
- Lesson detail e task detail — adicionar data perto do título (`text-sm text-text-muted`).

## DS Extension

### Badge variant `scheduled`

Adicionar em `variantStyles` de `src/components/ui/badge.tsx`. Atualizar lista no `CLAUDE.md` (seção "UI Components").

## Arquivos afetados

**Schema/DB**
- `src/lib/db/schema.ts` — add `publishedAt` em 4 tabelas
- `drizzle/NNNN_*.sql` — migration (gerada)

**Validations**
- `src/lib/validations/lesson.ts`
- `src/lib/validations/task.ts`
- `src/lib/validations/post.ts`
- `src/lib/validations/challenge.ts`

**Actions** (aceitar `publishedAt` em create/update)
- `src/lib/actions/lessons.ts`
- `src/lib/actions/tasks.ts`
- `src/lib/actions/posts.ts`
- `src/lib/actions/challenges.ts`

**Queries student** (filtro `publishedAt <= now`, order `DESC`)
- `src/lib/queries/lessons.ts`
- `src/lib/queries/tasks.ts`
- `src/lib/queries/posts.ts`
- `src/lib/queries/challenges.ts`

**Teacher forms**
- `src/components/teacher/lesson-form.tsx`
- `src/components/teacher/task-form.tsx`
- `src/components/teacher/post-form.tsx`
- `src/components/teacher/challenge-form.tsx`

**Teacher cards/listas**
- Identificar e atualizar cards/listas teacher (mostrar badge agendado).

**Student cards**
- `src/components/student/lesson-card.tsx`
- `src/components/student/task-card.tsx`
- `src/components/student/post-card.tsx`
- `src/components/student/challenge-card.tsx`

**Student detail pages**
- `src/app/(student)/blog/[slug]/page.tsx`
- `src/app/(student)/lessons/[id]/page.tsx` (se existir)
- `src/app/(student)/tasks/[id]/page.tsx` (se existir)
- `src/components/student/challenge-response-section.tsx`

**DS**
- `src/components/ui/badge.tsx` — add variant
- `CLAUDE.md` — doc variant

## Edge cases

- **`publishedAt` null**: não deve acontecer após migration, mas queries usam `COALESCE(published_at, created_at)` como defesa.
- **Timezone**: UTC server-side. Aluno em fuso diferente pode ver item algumas horas antes/depois da meia-noite local. Aceitável para granularidade dia.
- **Draft + publishedAt futuro**: `status` filter já exclui drafts do aluno. Combinação é válida (teacher pode ter draft agendado).
- **Mudança de status draft → published**: não altera `publishedAt`. Teacher controla data explicitamente.
- **Retrodatar**: permitido. Item aparece imediatamente (se `publishedAt <= hoje`).

## Testing

E2E Playwright:
- Teacher cria lesson com `publishedAt` futuro → aluno não vê.
- Teacher cria lesson com `publishedAt` hoje → aluno vê imediatamente.
- Teacher retrodata lesson existente → ordem atualiza.
- Badge "Agendado" aparece no teacher list quando `publishedAt > hoje`.
- Blog post detail mostra `publishedAt` (não `createdAt`).
