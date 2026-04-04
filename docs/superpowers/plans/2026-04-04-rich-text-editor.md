# Rich Text Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace separate media fields and plain textarea with a unified Tiptap rich text editor for lessons and blog posts.

**Architecture:** Tiptap editor with custom extensions (audio, video, document, embed) shared between lesson and post forms. Content stored as Tiptap JSON in the existing text columns. A `<RichContent>` client component renders the JSON on student-facing pages. Cover image remains a separate FileUpload.

**Tech Stack:** Tiptap (core + extensions), React 19, Cloudflare R2 (existing upload API), Drizzle ORM, Tailwind CSS v4.

**Spec:** `docs/superpowers/specs/2026-04-04-rich-text-editor-design.md`

**Deferred:** BubbleMenu (floating toolbar on text selection) — the fixed toolbar already covers all formatting. BubbleMenu can be added as a polish pass later with `@tiptap/extension-bubble-menu`.

---

### Task 1: Install Tiptap Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Tiptap packages**

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-underline @tiptap/pm
```

- [ ] **Step 2: Verify installation**

Run: `npx tsc --noEmit`
Expected: No new type errors (Tiptap ships its own types).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build(deps): add Tiptap rich text editor packages"
```

---

### Task 2: Update Database Schema

**Files:**
- Modify: `src/lib/db/schema.ts:157-190` (lessons table)
- Modify: `src/lib/db/schema.ts:297-327` (posts table)

- [ ] **Step 1: Update lessons table**

In `src/lib/db/schema.ts`, replace the lessons table definition (lines 157-190) — rename `description` to `content`, remove `videoUrl`, `audioUrls`, `documentUrls`:

```typescript
export const lessons = sqliteTable(
  "lessons",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id),
    title: text("title").notNull(),
    content: text("content"), // Tiptap JSON
    category: text("category", {
      enum: ["conversation", "grammar", "vocabulary", "listening", "culture"],
    }).notNull(),
    coverImageUrl: text("cover_image_url"),
    durationMinutes: integer("duration_minutes"),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    position: integer("position").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("lessons_teacher_id_status_idx").on(table.teacherId, table.status),
  ],
);
```

- [ ] **Step 2: Add coverImageUrl to posts table**

In the posts table (lines 297-327), add `coverImageUrl` after `content`:

```typescript
export const posts = sqliteTable(
  "posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    content: text("content"), // Tiptap JSON (was Markdown)
    coverImageUrl: text("cover_image_url"),
    category: text("category", {
      enum: ["tips", "grammar", "culture", "vocabulary"],
    }).notNull(),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("posts_teacher_id_status_idx").on(table.teacherId, table.status),
  ],
);
```

- [ ] **Step 3: Generate migration**

Run: `npm run db:generate`
Expected: New migration file in `drizzle/` directory.

- [ ] **Step 4: Reset local DB**

Run: `npm run db:reset`
Expected: DB reset with new schema. (Seed will fail — that's expected, we fix it in a later task.)

- [ ] **Step 5: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Type errors in files that reference removed columns (`description`, `videoUrl`, `audioUrls`, `documentUrls`). This is expected — we fix them in subsequent tasks.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "feat(db): update schema for rich text editor — rename description to content, remove media fields, add posts.coverImageUrl"
```

---

### Task 3: Update Validation Schemas

**Files:**
- Modify: `src/lib/validations/lessons.ts`
- Modify: `src/lib/validations/posts.ts`

- [ ] **Step 1: Rewrite lessons validation**

Replace the full contents of `src/lib/validations/lessons.ts`:

```typescript
import { z } from "zod";

export const createLessonSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  content: z.string().optional(),
  category: z.enum([
    "conversation",
    "grammar",
    "vocabulary",
    "listening",
    "culture",
  ]),
  coverImageUrl: z.string().optional(),
  durationMinutes: z.coerce.number().min(0).optional(),
  position: z.coerce.number().min(0).optional(),
});

export const updateLessonSchema = createLessonSchema.partial();

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
```

- [ ] **Step 2: Update posts validation**

Replace the full contents of `src/lib/validations/posts.ts`:

```typescript
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
});

export const updatePostSchema = createPostSchema.partial();

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/validations/lessons.ts src/lib/validations/posts.ts
git commit -m "feat(validation): update schemas for rich text editor — remove media fields, add posts.coverImageUrl"
```

---

### Task 4: Update Server Actions

**Files:**
- Modify: `src/lib/actions/lessons.ts`
- Modify: `src/lib/actions/posts.ts`

- [ ] **Step 1: Rewrite lessons actions**

Replace the full contents of `src/lib/actions/lessons.ts`:

```typescript
"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getDb } from "@/lib/db";
import { lessons } from "@/lib/db/schema";
import { createLessonSchema, updateLessonSchema } from "@/lib/validations/lessons";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the first URL from a FileUpload JSON array, or return the raw
 * string if it's already a plain URL.
 */
function extractSingleUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0].url ?? null;
    }
    return null;
  } catch {
    return value || null;
  }
}

// ── Actions ──────────────────────────────────────────────────────────────────

export async function createLesson(formData: FormData) {
  const { teacher } = await getTeacher();

  const coverImageUrl = extractSingleUrl(
    formData.get("coverImageFile") as string | null
  );

  const raw = {
    title: formData.get("title"),
    content: formData.get("content") || undefined,
    category: formData.get("category"),
    coverImageUrl: coverImageUrl ?? undefined,
    durationMinutes: formData.get("durationMinutes") || undefined,
  };

  const parsed = createLessonSchema.parse(raw);

  const db = getDb();
  await db.insert(lessons).values({
    teacherId: teacher.id,
    title: parsed.title,
    content: parsed.content || null,
    category: parsed.category,
    coverImageUrl: parsed.coverImageUrl || null,
    durationMinutes: parsed.durationMinutes || null,
    status: "draft",
  });

  revalidatePath("/teacher/lessons");
  redirect("/teacher/lessons");
}

export async function updateLesson(id: string, formData: FormData) {
  const { teacher } = await getTeacher();

  const coverImageUrl = extractSingleUrl(
    formData.get("coverImageFile") as string | null
  );

  const raw = {
    title: formData.get("title"),
    content: formData.get("content") || undefined,
    category: formData.get("category"),
    coverImageUrl: coverImageUrl ?? undefined,
    durationMinutes: formData.get("durationMinutes") || undefined,
  };

  const parsed = updateLessonSchema.parse(raw);

  const db = getDb();
  await db
    .update(lessons)
    .set({
      ...parsed,
      coverImageUrl: parsed.coverImageUrl || null,
      durationMinutes: parsed.durationMinutes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(lessons.id, id), eq(lessons.teacherId, teacher.id)));

  revalidatePath("/teacher/lessons");
  redirect("/teacher/lessons");
}

export async function deleteLesson(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID da aula e obrigatorio");

  const db = getDb();
  await db
    .delete(lessons)
    .where(and(eq(lessons.id, id), eq(lessons.teacherId, teacher.id)));

  revalidatePath("/teacher/lessons");
}

export async function toggleLessonStatus(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID da aula e obrigatorio");

  const db = getDb();
  await db
    .update(lessons)
    .set({
      status: sql`CASE WHEN ${lessons.status} = 'draft' THEN 'published' ELSE 'draft' END`,
      updatedAt: new Date(),
    })
    .where(and(eq(lessons.id, id), eq(lessons.teacherId, teacher.id)));

  revalidatePath("/teacher/lessons");
}
```

- [ ] **Step 2: Update posts actions**

Replace the full contents of `src/lib/actions/posts.ts`. Changes: add `coverImageUrl` handling with `extractSingleUrl`, same pattern as lessons:

```typescript
"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getDb } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { createPostSchema, updatePostSchema } from "@/lib/validations/posts";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractSingleUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0].url ?? null;
    }
    return null;
  } catch {
    return value || null;
  }
}

export async function createPost(formData: FormData) {
  const { teacher } = await getTeacher();

  const title = formData.get("title") as string;
  const slugRaw = formData.get("slug") as string;
  const coverImageUrl = extractSingleUrl(
    formData.get("coverImageFile") as string | null
  );

  const raw = {
    title,
    slug: slugRaw || generateSlug(title || ""),
    content: formData.get("content") || undefined,
    coverImageUrl: coverImageUrl ?? undefined,
    category: formData.get("category"),
    featured: formData.get("featured") === "on",
  };

  const parsed = createPostSchema.parse(raw);

  const db = getDb();
  await db.insert(posts).values({
    teacherId: teacher.id,
    title: parsed.title,
    slug: parsed.slug,
    content: parsed.content || null,
    coverImageUrl: parsed.coverImageUrl || null,
    category: parsed.category,
    featured: parsed.featured ?? false,
    status: "draft",
  });

  revalidatePath("/teacher/posts");
  redirect("/teacher/posts");
}

export async function updatePost(id: string, formData: FormData) {
  const { teacher } = await getTeacher();

  const title = formData.get("title") as string;
  const slugRaw = formData.get("slug") as string;
  const coverImageUrl = extractSingleUrl(
    formData.get("coverImageFile") as string | null
  );

  const raw = {
    title,
    slug: slugRaw || generateSlug(title || ""),
    content: formData.get("content") || undefined,
    coverImageUrl: coverImageUrl ?? undefined,
    category: formData.get("category"),
    featured: formData.get("featured") === "on",
  };

  const parsed = updatePostSchema.parse(raw);

  const db = getDb();
  await db
    .update(posts)
    .set({
      ...parsed,
      content: parsed.content || null,
      coverImageUrl: parsed.coverImageUrl || null,
      featured: parsed.featured ?? false,
      updatedAt: new Date(),
    })
    .where(and(eq(posts.id, id), eq(posts.teacherId, teacher.id)));

  revalidatePath("/teacher/posts");
  redirect("/teacher/posts");
}

export async function deletePost(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID do post é obrigatório");

  const db = getDb();
  await db
    .delete(posts)
    .where(and(eq(posts.id, id), eq(posts.teacherId, teacher.id)));

  revalidatePath("/teacher/posts");
}

export async function togglePostStatus(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID do post é obrigatório");

  const db = getDb();
  await db
    .update(posts)
    .set({
      status: sql`CASE WHEN ${posts.status} = 'draft' THEN 'published' ELSE 'draft' END`,
      updatedAt: new Date(),
    })
    .where(and(eq(posts.id, id), eq(posts.teacherId, teacher.id)));

  revalidatePath("/teacher/posts");
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/lessons.ts src/lib/actions/posts.ts
git commit -m "feat(actions): simplify lesson/post actions for rich text editor — remove media field handling, add posts.coverImageUrl"
```

---

### Task 5: Build Tiptap Custom Extensions

**Files:**
- Create: `src/components/ui/rich-editor/extensions/audio.tsx`
- Create: `src/components/ui/rich-editor/extensions/video.tsx`
- Create: `src/components/ui/rich-editor/extensions/document.tsx`
- Create: `src/components/ui/rich-editor/extensions/embed.tsx`

- [ ] **Step 1: Create audio extension**

Create `src/components/ui/rich-editor/extensions/audio.tsx`:

```tsx
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";

function AudioNodeView({ node }: { node: { attrs: { src: string; name: string } } }) {
  return (
    <NodeViewWrapper className="my-4">
      <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[#f8f9fb] border border-border">
        <audio controls className="flex-1 h-10" preload="metadata">
          <source src={node.attrs.src} />
        </audio>
        {node.attrs.name && (
          <span className="text-xs text-text-muted truncate max-w-40">
            {node.attrs.name}
          </span>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const AudioBlock = Node.create({
  name: "audio",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      name: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="audio"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "audio" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioNodeView);
  },
});
```

- [ ] **Step 2: Create video extension**

Create `src/components/ui/rich-editor/extensions/video.tsx`:

```tsx
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match?.[1] ?? null;
}

function VideoNodeView({
  node,
}: {
  node: { attrs: { src: string; provider: string } };
}) {
  const { src, provider } = node.attrs;

  let embedSrc: string | null = null;
  if (provider === "youtube") {
    const id = extractYouTubeId(src);
    if (id) embedSrc = `https://www.youtube.com/embed/${id}`;
  } else if (provider === "vimeo") {
    const id = extractVimeoId(src);
    if (id) embedSrc = `https://player.vimeo.com/video/${id}`;
  }

  return (
    <NodeViewWrapper className="my-4">
      <div className="relative w-full aspect-video rounded-[var(--radius-md)] overflow-hidden bg-black">
        {embedSrc ? (
          <iframe
            src={embedSrc}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <video src={src} controls className="w-full h-full" />
        )}
      </div>
    </NodeViewWrapper>
  );
}

function detectProvider(url: string): string {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/vimeo\.com/.test(url)) return "vimeo";
  return "upload";
}

export const VideoBlock = Node.create({
  name: "video",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      provider: { default: "upload" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="video"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "video" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },
});

export { detectProvider };
```

- [ ] **Step 3: Create document extension**

Create `src/components/ui/rich-editor/extensions/document.tsx`:

```tsx
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { FileText, Download } from "lucide-react";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentNodeView({
  node,
}: {
  node: { attrs: { src: string; name: string; size: number } };
}) {
  return (
    <NodeViewWrapper className="my-4">
      <a
        href={node.attrs.src}
        download={node.attrs.name}
        className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[#f8f9fb] border border-border hover:border-aulas transition-colors"
      >
        <FileText size={20} className="text-text-muted shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {node.attrs.name}
          </p>
          {node.attrs.size > 0 && (
            <p className="text-xs text-text-muted">
              {formatFileSize(node.attrs.size)}
            </p>
          )}
        </div>
        <Download size={16} className="text-text-muted shrink-0" />
      </a>
    </NodeViewWrapper>
  );
}

export const DocumentBlock = Node.create({
  name: "document",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      name: { default: "" },
      size: { default: 0 },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="document"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "document" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentNodeView);
  },
});
```

- [ ] **Step 4: Create embed extension**

Create `src/components/ui/rich-editor/extensions/embed.tsx`:

```tsx
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";

function EmbedNodeView({ node }: { node: { attrs: { src: string } } }) {
  return (
    <NodeViewWrapper className="my-4">
      <div className="relative w-full aspect-video rounded-[var(--radius-md)] overflow-hidden border border-border">
        <iframe
          src={node.attrs.src}
          sandbox="allow-scripts allow-same-origin allow-popups"
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </NodeViewWrapper>
  );
}

export const EmbedBlock = Node.create({
  name: "embed",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "embed" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedNodeView);
  },
});
```

- [ ] **Step 5: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Extensions compile cleanly (other files may still have errors from schema changes).

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/rich-editor/extensions/
git commit -m "feat(editor): add custom Tiptap extensions — audio, video, document, embed blocks"
```

---

### Task 6: Build RichEditor Component

**Files:**
- Create: `src/components/ui/rich-editor/editor.tsx`
- Create: `src/components/ui/rich-editor/toolbar.tsx`
- Create: `src/components/ui/rich-editor/slash-menu.tsx`

- [ ] **Step 1: Create toolbar component**

Create `src/components/ui/rich-editor/toolbar.tsx`:

```tsx
"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  editor: Editor;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}

function ToolbarButton({ onClick, active, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        active
          ? "bg-aulas/10 text-aulas"
          : "text-text-muted hover:text-text-primary hover:bg-bg-light"
      )}
    >
      {children}
    </button>
  );
}

export function Toolbar({ editor }: ToolbarProps) {
  function addLink() {
    const url = window.prompt("URL do link:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }

  return (
    <div className="flex items-center gap-0.5 p-1.5 border-b border-border flex-wrap">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Negrito"
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Itálico"
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Sublinhado"
      >
        <Underline size={16} />
      </ToolbarButton>

      <div className="w-px h-5 bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Título"
      >
        <Heading2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Subtítulo"
      >
        <Heading3 size={16} />
      </ToolbarButton>

      <div className="w-px h-5 bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Lista"
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Lista numerada"
      >
        <ListOrdered size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Citação"
      >
        <Quote size={16} />
      </ToolbarButton>

      <div className="w-px h-5 bg-border mx-1" />

      <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Link">
        <Link size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Separador"
      >
        <Minus size={16} />
      </ToolbarButton>
    </div>
  );
}
```

- [ ] **Step 2: Create slash menu component**

Create `src/components/ui/rich-editor/slash-menu.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { Image, Film, Headphones, FileText, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { detectProvider } from "./extensions/video";

interface SlashMenuProps {
  editor: Editor;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

async function uploadFile(file: File, folder: string): Promise<{ url: string; name: string; size: number }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

function openFilePicker(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

export function SlashMenu({ editor }: SlashMenuProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const insertImage = useCallback(async () => {
    setOpen(false);
    const file = await openFilePicker("image/jpeg,image/png,image/webp");
    if (!file) return;
    const result = await uploadFile(file, "content/images");
    editor.chain().focus().setImage({ src: result.url, alt: file.name }).run();
  }, [editor]);

  const insertVideo = useCallback(async () => {
    setOpen(false);
    const url = window.prompt("URL do vídeo (YouTube, Vimeo ou link direto):");
    if (!url) return;
    const provider = detectProvider(url);
    editor
      .chain()
      .focus()
      .insertContent({ type: "video", attrs: { src: url, provider } })
      .run();
  }, [editor]);

  const insertAudio = useCallback(async () => {
    setOpen(false);
    const file = await openFilePicker("audio/mpeg,audio/wav,audio/ogg,audio/mp4");
    if (!file) return;
    const result = await uploadFile(file, "content/audio");
    editor
      .chain()
      .focus()
      .insertContent({ type: "audio", attrs: { src: result.url, name: file.name } })
      .run();
  }, [editor]);

  const insertDocument = useCallback(async () => {
    setOpen(false);
    const file = await openFilePicker("application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx");
    if (!file) return;
    const result = await uploadFile(file, "content/documents");
    editor
      .chain()
      .focus()
      .insertContent({
        type: "document",
        attrs: { src: result.url, name: file.name, size: file.size },
      })
      .run();
  }, [editor]);

  const insertEmbed = useCallback(async () => {
    setOpen(false);
    const url = window.prompt("URL do embed:");
    if (!url) return;
    editor
      .chain()
      .focus()
      .insertContent({ type: "embed", attrs: { src: url } })
      .run();
  }, [editor]);

  const items: MenuItem[] = [
    { label: "Imagem", icon: <Image size={16} />, action: insertImage },
    { label: "Vídeo", icon: <Film size={16} />, action: insertVideo },
    { label: "Áudio", icon: <Headphones size={16} />, action: insertAudio },
    { label: "Documento", icon: <FileText size={16} />, action: insertDocument },
    { label: "Embed", icon: <Globe size={16} />, action: insertEmbed },
  ];

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!open) {
        if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
          const { state } = editor;
          const { $from } = state.selection;
          const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
          // Only trigger on empty line or start of paragraph
          if (textBefore === "") {
            e.preventDefault();
            setOpen(true);
            setSearch("");
            setSelectedIndex(0);
          }
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        filtered[selectedIndex]?.action();
      } else if (e.key === "Backspace" && search === "") {
        setOpen(false);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setSearch((s) => s + e.key);
        setSelectedIndex(0);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, search, selectedIndex, filtered, editor]);

  // Close when editor loses focus
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-56 bg-bg-card border border-border rounded-[var(--radius-md)] shadow-lg py-1 animate-fade-in"
    >
      {search && (
        <div className="px-3 py-1 text-xs text-text-muted border-b border-border mb-1">
          /{search}
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="px-3 py-2 text-sm text-text-muted">
          Nenhum resultado
        </div>
      ) : (
        filtered.map((item, i) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className={cn(
              "flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors",
              i === selectedIndex
                ? "bg-aulas/10 text-aulas"
                : "text-text-primary hover:bg-bg-light"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create main RichEditor component**

Create `src/components/ui/rich-editor/editor.tsx`:

```tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import UnderlineExtension from "@tiptap/extension-underline";
import { Toolbar } from "./toolbar";
import { SlashMenu } from "./slash-menu";
import { AudioBlock } from "./extensions/audio";
import { VideoBlock } from "./extensions/video";
import { DocumentBlock } from "./extensions/document";
import { EmbedBlock } from "./extensions/embed";

interface RichEditorProps {
  content?: string;
  onChange: (json: string) => void;
  placeholder?: string;
}

export function RichEditor({
  content,
  onChange,
  placeholder = "Comece a escrever o conteúdo ou digite / para inserir mídia...",
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image,
      LinkExtension.configure({
        openOnClick: false,
      }),
      Placeholder.configure({ placeholder }),
      UnderlineExtension,
      AudioBlock,
      VideoBlock,
      DocumentBlock,
      EmbedBlock,
    ],
    content: content ? JSON.parse(content) : undefined,
    onUpdate({ editor }) {
      onChange(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none text-text-primary prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-a:text-aulas [&_.is-editor-empty:first-child::before]:text-text-muted [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:pointer-events-none",
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        event.preventDefault();
        const file = files[0];

        // Handle image drops
        if (file.type.startsWith("image/")) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "content/images");
          fetch("/api/upload", { method: "POST", body: formData })
            .then((res) => res.json())
            .then(({ url }) => {
              editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
            });
          return true;
        }

        // Handle audio drops
        if (file.type.startsWith("audio/")) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "content/audio");
          fetch("/api/upload", { method: "POST", body: formData })
            .then((res) => res.json())
            .then(({ url }) => {
              editor
                ?.chain()
                .focus()
                .insertContent({ type: "audio", attrs: { src: url, name: file.name } })
                .run();
            });
          return true;
        }

        // Handle document drops
        if (
          file.type === "application/pdf" ||
          file.name.match(/\.(doc|docx|ppt|pptx|xls|xlsx)$/i)
        ) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "content/documents");
          fetch("/api/upload", { method: "POST", body: formData })
            .then((res) => res.json())
            .then(({ url }) => {
              editor
                ?.chain()
                .focus()
                .insertContent({
                  type: "document",
                  attrs: { src: url, name: file.name, size: file.size },
                })
                .run();
            });
          return true;
        }

        return false;
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="relative border border-border rounded-[var(--radius-md)] bg-bg-card overflow-hidden focus-within:border-aulas transition-colors">
      <Toolbar editor={editor} />
      <div className="relative">
        <EditorContent editor={editor} />
        <SlashMenu editor={editor} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Editor components compile cleanly.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/rich-editor/
git commit -m "feat(editor): build RichEditor component with toolbar, slash menu, and drag-and-drop"
```

---

### Task 7: Build RichContent Renderer

**Files:**
- Create: `src/components/ui/rich-content.tsx`

- [ ] **Step 1: Create the renderer component**

Create `src/components/ui/rich-content.tsx`:

```tsx
"use client";

import { FileText, Download } from "lucide-react";

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}

interface RichContentProps {
  content: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match?.[1] ?? null;
}

function renderText(node: TiptapNode, key: number): React.ReactNode {
  if (!node.text) return null;

  let el: React.ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case "bold":
        el = <strong key={key}>{el}</strong>;
        break;
      case "italic":
        el = <em key={key}>{el}</em>;
        break;
      case "underline":
        el = <u key={key}>{el}</u>;
        break;
      case "link":
        el = (
          <a
            key={key}
            href={mark.attrs?.href as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-aulas underline underline-offset-2 hover:brightness-110"
          >
            {el}
          </a>
        );
        break;
    }
  }
  return el;
}

function renderChildren(nodes?: TiptapNode[]): React.ReactNode[] {
  if (!nodes) return [];
  return nodes.map((node, i) => renderNode(node, i));
}

function renderNode(node: TiptapNode, key: number): React.ReactNode {
  switch (node.type) {
    case "text":
      return renderText(node, key);

    case "paragraph":
      return (
        <p key={key} className="mb-3 text-text-secondary leading-relaxed">
          {renderChildren(node.content)}
        </p>
      );

    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      const Tag = level === 2 ? "h2" : "h3";
      const classes =
        level === 2
          ? "text-lg font-semibold text-text-primary mt-6 mb-2"
          : "text-base font-semibold text-text-primary mt-4 mb-2";
      return (
        <Tag key={key} className={classes}>
          {renderChildren(node.content)}
        </Tag>
      );
    }

    case "bulletList":
      return (
        <ul key={key} className="list-disc pl-6 space-y-1 mb-3">
          {renderChildren(node.content)}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={key} className="list-decimal pl-6 space-y-1 mb-3">
          {renderChildren(node.content)}
        </ol>
      );

    case "listItem":
      return (
        <li key={key} className="text-text-secondary">
          {renderChildren(node.content)}
        </li>
      );

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-l-4 border-fora pl-4 italic text-text-muted mb-3"
        >
          {renderChildren(node.content)}
        </blockquote>
      );

    case "horizontalRule":
      return <hr key={key} className="my-6 border-border" />;

    case "image":
      return (
        <figure key={key} className="my-4">
          <img
            src={node.attrs?.src as string}
            alt={(node.attrs?.alt as string) ?? ""}
            className="rounded-[var(--radius-md)] max-w-full"
            loading="lazy"
          />
        </figure>
      );

    case "video": {
      const src = node.attrs?.src as string;
      const provider = node.attrs?.provider as string;
      let embedSrc: string | null = null;

      if (provider === "youtube") {
        const id = extractYouTubeId(src);
        if (id) embedSrc = `https://www.youtube.com/embed/${id}`;
      } else if (provider === "vimeo") {
        const id = extractVimeoId(src);
        if (id) embedSrc = `https://player.vimeo.com/video/${id}`;
      }

      return (
        <div
          key={key}
          className="relative w-full aspect-video rounded-[var(--radius-md)] overflow-hidden bg-black my-4"
        >
          {embedSrc ? (
            <iframe
              src={embedSrc}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <video src={src} controls className="w-full h-full" />
          )}
        </div>
      );
    }

    case "audio":
      return (
        <div
          key={key}
          className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[#f8f9fb] border border-border my-4"
        >
          <audio controls className="flex-1 h-10" preload="metadata">
            <source src={node.attrs?.src as string} />
          </audio>
          {node.attrs?.name && (
            <span className="text-xs text-text-muted truncate max-w-40">
              {node.attrs.name as string}
            </span>
          )}
        </div>
      );

    case "document":
      return (
        <a
          key={key}
          href={node.attrs?.src as string}
          download={node.attrs?.name as string}
          className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[#f8f9fb] border border-border hover:border-aulas transition-colors my-4"
        >
          <FileText size={20} className="text-text-muted shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {node.attrs?.name as string}
            </p>
            {(node.attrs?.size as number) > 0 && (
              <p className="text-xs text-text-muted">
                {formatFileSize(node.attrs?.size as number)}
              </p>
            )}
          </div>
          <Download size={16} className="text-text-muted shrink-0" />
        </a>
      );

    case "embed":
      return (
        <div
          key={key}
          className="relative w-full aspect-video rounded-[var(--radius-md)] overflow-hidden border border-border my-4"
        >
          <iframe
            src={node.attrs?.src as string}
            sandbox="allow-scripts allow-same-origin allow-popups"
            className="absolute inset-0 w-full h-full"
          />
        </div>
      );

    case "doc":
      return <>{renderChildren(node.content)}</>;

    default:
      return null;
  }
}

export function RichContent({ content }: RichContentProps) {
  let doc: TiptapNode;
  try {
    doc = JSON.parse(content);
  } catch {
    return <p className="text-text-secondary">{content}</p>;
  }

  return <div className="rich-content">{renderNode(doc, 0)}</div>;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Component compiles cleanly.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/rich-content.tsx
git commit -m "feat(renderer): add RichContent component for rendering Tiptap JSON"
```

---

### Task 8: Rewrite Lesson Form

**Files:**
- Modify: `src/components/teacher/lesson-form.tsx` (full rewrite)

- [ ] **Step 1: Rewrite lesson form**

Replace the full contents of `src/components/teacher/lesson-form.tsx`:

```tsx
"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload, type FileItem } from "@/components/ui/file-upload";
import { RichEditor } from "@/components/ui/rich-editor/editor";

// ── Types ────────────────────────────────────────────────────────────────────

interface LessonData {
  id: string;
  title: string;
  content: string | null;
  category: "conversation" | "grammar" | "vocabulary" | "listening" | "culture";
  coverImageUrl: string | null;
  durationMinutes: number | null;
}

interface LessonFormProps {
  lesson?: LessonData;
  action: (formData: FormData) => Promise<void>;
}

// ── Constants ────────────────────────────────────────────────────────────────

const categoryOptions = [
  { value: "conversation", label: "Conversação" },
  { value: "grammar", label: "Gramática" },
  { value: "vocabulary", label: "Vocabulário" },
  { value: "listening", label: "Listening" },
  { value: "culture", label: "Cultura" },
];

const MB = 1024 * 1024;

// ── Helpers ──────────────────────────────────────────────────────────────────

function coverUrlToFileItems(url: string | null | undefined): FileItem[] {
  if (!url) return [];
  return [{ url, name: url.split("/").pop() ?? "cover", size: 0 }];
}

// ── Component ────────────────────────────────────────────────────────────────

export function LessonForm({ lesson, action }: LessonFormProps) {
  const isEdit = !!lesson;
  const [content, setContent] = useState(lesson?.content ?? "");

  const existingCover = useMemo(
    () => coverUrlToFileItems(lesson?.coverImageUrl),
    [lesson?.coverImageUrl]
  );

  return (
    <form action={action} className="space-y-6">
      {/* Hidden field for rich editor content */}
      <input type="hidden" name="content" value={content} />

      {/* ── Section 1: Basic info ─────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <Input
            label="Título"
            name="title"
            placeholder="Ex: Introdução a conversação"
            defaultValue={lesson?.title ?? ""}
            required
          />

          <Select
            label="Categoria"
            name="category"
            options={categoryOptions}
            defaultValue={lesson?.category ?? "conversation"}
          />
        </CardContent>
      </Card>

      {/* ── Section 2: Cover image ────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Imagem de Capa
          </h3>
          <FileUpload
            name="coverImageFile"
            accept="image/jpeg,image/png,image/webp"
            maxSize={5 * MB}
            maxFiles={1}
            folder="lessons/covers"
            label="Imagem de Capa"
            description="JPG, PNG, WebP. Máximo 5MB"
            existingFiles={existingCover}
          />
        </CardContent>
      </Card>

      {/* ── Section 3: Duration ───────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <Input
            label="Duração (minutos)"
            name="durationMinutes"
            type="number"
            min={0}
            placeholder="Ex: 30"
            defaultValue={lesson?.durationMinutes?.toString() ?? ""}
          />
        </CardContent>
      </Card>

      {/* ── Section 4: Content (Rich Editor) ──────────────────────────── */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Conteúdo
          </h3>
          <RichEditor
            content={lesson?.content || undefined}
            onChange={setContent}
          />
        </CardContent>
      </Card>

      {/* ── Submit ────────────────────────────────────────────────────── */}
      <div className="flex justify-end pt-4">
        <Button type="submit">
          {isEdit ? "Salvar Alterações" : "Criar Aula"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors in lesson-form.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/components/teacher/lesson-form.tsx
git commit -m "feat(lesson-form): replace separate media fields with RichEditor"
```

---

### Task 9: Rewrite Post Form

**Files:**
- Modify: `src/components/teacher/post-form.tsx` (full rewrite)

- [ ] **Step 1: Rewrite post form**

Replace the full contents of `src/components/teacher/post-form.tsx`:

```tsx
"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload, type FileItem } from "@/components/ui/file-upload";
import { RichEditor } from "@/components/ui/rich-editor/editor";

interface PostData {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  coverImageUrl: string | null;
  category: "tips" | "grammar" | "culture" | "vocabulary";
  featured: boolean;
}

interface PostFormProps {
  post?: PostData;
  action: (formData: FormData) => Promise<void>;
}

const categoryOptions = [
  { value: "tips", label: "Dicas" },
  { value: "grammar", label: "Gramática" },
  { value: "culture", label: "Cultura" },
  { value: "vocabulary", label: "Vocabulário" },
];

const MB = 1024 * 1024;

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function coverUrlToFileItems(url: string | null | undefined): FileItem[] {
  if (!url) return [];
  return [{ url, name: url.split("/").pop() ?? "cover", size: 0 }];
}

export function PostForm({ post, action }: PostFormProps) {
  const isEdit = !!post;
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [content, setContent] = useState(post?.content ?? "");

  const existingCover = useMemo(
    () => coverUrlToFileItems(post?.coverImageUrl),
    [post?.coverImageUrl]
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-5">
          {/* Hidden field for rich editor content */}
          <input type="hidden" name="content" value={content} />

          <Input
            label="Título"
            name="title"
            placeholder="Ex: 10 dicas para melhorar seu inglês"
            defaultValue={post?.title ?? ""}
            required
            onChange={(e) => {
              if (!isEdit && !slug) {
                setSlug(generateSlug(e.target.value));
              }
            }}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-primary">
              Slug
            </label>
            <div className="flex gap-2">
              <input
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ex: 10-dicas-para-melhorar-seu-ingles"
                className="flex-1 px-3 py-2.5 rounded-[var(--radius-sm)] bg-[#f8f9fb] border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-aulas transition-colors"
                required
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const titleInput = document.querySelector(
                    'input[name="title"]',
                  ) as HTMLInputElement;
                  if (titleInput?.value) {
                    setSlug(generateSlug(titleInput.value));
                  }
                }}
              >
                Gerar
              </Button>
            </div>
          </div>

          <Select
            label="Categoria"
            name="category"
            options={categoryOptions}
            defaultValue={post?.category ?? "tips"}
          />

          {/* Cover image — new for posts */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-text-primary">
              Imagem de Capa
            </h3>
            <FileUpload
              name="coverImageFile"
              accept="image/jpeg,image/png,image/webp"
              maxSize={5 * MB}
              maxFiles={1}
              folder="posts/covers"
              label="Imagem de Capa"
              description="JPG, PNG, WebP. Máximo 5MB"
              existingFiles={existingCover}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              name="featured"
              defaultChecked={post?.featured ?? false}
              className="rounded border-border text-aulas focus:ring-aulas"
            />
            <label
              htmlFor="featured"
              className="text-xs font-medium text-text-primary"
            >
              Destacado
            </label>
          </div>

          {/* Rich Editor */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-text-primary">
              Conteúdo
            </h3>
            <RichEditor
              content={post?.content || undefined}
              onChange={setContent}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit">
              {isEdit ? "Salvar Alterações" : "Criar Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors in post-form.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/components/teacher/post-form.tsx
git commit -m "feat(post-form): replace Markdown textarea with RichEditor, add cover image"
```

---

### Task 10: Update Student-Facing Pages

**Files:**
- Modify: `src/components/student/lesson-player.tsx` (full rewrite)
- Modify: `src/app/(student)/blog/[slug]/page.tsx`
- Modify: `src/components/student/post-card.tsx:35-44` (getExcerpt function)

- [ ] **Step 1: Rewrite lesson player**

Replace the full contents of `src/components/student/lesson-player.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RichContent } from "@/components/ui/rich-content";
import { updateLessonProgress } from "@/lib/actions/student-progress";

const categoryLabels: Record<string, string> = {
  conversation: "Conversação",
  grammar: "Gramática",
  vocabulary: "Vocabulário",
  listening: "Listening",
  culture: "Cultura",
};

const categoryBadgeVariant: Record<string, BadgeVariant> = {
  conversation: "aulas",
  grammar: "tarefas",
  vocabulary: "fora",
  listening: "challenges",
  culture: "default",
};

interface LessonPlayerProps {
  lesson: {
    id: string;
    title: string;
    content?: string | null;
    category: string;
    durationMinutes?: number | null;
  };
  initialProgress: number;
}

export function LessonPlayer({ lesson, initialProgress }: LessonPlayerProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [isPending, startTransition] = useTransition();

  function handleMarkWatched() {
    startTransition(async () => {
      await updateLessonProgress(lesson.id, 100);
      setProgress(100);
    });
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Badge variant={categoryBadgeVariant[lesson.category] || "default"}>
          {categoryLabels[lesson.category] || lesson.category}
        </Badge>
        <h1 className="text-xl font-display font-bold text-text-primary">
          {lesson.title}
        </h1>
        {lesson.durationMinutes && (
          <p className="text-sm text-text-muted">{lesson.durationMinutes} min</p>
        )}
      </div>

      {/* Progress action */}
      {progress < 100 ? (
        <Button
          onClick={handleMarkWatched}
          loading={isPending}
          variant="primary"
          size="md"
        >
          <Check size={16} />
          Marcar como assistida
        </Button>
      ) : (
        <div className="flex items-center gap-2 text-success text-sm font-medium">
          <Check size={16} />
          Aula assistida
        </div>
      )}

      {/* Content */}
      {lesson.content && <RichContent content={lesson.content} />}
    </div>
  );
}
```

- [ ] **Step 2: Update blog post page**

Replace the full contents of `src/app/(student)/blog/[slug]/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getStudent } from "@/lib/auth/get-student";
import { getPublishedPost } from "@/lib/queries/student-blog";
import { incrementViewCount } from "@/lib/actions/student-posts";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { RichContent } from "@/components/ui/rich-content";

const categoryLabels: Record<string, string> = {
  tips: "Dicas",
  grammar: "Gramática",
  culture: "Cultura",
  vocabulary: "Vocabulário",
};

const categoryBadgeVariant: Record<string, BadgeVariant> = {
  tips: "tarefas",
  grammar: "aulas",
  culture: "fora",
  vocabulary: "challenges",
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { student } = await getStudent();

  const post = await getPublishedPost(slug, student.teacherId);
  if (!post) redirect("/blog");

  // Fire and forget — don't block rendering
  incrementViewCount(post.id);

  return (
    <div className="animate-fade-in">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Voltar para o blog
      </Link>

      <article className="max-w-2xl">
        {/* Cover image */}
        {post.coverImageUrl && (
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="w-full rounded-[var(--radius-md)] mb-6 object-cover max-h-80"
          />
        )}

        <div className="flex items-center gap-2 mb-3">
          <Badge variant={categoryBadgeVariant[post.category]}>
            {categoryLabels[post.category]}
          </Badge>
          <span className="text-xs text-text-muted">
            {post.createdAt.toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary font-display mb-6">
          {post.title}
        </h1>

        {post.content && <RichContent content={post.content} />}
      </article>
    </div>
  );
}
```

- [ ] **Step 3: Update PostCard excerpt function**

In `src/components/student/post-card.tsx`, update the `getExcerpt` function (lines 35-45) to handle Tiptap JSON by extracting text from the JSON tree:

```typescript
function getExcerpt(content: string | null): string {
  if (!content) return "";
  try {
    const doc = JSON.parse(content);
    const texts: string[] = [];
    function walk(node: { type?: string; text?: string; content?: unknown[] }) {
      if (node.text) texts.push(node.text);
      if (Array.isArray(node.content)) node.content.forEach(walk);
    }
    walk(doc);
    const plain = texts.join(" ").trim();
    return plain.length > 120 ? `${plain.slice(0, 120)}...` : plain;
  } catch {
    // Fallback for plain text
    return content.length > 120 ? `${content.slice(0, 120)}...` : content;
  }
}
```

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/student/lesson-player.tsx src/app/(student)/blog/[slug]/page.tsx src/components/student/post-card.tsx
git commit -m "feat(student): update lesson player and blog to render rich content"
```

---

### Task 11: Update Seed Data

**Files:**
- Modify: `scripts/seed.ts`

- [ ] **Step 1: Update seed with Tiptap JSON content**

In `scripts/seed.ts`, replace the lessons data section (lines 87-98) with:

```typescript
const lessonsData = [
  {
    title: "Introduction to Present Simple",
    category: "grammar",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "When to use Present Simple" }] },
        { type: "paragraph", content: [{ type: "text", text: "We use the Present Simple tense to talk about habits, routines, and general truths." }] },
        { type: "paragraph", content: [{ type: "text", text: "Watch this video to understand the basics:" }] },
        { type: "video", attrs: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", provider: "youtube" } },
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Key rules" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Add -s or -es for third person singular (he/she/it)" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Use do/does for questions and negatives" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Time expressions: always, usually, often, sometimes, never" }] }] },
        ] },
      ],
    }),
    duration: 15,
    status: "published",
    pos: 1,
  },
  {
    title: "Ordering Food at a Restaurant",
    category: "conversation",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Practice common phrases and vocabulary for ordering food, asking for the bill, and making special requests." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Useful phrases" }] },
        { type: "orderedList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Can I see the menu, please?" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "I'd like to order..." }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Could I have the check, please?" }] }] },
        ] },
      ],
    }),
    duration: 20,
    status: "published",
    pos: 2,
  },
  {
    title: "Daily Routine Vocabulary",
    category: "vocabulary",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Essential words and phrases to describe your daily routine." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Morning routine" }] },
        { type: "paragraph", content: [
          { type: "text", marks: [{ type: "bold" }], text: "wake up" },
          { type: "text", text: " — acordar, " },
          { type: "text", marks: [{ type: "bold" }], text: "get dressed" },
          { type: "text", text: " — se vestir, " },
          { type: "text", marks: [{ type: "bold" }], text: "have breakfast" },
          { type: "text", text: " — tomar café da manhã" },
        ] },
      ],
    }),
    duration: 12,
    status: "published",
    pos: 3,
  },
  {
    title: "Listening Practice: The Weather",
    category: "listening",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Listen to weather forecasts and practice understanding temperatures, conditions, and predictions." }] },
      ],
    }),
    duration: 10,
    status: "published",
    pos: 4,
  },
  {
    title: "British vs American English",
    category: "culture",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Explore the differences between British and American English in vocabulary, spelling, and pronunciation." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Vocabulary differences" }] },
        { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "British: flat, lift, biscuit. American: apartment, elevator, cookie." }] }] },
      ],
    }),
    duration: 18,
    status: "draft",
    pos: 5,
  },
];
```

Then update the lessons INSERT (line 95-98) to use the new columns:

```typescript
lessonsData.forEach((l, i) => {
  sql(`INSERT INTO lessons (id, teacher_id, title, content, category, duration_minutes, status, position, created_at, updated_at) VALUES ('${lessonIds[i]}', '${teacherId}', '${l.title}', '${l.content.replace(/'/g, "''")}', '${l.category}', ${l.duration}, '${l.status}', ${l.pos}, ${ts - (5 - i) * 86400}, ${ts})`);
});
```

- [ ] **Step 2: Update posts seed data**

Replace the posts data section (lines 163-171) with Tiptap JSON content:

```typescript
const postsData = [
  {
    title: "5 Dicas para Melhorar seu Listening",
    slug: "5-dicas-listening",
    category: "tips",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "1. Ouça podcasts em inglês" }] },
        { type: "paragraph", content: [
          { type: "text", text: "Comece com podcasts para aprendizes como " },
          { type: "text", marks: [{ type: "bold" }], text: "6 Minute English" },
          { type: "text", text: " da BBC." },
        ] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "2. Assista séries com legendas em inglês" }] },
        { type: "paragraph", content: [{ type: "text", text: "Não use legendas em português! Comece com legendas em inglês." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "3. Repita frases em voz alta" }] },
        { type: "paragraph", content: [{ type: "text", text: "Shadowing é uma técnica poderosa para melhorar pronúncia e compreensão." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "4. Ouça a mesma coisa várias vezes" }] },
        { type: "paragraph", content: [{ type: "text", text: "Repetição é chave. Ouça o mesmo episódio 2-3 vezes." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "5. Anote palavras novas" }] },
        { type: "paragraph", content: [{ type: "text", text: "Mantenha um caderno de vocabulário novo." }] },
      ],
    }),
    featured: true,
    views: 42,
  },
  {
    title: "Verbos Irregulares Mais Comuns",
    slug: "verbos-irregulares-comuns",
    category: "grammar",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Verbos Irregulares Mais Comuns" }] },
        { type: "paragraph", content: [
          { type: "text", marks: [{ type: "bold" }], text: "be" },
          { type: "text", text: " — was/were — been" },
        ] },
        { type: "paragraph", content: [
          { type: "text", marks: [{ type: "bold" }], text: "go" },
          { type: "text", text: " — went — gone" },
        ] },
        { type: "paragraph", content: [
          { type: "text", marks: [{ type: "bold" }], text: "have" },
          { type: "text", text: " — had — had" },
        ] },
        { type: "paragraph", content: [
          { type: "text", marks: [{ type: "bold" }], text: "do" },
          { type: "text", text: " — did — done" },
        ] },
        { type: "paragraph", content: [
          { type: "text", marks: [{ type: "bold" }], text: "say" },
          { type: "text", text: " — said — said" },
        ] },
      ],
    }),
    featured: false,
    views: 28,
  },
  {
    title: "Filmes para Praticar Inglês",
    slug: "filmes-praticar-ingles",
    category: "culture",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Para Iniciantes" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [
            { type: "text", marks: [{ type: "bold" }], text: "Toy Story" },
            { type: "text", text: " — vocabulário simples, diálogos claros" },
          ] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [
            { type: "text", marks: [{ type: "bold" }], text: "Finding Nemo" },
            { type: "text", text: " — ótimo para pronúncia" },
          ] }] },
        ] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Para Intermediários" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [
            { type: "text", marks: [{ type: "bold" }], text: "The Social Network" },
            { type: "text", text: " — inglês moderno" },
          ] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [
            { type: "text", marks: [{ type: "bold" }], text: "The Intern" },
            { type: "text", text: " — vocabulário profissional" },
          ] }] },
        ] },
      ],
    }),
    featured: false,
    views: 15,
  },
];

postsData.forEach((p, i) => {
  sql(`INSERT INTO posts (id, teacher_id, title, slug, content, category, featured, status, view_count, created_at, updated_at) VALUES ('${postIds[i]}', '${teacherId}', '${p.title}', '${p.slug}', '${p.content.replace(/'/g, "''")}', '${p.category}', ${p.featured ? 1 : 0}, 'published', ${p.views}, ${ts - (3 - i) * 86400}, ${ts})`);
});
```

- [ ] **Step 3: Reset DB and run seed**

Run: `npm run db:reset`
Expected: Tables created with new schema, seed data inserted successfully.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat(seed): update seed data with Tiptap JSON content for lessons and posts"
```

---

### Task 12: Remove react-markdown dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Verify react-markdown is no longer imported anywhere**

Run: `grep -r "react-markdown" src/`
Expected: No matches. (All usages replaced in prior tasks.)

- [ ] **Step 2: Uninstall react-markdown**

```bash
npm uninstall react-markdown
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Clean build, no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): remove react-markdown — replaced by Tiptap rich content renderer"
```

---

### Task 13: Smoke Test

**Files:** None (testing only)

- [ ] **Step 1: Reset DB and start dev server**

```bash
npm run db:reset
npm run dev -- --port 3001
```

Expected: Server starts without errors.

- [ ] **Step 2: Test teacher lesson creation**

Open `http://localhost:3001/sign-in`, sign in as `fran@fluent.app` / `senha12345`.
Navigate to `/teacher/lessons/new`.

Verify:
- Form shows: Título, Categoria, Capa, Duração, Conteúdo (rich editor)
- Rich editor has toolbar (bold, italic, headings, lists, etc.)
- Typing `/` shows slash menu with Imagem, Vídeo, Áudio, Documento, Embed
- Create a lesson with some formatted text and a YouTube video embed
- After save, lesson appears in `/teacher/lessons`

- [ ] **Step 3: Test student lesson view**

Sign in as `marcelo@fluent.app` / `senha12345`.
Navigate to `/lessons` and click a lesson.

Verify:
- Rich content renders properly (headings, bold, lists, video embed)
- No separate video player at top
- No separate audio/documents sections

- [ ] **Step 4: Test teacher post creation**

Sign in as teacher. Navigate to `/teacher/posts/new`.

Verify:
- Form shows: Título, Slug, Categoria, Capa (new!), Destacado, Conteúdo (rich editor)
- No Markdown textarea or preview toggle
- Create a post with formatted text

- [ ] **Step 5: Test student blog view**

Sign in as student. Navigate to `/blog`.

Verify:
- Post cards show text excerpts (extracted from Tiptap JSON)
- Click a post — rich content renders properly
- Cover image shows at top if present

- [ ] **Step 6: Test lesson editing**

Sign in as teacher. Edit an existing lesson.

Verify:
- Rich editor loads with existing content
- Can modify content and save
- Changes persist after reload
