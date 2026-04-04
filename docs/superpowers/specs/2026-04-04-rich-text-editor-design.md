# Rich Text Editor for Lessons and Posts

**Date:** 2026-04-04
**Status:** Approved
**Scope:** Lesson form, Post form, Student rendering

## Summary

Replace the current separate-field approach (description + videoUrl + audioUrls + documentUrls) in lesson creation and the Markdown textarea in post creation with a unified Tiptap-based rich text editor. The professor composes content and inserts media (images, videos, audio, documents, embeds) inline. Only the cover image remains as a separate upload.

## Context

### Current State

**Lessons:**
- `description`: plain text rendered as Markdown
- `videoUrl`: separate field (YouTube/Vimeo link or upload)
- `audioUrls`: JSON array of uploaded audio files
- `documentUrls`: JSON array of uploaded documents
- `coverImageUrl`: separate upload
- Form has 6 distinct sections — feels fragmented

**Posts:**
- `content`: raw Markdown in textarea with preview toggle
- No cover image
- No media upload support

**Problems:**
- Media feels disconnected from text content
- Professor can't control where media appears relative to text
- Poor authoring experience for non-technical users
- Post has no visual media capabilities

### Target State

Both lessons and posts use the same `<RichEditor>` component. Content is a single JSON document containing text and media blocks interleaved. Cover image is the only separate upload.

## Technology Choice: Tiptap

**Why Tiptap over alternatives:**

| Criteria | Tiptap | Lexical | Novel |
|---|---|---|---|
| Custom media blocks | Extension API, well-documented | Possible but complex API | Hard to customize |
| Slash commands | Extension available | Build from scratch | Built-in but rigid |
| Community/docs | Mature, large ecosystem | Growing, weaker docs | Small |
| Bundle size | ~50KB gzipped | ~22KB gzipped | ~60KB gzipped |
| React support | First-class | First-class | Tiptap wrapper |

Tiptap provides the best balance of ready-made features and flexibility for custom media blocks.

## Schema Changes

### Table: `lessons`

**Keep:** `id`, `teacherId`, `title`, `category`, `coverImageUrl`, `durationMinutes`, `status`, `position`, `createdAt`, `updatedAt`

**Rename:** `description` -> `content` (text) — stores Tiptap JSON as string

**Remove:** `videoUrl`, `audioUrls`, `documentUrls`

### Table: `posts`

**Keep:** all existing columns

**Add:** `coverImageUrl` (text, optional)

**`content`:** remains text column — format changes from Markdown to Tiptap JSON

### Content JSON Format

Tiptap stores content as a structured JSON tree:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Today we will learn..." }]
    },
    {
      "type": "image",
      "attrs": { "src": "/api/files/images/123-photo.jpg", "alt": "example" }
    },
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "Vocabulary" }]
    },
    {
      "type": "audio",
      "attrs": { "src": "/api/files/audio/456-pronunciation.mp3", "name": "Pronunciation" }
    },
    {
      "type": "video",
      "attrs": { "src": "https://youtube.com/watch?v=...", "provider": "youtube" }
    },
    {
      "type": "document",
      "attrs": { "src": "/api/files/docs/789-worksheet.pdf", "name": "Worksheet.pdf", "size": 204800 }
    }
  ]
}
```

Stored as `JSON.stringify()` in the D1 `text` column. Parsed in app code.

## Editor Component Design

### Component: `<RichEditor>`

**Location:** `src/components/ui/rich-editor/editor.tsx`
**Directive:** `"use client"`

**Props:**
- `content?: string` — Tiptap JSON for editing existing content
- `onChange: (json: string) => void` — callback on content change
- `placeholder?: string` — defaults to "Comece a escrever o conteudo ou digite / para inserir midia..."

**Sub-components:**

| Component | File | Purpose |
|---|---|---|
| `Toolbar` | `rich-editor/toolbar.tsx` | Fixed top bar: bold, italic, H2, H3, bullet list, ordered list, blockquote, horizontal rule |
| `SlashMenu` | `rich-editor/slash-menu.tsx` | Dropdown on `/` keystroke: Imagem, Video, Audio, Documento, Embed |
| `BubbleMenu` | `rich-editor/bubble-menu.tsx` | Floating toolbar on text selection: bold, italic, underline, link |

### Custom Extensions

| Extension | File | Node Type | Attrs |
|---|---|---|---|
| `AudioBlock` | `extensions/audio.ts` | `audio` | `src`, `name` |
| `VideoBlock` | `extensions/video.ts` | `video` | `src`, `provider` (youtube/vimeo/upload) |
| `DocumentBlock` | `extensions/document.ts` | `document` | `src`, `name`, `size` |
| `EmbedBlock` | `extensions/embed.ts` | `embed` | `src` |

Each extension defines:
1. Schema (node type, attrs, how it's represented in the editor)
2. Node view (React component rendered in the editor)
3. Parse/serialize rules

### Media Upload Flow

1. Professor triggers insert (slash menu, drag-and-drop, or toolbar)
2. File picker opens (for uploads) or URL input appears (for links/embeds)
3. For uploads: `POST /api/upload` with file + folder — same existing API
4. API returns `{ url, name, size }`
5. Editor inserts node with returned URL in `src` attr
6. On form submit, `editor.getJSON()` is stringified and sent as FormData field

### NPM Packages

**Install:**
- `@tiptap/react`
- `@tiptap/starter-kit` (paragraph, heading, bold, italic, lists, blockquote, code, hr)
- `@tiptap/extension-image`
- `@tiptap/extension-link`
- `@tiptap/extension-placeholder`
- `@tiptap/extension-underline`
- `@tiptap/extension-bubble-menu`

**Not needed:**
- Collaboration (single editor — Fran)
- Version history
- Tables
- Code blocks (non-technical audience)
- Tiptap Pro extensions

## Form Changes

### Lesson Form

**Fields:**
1. Titulo (text input, required)
2. Categoria (select, required)
3. Capa (FileUpload component — images only, max 5MB)
4. Duracao em minutos (number input, optional)
5. Conteudo (RichEditor)

**Removed:** video section (link/upload toggle), audio section, documents section

### Post Form

**Fields:**
1. Titulo (text input, required — auto-generates slug)
2. Slug (text input, required — with "Gerar" button)
3. Categoria (select, required)
4. Capa (FileUpload component — images only, max 5MB) — **new**
5. Destacado (checkbox)
6. Conteudo (RichEditor)

**Removed:** Markdown textarea, preview toggle

## Student-Side Rendering

### Component: `<RichContent>`

**Location:** `src/components/ui/rich-content.tsx`
**Directive:** `"use client"` — needed for interactive elements (audio player controls, video playback)

**Props:**
- `content: string` — Tiptap JSON string

**Renders each node type:**
- `paragraph` — `<p>` with Tailwind prose styling
- `heading` — `<h2>`, `<h3>` with appropriate styles
- `bulletList`, `orderedList` — `<ul>`, `<ol>`
- `blockquote` — styled `<blockquote>`
- `horizontalRule` — `<hr>`
- `image` — responsive `<img>` with lazy loading, optional caption
- `video` (youtube/vimeo) — responsive iframe wrapper (16:9)
- `video` (upload) — native `<video>` with controls
- `audio` — custom player with play/pause, progress bar, file name
- `document` — card with file type icon, name, "Baixar" button
- `embed` — responsive sandboxed iframe

### Page Changes

**Lesson player (`lesson-player.tsx`):**
- Remove fixed video at top
- Remove separate audio/documents sections
- Render `<RichContent content={lesson.content} />`
- Keep: title, category badge, duration, "mark as watched" button

**Blog post page (`blog/[slug]/page.tsx`):**
- Replace `react-markdown` with `<RichContent content={post.content} />`
- Add cover image at top (new `coverImageUrl` field)
- Keep: title, badge, date, view count

**Listing cards:** No changes — they use title, cover, category from direct columns.

## Validation

### `createLessonSchema` (updated)

```
title: string (min 1)
category: enum (conversation/grammar/vocabulary/listening/culture)
coverImageUrl: string (optional)
content: string (optional)
durationMinutes: number >= 0 (optional)
position: number >= 0 (optional)
```

Removed: `videoUrl`, `audioUrls`, `documentUrls`

### `createPostSchema` (updated)

```
title: string (min 1)
slug: string (min 1, regex /^[a-z0-9-]+$/)
category: enum (tips/grammar/culture/vocabulary)
coverImageUrl: string (optional) — new
content: string (optional)
featured: boolean (optional)
```

No structural validation on the JSON content — Tiptap guarantees the format.

## Server Actions

### Lessons (`src/lib/actions/lessons.ts`)

**Simplification:**
- Remove `resolveVideoUrl()` helper
- Remove `extractSingleUrl()` helper
- Remove parsing of audioUrls/documentUrls JSON arrays
- `createLesson` and `updateLesson` receive `content` as a plain string from FormData

### Posts (`src/lib/actions/posts.ts`)

- Add `coverImageUrl` to insert/update
- `content` handling unchanged (still a string, just different format)

## Seed Data

Update `src/lib/db/seed.ts` to create lessons and posts with Tiptap JSON content including mixed blocks (text + headings + images + video embeds + audio + documents).

## Queries

### Lessons (`src/lib/queries/lessons.ts`)

Update queries to select `content` instead of `description`. Remove references to `videoUrl`, `audioUrls`, `documentUrls`.

### Posts (`src/lib/queries/posts.ts`)

Add `coverImageUrl` to selected fields where needed.

## File Structure

```
src/components/ui/rich-editor/
  editor.tsx          — main RichEditor component
  toolbar.tsx         — fixed toolbar
  slash-menu.tsx      — slash command dropdown
  bubble-menu.tsx     — floating text selection toolbar
  extensions/
    audio.ts          — audio block extension + node view
    video.ts          — video block extension + node view
    document.ts       — document block extension + node view
    embed.ts          — embed block extension + node view

src/components/ui/rich-content.tsx  — server-side renderer
```

## What Does NOT Change

- Upload API (`POST /api/upload`, R2 storage) — reused as-is
- File serving (`/api/files/[...path]`) — unchanged
- FileUpload component — still used for cover image uploads
- Auth flow — unchanged
- Middleware — unchanged
- Listing pages / card components — unchanged (use direct columns)
- `react-markdown` package — can be removed after migration
