# Selo de Homework — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que a professora marque tarefas como "homework" (para-casa) com indicação visual para o aluno identificar rapidamente na listagem e no detalhe.

**Architecture:** Novo campo booleano `isHomework` em `tasks`. Componente dedicado `HomeworkBadge` (ícone `BookOpenCheck` + texto "Homework" + cor `challenges`). Checkbox no form de tarefa da professora. Renderização condicional em 4 contextos (listagem aluno, detalhe aluno, listagem professora, editor professora).

**Tech Stack:** Next.js 16 + Drizzle ORM (D1) + Zod + React Server Components + Server Actions + Playwright E2E.

**Spec:** `docs/superpowers/specs/2026-04-23-homework-marker-design.md`

---

## File Structure

### Criar

- `src/components/ui/homework-badge.tsx` — componente visual fixo do selo.
- `drizzle/<auto>_homework.sql` — migration gerada via `npm run db:generate`.
- `e2e/homework.spec.ts` — E2E teacher + student.

### Modificar

- `src/lib/db/schema.ts` — adicionar coluna `isHomework` em `tasks`.
- `src/lib/validations/tasks.ts` — adicionar `isHomework` ao Zod schema.
- `src/lib/actions/tasks.ts` — passar `isHomework` para insert/update.
- `src/lib/queries/tasks.ts` — nada (select * já retorna).
- `src/lib/queries/student-tasks.ts` — nada (select * já retorna).
- `src/components/teacher/task-form.tsx` — checkbox "Marcar como homework".
- `src/components/teacher/task-list.tsx` — badge na linha de metadados.
- `src/components/student/task-card.tsx` — badge na linha de metadados.
- `src/app/(student)/tasks/[id]/page.tsx` — badge no header da tela.
- `src/middleware.ts` — remover `/prototypes` de `publicPaths` (cleanup).

### Remover (cleanup final)

- `src/app/prototypes/homework-watermark/page.tsx` — protótipo.
- `src/app/prototypes/` — diretório vazio se esta era a única rota.
- `.playwright-mcp/*.png` — screenshots de brainstorm (ficam no gitignore).
- `.superpowers/` — pasta do visual companion (já no gitignore).
- `homework-*.png` na raiz do worktree (screencapture manual).

---

## Task 1: Schema — coluna `isHomework` em `tasks`

**Files:**
- Modify: `src/lib/db/schema.ts`
- Create: `drizzle/<generated>_homework.sql`

- [ ] **Step 1: Adicionar coluna no schema Drizzle**

Em `src/lib/db/schema.ts`, na definição de `sqliteTable("tasks", ...)`, adicionar após a linha `aiPrompt: text("ai_prompt"),` (ordem: depois de `aiPrompt` e antes de `publishedAt`):

```ts
isHomework: integer("is_homework", { mode: "boolean" })
  .notNull()
  .default(false),
```

Posição exata (entre `aiPrompt` e `publishedAt`):

```ts
aiPrompt: text("ai_prompt"),
isHomework: integer("is_homework", { mode: "boolean" })
  .notNull()
  .default(false),
publishedAt: integer("published_at", { mode: "timestamp" }),
```

- [ ] **Step 2: Gerar migration**

Run: `npm run db:generate`

Expected: Drizzle cria um arquivo em `drizzle/` nomeado `<numero>_<palavras>.sql` contendo `ALTER TABLE tasks ADD COLUMN is_homework INTEGER DEFAULT false NOT NULL;`.

- [ ] **Step 3: Inspecionar migration gerada**

Run: `ls -1t drizzle/*.sql | head -1 | xargs cat`

Expected: SQL com `ALTER TABLE tasks ADD COLUMN is_homework INTEGER DEFAULT false NOT NULL`. Se vier algo além (rename, drop), abortar — o schema foi modificado mais do que deveria.

- [ ] **Step 4: Aplicar migration localmente**

Run: `npm run db:migrate:local`

Expected: "Migrations applied" ou similar, sem erros.

- [ ] **Step 5: Verificar coluna criada**

Run: `npx wrangler d1 execute fluent-db --local --command="PRAGMA table_info(tasks);" | grep is_homework`

Expected: linha contendo `is_homework` tipo `INTEGER`, not null, default `false` ou `0`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "feat(db): adiciona coluna is_homework em tasks"
```

---

## Task 2: Validation — `isHomework` no Zod schema

**Files:**
- Modify: `src/lib/validations/tasks.ts`

- [ ] **Step 1: Adicionar campo ao `createTaskSchema`**

Em `src/lib/validations/tasks.ts`, dentro de `createTaskSchema`, adicionar a linha após `publishedAt`:

```ts
export const createTaskSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  taskType: z.enum(["quiz", "listening", "fill_gaps", "writing"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  lessonId: z.string().optional(),
  questions: z.string().optional(),
  publishedAt: z.coerce.date().optional(),
  isHomework: z.coerce.boolean().default(false),
});
```

(Adiciona a linha `isHomework: z.coerce.boolean().default(false),` ao final do `.object({...})`.)

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`

Expected: exit code 0 sem erros. `updateTaskSchema` (que é `createTaskSchema.partial()`) herda o novo campo automaticamente.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validations/tasks.ts
git commit -m "feat(validation): inclui isHomework no schema zod de tasks"
```

---

## Task 3: Server Actions — persistir `isHomework`

**Files:**
- Modify: `src/lib/actions/tasks.ts`

- [ ] **Step 1: Passar `isHomework` no `createTask` — raw**

Em `src/lib/actions/tasks.ts`, dentro de `createTask`, no objeto `raw`, adicionar após `publishedAt`:

```ts
const raw = {
  title: formData.get("title"),
  description: formData.get("description"),
  taskType: formData.get("taskType"),
  level: formData.get("level"),
  lessonId: formData.get("lessonId") || undefined,
  questions: formData.get("questions") || undefined,
  publishedAt: publishedAtRaw || new Date().toISOString().split("T")[0],
  isHomework: formData.get("isHomework") === "on",
};
```

(Adiciona `isHomework: formData.get("isHomework") === "on",` — checkbox HTML envia `"on"` quando marcado ou `null` quando desmarcado.)

- [ ] **Step 2: Passar `isHomework` no insert do `createTask`**

No mesmo arquivo, dentro do `db.insert(tasks).values({...})` de `createTask`, adicionar após `publishedAt`:

```ts
const [inserted] = await db.insert(tasks).values({
  teacherId: teacher.id,
  title: parsed.title,
  description: parsed.description || null,
  taskType: parsed.taskType,
  level: parsed.level,
  lessonId: parsed.lessonId || null,
  questions: parsed.questions || null,
  status: "draft",
  aiGenerated: aiGenerated,
  aiPrompt: aiPrompt || null,
  publishedAt: parsed.publishedAt ?? new Date(),
  isHomework: parsed.isHomework,
}).returning({ id: tasks.id });
```

(Adiciona `isHomework: parsed.isHomework,` ao final dos values.)

- [ ] **Step 3: Passar `isHomework` no `updateTask` — raw**

No mesmo arquivo, dentro de `updateTask`, no objeto `raw`, adicionar `isHomework` da mesma forma que no step 1. Localizar o `const raw = {...}` do `updateTask` e adicionar a mesma linha:

```ts
isHomework: formData.get("isHomework") === "on",
```

- [ ] **Step 4: Passar `isHomework` no update do `updateTask`**

No mesmo arquivo, localizar o `db.update(tasks).set({...})` dentro de `updateTask` e adicionar `isHomework: parsed.isHomework` ao objeto `.set({...})` (na mesma posição que estaria no create — após `publishedAt`). Se a propriedade `parsed.isHomework` não existir quando o update é parcial, usar coalescence:

```ts
isHomework: parsed.isHomework ?? false,
```

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/actions/tasks.ts
git commit -m "feat(actions): persiste isHomework em create e update de tasks"
```

---

## Task 4: Componente `HomeworkBadge`

**Files:**
- Create: `src/components/ui/homework-badge.tsx`

- [ ] **Step 1: Criar componente**

Criar `src/components/ui/homework-badge.tsx`:

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

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/homework-badge.tsx
git commit -m "feat(ui): adiciona componente HomeworkBadge"
```

---

## Task 5: Teacher form — checkbox "Marcar como homework"

**Files:**
- Modify: `src/components/teacher/task-form.tsx`

- [ ] **Step 1: Estender `TaskData` com `isHomework`**

Em `src/components/teacher/task-form.tsx`, na interface `TaskData` (linha 19-27), adicionar:

```ts
interface TaskData {
  id: string;
  title: string;
  description: string | null;
  taskType: TaskType;
  level: Level;
  questions: string | null;
  publishedAt: Date | null;
  isHomework: boolean;
}
```

- [ ] **Step 2: Importar `HomeworkBadge`**

No topo do arquivo, adicionar após os imports existentes de componentes UI:

```ts
import { HomeworkBadge } from "@/components/ui/homework-badge";
```

- [ ] **Step 3: Adicionar checkbox ao form**

Localizar no JSX a linha com `{turmas.length > 0 && <TurmaSelector ... />}` (aproximadamente linha 144-146).

Imediatamente **acima** dessa linha, adicionar o bloco do checkbox:

```tsx
<label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-border">
  <input
    type="checkbox"
    name="isHomework"
    defaultChecked={task?.isHomework ?? false}
    className="mt-1 w-4 h-4 rounded border-border text-challenges focus:ring-challenges"
  />
  <div className="flex-1">
    <div className="flex items-center gap-2">
      <span className="font-medium text-text-primary">
        Marcar como <em>homework</em>
      </span>
      <HomeworkBadge />
    </div>
    <p className="text-sm text-text-muted mt-0.5">
      Sinaliza para o aluno que esta tarefa deve estar pronta para a próxima aula.
    </p>
  </div>
</label>
```

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit`

Expected: exit 0. Pode aparecer erro onde o `TaskForm` é invocado (`new/page.tsx`, `[id]/edit/page.tsx`) se o objeto `task` passado não tiver `isHomework`. Se isso ocorrer, prosseguir para step 5.

- [ ] **Step 5: Ajustar callers do TaskForm (se necessário)**

Se `npx tsc --noEmit` reclamar em `src/app/teacher/tasks/[id]/edit/page.tsx` ou similar, abrir o arquivo e verificar se o objeto `task` passado ao `TaskForm` está sendo obtido via `getTask()` (que retorna a row completa com `isHomework`). Se for uma projeção parcial, incluir `isHomework: task.isHomework` no objeto passado ao componente.

Caso a prop seja passada como `task={task}` direto, e `getTask()` já seja `select *`, nenhum ajuste é necessário.

Run novamente: `npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/teacher/task-form.tsx
git commit -m "feat(teacher): adiciona checkbox 'Marcar como homework' no form de tarefa"
```

---

## Task 6: Teacher listing — badge na linha de metadados

**Files:**
- Modify: `src/components/teacher/task-list.tsx`

- [ ] **Step 1: Estender interface `Task`**

Em `src/components/teacher/task-list.tsx`, na interface `Task` (linha 13-23), adicionar `isHomework`:

```ts
interface Task {
  id: string;
  title: string;
  taskType: "quiz" | "listening" | "fill_gaps" | "writing";
  level: "beginner" | "intermediate" | "advanced";
  status: "draft" | "published";
  publishedAt: Date | null;
  questions: string | null;
  createdAt: Date;
  isHomework: boolean;
  turmas: { id: string; name: string; color: string | null }[];
}
```

- [ ] **Step 2: Importar `HomeworkBadge`**

Nos imports do topo do arquivo, adicionar:

```ts
import { HomeworkBadge } from "@/components/ui/homework-badge";
```

- [ ] **Step 3: Renderizar badge na linha de metadados**

Localizar dentro do `.map((task) => { ... })`, dentro da `<div className="flex items-center gap-2 mb-1">` (aproximadamente linha 112), o bloco com os badges. Logo **depois** do `{isScheduled(task.publishedAt) && <Badge variant="scheduled">...}` e antes do fechamento `</div>`, adicionar:

```tsx
{task.isHomework && <HomeworkBadge />}
```

Resultado esperado — a div com badges fica:

```tsx
<div className="flex items-center gap-2 mb-1">
  <Icon size={16} className="text-text-muted shrink-0" />
  <h3 className="text-sm font-semibold text-text-primary truncate">{task.title}</h3>
  <Badge variant={typeBadgeVariant[task.taskType]}>{typeLabels[task.taskType]}</Badge>
  <Badge variant={task.level}>{levelLabels[task.level]}</Badge>
  <Badge variant={task.status}>{statusLabels[task.status]}</Badge>
  {isScheduled(task.publishedAt) && (
    <Badge variant="scheduled">
      <Clock size={10} className="mr-1" />
      Agendado · {formatScheduledDate(task.publishedAt!)}
    </Badge>
  )}
  {task.isHomework && <HomeworkBadge />}
</div>
```

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/teacher/task-list.tsx
git commit -m "feat(teacher): exibe badge homework na listagem de tarefas"
```

---

## Task 7: Student TaskCard — badge na linha de metadados

**Files:**
- Modify: `src/components/student/task-card.tsx`

- [ ] **Step 1: Estender prop `task`**

Em `src/components/student/task-card.tsx`, na interface `TaskCardProps.task` (aproximadamente linha 36-44), adicionar `isHomework`:

```ts
interface TaskCardProps {
  task: {
    id: string;
    title: string;
    taskType: string;
    level: string;
    description?: string | null;
    publishedAt?: Date | null;
    createdAt: Date;
    isHomework?: boolean;
  };
  submission?: {
    score: number | null;
    status: string;
  };
  index?: number;
  href?: string;
}
```

(`isHomework` como opcional — tolerância para callers que não passam o campo.)

- [ ] **Step 2: Importar `HomeworkBadge`**

Nos imports do topo, adicionar:

```ts
import { HomeworkBadge } from "@/components/ui/homework-badge";
```

- [ ] **Step 3: Renderizar badge na linha de metadados e habilitar flex-wrap**

Localizar a `<div className="flex items-center gap-2 mb-1">` dentro do TaskCard (aproximadamente linha 104) e trocar por `flex flex-wrap items-center gap-2 mb-1` (adiciona `flex-wrap` para acomodar o badge extra sem quebrar layout em telas menores).

Adicionar após o `<Badge variant="default">{config.label}</Badge>` e antes do fechamento `</div>`:

```tsx
{task.isHomework && <HomeworkBadge />}
```

Resultado esperado:

```tsx
<div className="flex flex-wrap items-center gap-2 mb-1">
  <Badge variant={(task.level as BadgeVariant) || "default"}>
    {levelLabels[task.level] || task.level}
  </Badge>
  <Badge variant="default">{config.label}</Badge>
  {task.isHomework && <HomeworkBadge />}
</div>
```

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/student/task-card.tsx
git commit -m "feat(student): exibe badge homework no TaskCard"
```

---

## Task 8: Student detail — badge no header

**Files:**
- Modify: `src/app/(student)/tasks/[id]/page.tsx`

- [ ] **Step 1: Importar `HomeworkBadge`**

Em `src/app/(student)/tasks/[id]/page.tsx`, adicionar nos imports:

```ts
import { HomeworkBadge } from "@/components/ui/homework-badge";
```

- [ ] **Step 2: Inspecionar estrutura do header atual**

Abrir o arquivo. O header da task começa em `<div className="mb-6">` (aproximadamente linha 60). Dentro dele há os badges do tipo/level renderizados com `<Badge variant={...}>`. Localizar o bloco onde os badges aparecem.

Se o componente usa `<Badge>` na mesma linha, adicionar `{task.isHomework && <HomeworkBadge />}` depois dos outros badges.

Se os badges estão em lugares diferentes (ex: componente dedicado como `<TaskHeader>`), seguir o mesmo padrão: localizar onde os badges são renderizados e adicionar a renderização condicional do `HomeworkBadge` ao lado.

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`

Expected: exit 0. Se reclamar que `task.isHomework` não existe no tipo retornado pela query, continuar para step 4.

- [ ] **Step 4: Ajustar query se necessário**

Se o tipo do `getStudentTask` não incluir `isHomework`, abrir `src/lib/queries/student-tasks.ts` e verificar se `getStudentTask` usa `select()` (sem argumentos = select *). Se for um select com colunas explícitas, adicionar `isHomework: tasks.isHomework` à projeção. Caso contrário, nenhum ajuste é necessário.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(student\)/tasks/\[id\]/page.tsx
git commit -m "feat(student): exibe badge homework na tela de detalhe da tarefa"
```

---

## Task 9: Seed de dados — marcar uma tarefa de exemplo como homework

**Files:**
- Modify: `scripts/seed.ts` (se existir) OR documentar seed manual

- [ ] **Step 1: Verificar seed**

Run: `ls scripts/ 2>/dev/null || ls src/lib/db/seed* 2>/dev/null`

Expected: localizar arquivo de seed do projeto (provavelmente `src/lib/db/seed.ts` ou `scripts/seed.ts` — `npm run db:seed`).

- [ ] **Step 2: Adicionar flag `isHomework: true` em uma tarefa do seed**

No arquivo de seed, localizar o bloco que insere em `tasks`. Escolher **uma** tarefa de exemplo (a primeira basta) e adicionar `isHomework: true` aos `.values()` daquela task. Exemplo:

```ts
await db.insert(tasks).values({
  // ...outros campos existentes...
  isHomework: true,
});
```

As demais seguem com default `false` (sem precisar explicitar).

- [ ] **Step 3: Re-seed**

Run: `npm run db:reset`

Expected: DB recriada + seed aplicado sem erros.

- [ ] **Step 4: Commit**

```bash
git add scripts/ src/lib/db/
git commit -m "chore(seed): marca uma task de exemplo como homework"
```

---

## Task 10: Smoke test manual (teacher + student)

Sem script automatizado — este é um gate manual antes de E2E. Não pular.

- [ ] **Step 1: Reiniciar dev server**

Run: `npm run dev -- --port 3001`

(Usar `run_in_background: true` se estiver em workflow não-interativo.)

Expected: server sobe em `http://localhost:3001`.

- [ ] **Step 2: Logar como teacher**

Abrir `http://localhost:3001/sign-in`. Login: `fran@fluent.app` / `senha12345`.

- [ ] **Step 3: Criar tarefa marcada como homework**

Navegar para `/teacher/tasks/new`. Preencher título "Smoke homework", selecionar quiz/beginner, marcar o checkbox "Marcar como homework", clicar em Criar.

Expected: redirect para `/teacher/tasks`. A linha da nova task exibe o badge âmbar "HOMEWORK".

- [ ] **Step 4: Editar tarefa existente — desmarcar homework**

Na listagem `/teacher/tasks`, clicar em Editar na task recém-criada. Desmarcar o checkbox. Salvar.

Expected: listagem atualiza, badge homework some da linha dessa task.

- [ ] **Step 5: Logar como student em outra aba**

Logout ou aba anônima. Login: `marcelo@fluent.app` / `senha12345`.

- [ ] **Step 6: Validar badge na listagem e detalhe do aluno**

Navegar para `/tasks`. Localizar a task marcada como homework no seed (Task 9) — deve mostrar badge "HOMEWORK" na linha de metadados.

Clicar no card. Na tela de detalhe, o badge também deve aparecer junto dos outros badges.

Se nenhum dos dois exibir o badge, investigar — não prosseguir para E2E até passar este gate.

- [ ] **Step 7: Sem commit**

Este task não produz mudança de código. Continuar.

---

## Task 11: E2E — teacher marca homework e vê badge

**Files:**
- Create: `e2e/homework.spec.ts`

- [ ] **Step 1: Criar arquivo de teste**

Criar `e2e/homework.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.describe("Homework — teacher", () => {
  test.use({ storageState: "e2e/.auth/teacher.json" });

  test("teacher marca tarefa como homework e vê badge na listagem", async ({
    page,
  }) => {
    await page.goto("/teacher/tasks/new");

    await page.getByLabel("Título").fill("E2E Homework Test");
    // Seleciona checkbox de homework
    await page.getByRole("checkbox", { name: /Marcar como/ }).check();

    // Submit (sem questões, só smoke do form)
    await page.getByRole("button", { name: /Criar Tarefa/ }).click();

    // Aguarda redirect
    await page.waitForURL("**/teacher/tasks");

    // A linha da task recém criada deve conter o badge "Homework"
    const row = page.locator("text=E2E Homework Test").first();
    await expect(row).toBeVisible();

    // O badge "HOMEWORK" aparece na mesma linha
    await expect(
      page.locator("text=E2E Homework Test").locator("..").locator("text=Homework"),
    ).toBeVisible();
  });
});
```

- [ ] **Step 2: Rodar o teste**

Run: `npx playwright test e2e/homework.spec.ts --project=teacher`

Expected: 1 passed.

Se falhar com "questions required" no submit, revisar: o form deve permitir criar task sem questões, ou o teste precisa preencher uma questão mínima. Se for o segundo caso, ajustar o teste adicionando:

```ts
// Adiciona questão mínima para quiz
await page.getByRole("textbox", { name: /Pergunta/ }).first().fill("Sample?");
await page.getByRole("textbox", { name: /Opção A/ }).fill("a");
await page.getByRole("textbox", { name: /Opção B/ }).fill("b");
await page.getByRole("textbox", { name: /Opção C/ }).fill("c");
await page.getByRole("textbox", { name: /Opção D/ }).fill("d");
```

(Os seletores exatos podem variar. Se o teste falhar, usar `await page.pause()` para inspecionar no Playwright Inspector e descobrir os seletores corretos.)

- [ ] **Step 3: Commit**

```bash
git add e2e/homework.spec.ts
git commit -m "test(e2e): teacher marca tarefa como homework"
```

---

## Task 12: E2E — student vê badge em listagem e detalhe

**Files:**
- Modify: `e2e/homework.spec.ts`

- [ ] **Step 1: Adicionar describe block de student**

Abrir `e2e/homework.spec.ts` e adicionar ao final do arquivo:

```ts
test.describe("Homework — student", () => {
  test.use({ storageState: "e2e/.auth/student.json" });

  test("student vê badge Homework na listagem de tarefas", async ({ page }) => {
    await page.goto("/tasks");

    // A task marcada no seed (Task 9) deve exibir o badge
    const badges = page.locator("text=Homework");
    await expect(badges.first()).toBeVisible();
  });

  test("student vê badge Homework na tela de detalhe", async ({ page }) => {
    await page.goto("/tasks");

    // Clicar no primeiro card que tem badge Homework
    // Estratégia: pegar o Link pai do badge
    const homeworkCard = page
      .locator("text=Homework")
      .first()
      .locator("xpath=ancestor::a[1]");
    await homeworkCard.click();

    // Na tela de detalhe, o badge aparece novamente
    await expect(page.locator("text=Homework").first()).toBeVisible();
  });
});
```

- [ ] **Step 2: Rodar os dois testes student**

Run: `npx playwright test e2e/homework.spec.ts --project=student`

Expected: 2 passed.

Se falhar no detalhe com "not found" ou "no ancestor link", o layout pode não envolver o card inteiro num `<a>`. Nesse caso, trocar o seletor por:

```ts
const homeworkCardTitle = page
  .locator("text=Homework")
  .first()
  .locator("xpath=ancestor::*[contains(@class,'Card') or .//a][1]")
  .locator("a")
  .first();
await homeworkCardTitle.click();
```

- [ ] **Step 3: Commit**

```bash
git add e2e/homework.spec.ts
git commit -m "test(e2e): student vê badge Homework em listagem e detalhe"
```

---

## Task 13: Rodar suite E2E completa (regressão)

Gate de regressão — garantir que o novo campo não quebrou outros testes.

- [ ] **Step 1: Parar dev server + reset DB**

Se o dev server estiver rodando, encerrar.

Run: `npm run db:reset && npm run dev -- --port 3001 &`

(Reset é necessário porque os testes Playwright rodam contra o dev server com DB recém-seedada.)

- [ ] **Step 2: Rodar suite inteira**

Run: `npx playwright test`

Expected: todos testes passam. Se algum teste existente falhar (por exemplo, um teste que verificava o form de task e agora encontra o novo checkbox), diagnosticar:
- Se a falha é uma query que espera shape antigo: o teste precisa ser ajustado para tolerar o novo campo.
- Se a falha é visual (badge extra muda posição): ajustar seletor.

Não prosseguir até suite toda verde.

- [ ] **Step 3: Sem commit**

Nenhuma mudança de código — só validação. Seguir.

---

## Task 14: Cleanup — remover protótipo

**Files:**
- Delete: `src/app/prototypes/` (todo o diretório)
- Modify: `src/middleware.ts`
- Delete: `homework-*.png` na raiz do worktree
- Delete: `.superpowers/` (a pasta inteira)

- [ ] **Step 1: Remover rota do protótipo**

Run: `rm -rf src/app/prototypes/`

- [ ] **Step 2: Remover `/prototypes` do middleware**

Em `src/middleware.ts`, localizar a linha:

```ts
const publicPaths = ["/sign-in", "/sign-up", "/invite", "/api/auth", "/prototypes"];
```

E trocar para:

```ts
const publicPaths = ["/sign-in", "/sign-up", "/invite", "/api/auth"];
```

- [ ] **Step 3: Remover artefatos de brainstorm**

Run:

```bash
rm -f homework-prototype-full.png homework-prototype-v2.png homework-final-4contexts.png
rm -rf .superpowers .playwright-mcp
```

(`.superpowers/` e `.playwright-mcp/` já estão no gitignore, mas a pasta física pode ter sobrado.)

- [ ] **Step 4: Type check final**

Run: `npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A src/app/prototypes src/middleware.ts
git commit -m "chore: remove artefatos de prototipação do selo homework"
```

---

## Task 15: Atualizar CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Adicionar import do `HomeworkBadge` à seção de UI Components**

Em `CLAUDE.md`, localizar a seção "Design System" → bloco de imports de componentes UI (onde aparece `import { Badge } from "@/components/ui/badge";`).

Adicionar após a linha do Badge:

```
import { HomeworkBadge } from "@/components/ui/homework-badge"; // selo fixo para tarefas marcadas como "homework" — cor challenges + ícone BookOpenCheck + termo "Homework" em inglês
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): registra componente HomeworkBadge no design system"
```

---

## Final check

- [ ] **Step 1: Status limpo**

Run: `git status`

Expected: "nothing to commit, working tree clean".

- [ ] **Step 2: Log dos commits da feature**

Run: `git log --oneline main..HEAD`

Expected: sequência ordenada de commits atômicos (15 tasks ≈ 12-13 commits, já que tasks 10 e 13 não geram commits).

Revisar visualmente se algum commit está fora do padrão Conventional Commits.

- [ ] **Step 3: Abrir PR**

Usar git-flow ou comando direto:

```bash
gh pr create --title "feat: selo de homework em tarefas" --body "$(cat <<'EOF'
## Summary
- Adiciona coluna `isHomework` em `tasks` (boolean default false)
- Novo componente `HomeworkBadge` (cor `challenges` + ícone + texto "Homework")
- Checkbox "Marcar como homework" no editor da professora
- Renderização condicional do selo em 4 contextos (listagem e detalhe do aluno; listagem e editor da professora)

Spec: `docs/superpowers/specs/2026-04-23-homework-marker-design.md`
Plano: `docs/superpowers/plans/2026-04-23-homework-marker.md`

## Test plan
- [x] Migration aplicada localmente sem erro
- [x] Smoke manual — teacher marca/desmarca e vê badge
- [x] Smoke manual — student vê badge em listagem e detalhe
- [x] E2E teacher (1 spec) passa
- [x] E2E student (2 specs) passa
- [x] Suite E2E completa sem regressão
EOF
)"
```

---

## Self-Review (executed during plan writing)

**Spec coverage:**
- ✅ Schema `tasks.isHomework` → Task 1
- ✅ Componente `HomeworkBadge` → Task 4
- ✅ Variant/componente decision (componente dedicado) → Task 4
- ✅ Checkbox no editor da professora → Task 5
- ✅ Badge na listagem da professora → Task 6
- ✅ Badge no TaskCard do aluno → Task 7
- ✅ Badge no detalhe do aluno → Task 8
- ✅ Validation Zod → Task 2
- ✅ Server action persistindo → Task 3
- ✅ E2E teacher + student → Tasks 11-12
- ✅ Cleanup protótipo + middleware → Task 14
- ✅ CLAUDE.md update → Task 15
- ⚠️ **Filtro "Só homework"** marcado como opcional/nice-to-have no spec — omitido deste plano propositalmente. Se for pedido depois, adicionar em plano separado.

**Placeholder scan:**
- Nenhum "TBD" ou "implement later".
- Task 8 tem uma parte contextual ("inspecionar estrutura") mas com instrução clara de seguimento.
- Task 5 Step 5 e Task 8 Step 4 são contingenciais ("se necessário") — documentados com critério objetivo (erro do tsc).

**Type consistency:**
- `isHomework` usado consistentemente (camelCase em TS, `is_homework` em SQL — seguindo a convenção do schema existente com `publishedAt`/`published_at`).
- Componente sempre referenciado como `HomeworkBadge` (sem variantes).
- Path `@/components/ui/homework-badge` consistente em todos os imports.
