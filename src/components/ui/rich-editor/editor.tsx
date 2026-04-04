"use client";

import { useState } from "react";
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorCommandList,
  EditorBubble,
  EditorBubbleItem,
  TiptapImage,
  TiptapLink,
  StarterKit,
  Placeholder,
  HorizontalRule,
  Command,
  createSuggestionItems,
  renderItems,
  handleImageDrop,
  handleImagePaste,
  createImageUpload,
  type JSONContent,
} from "novel";
import TiptapUnderline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Image,
  Film,
  Upload,
  Headphones,
  FileText,
  Globe,
  Minus,
  Link,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioBlock } from "./extensions/audio";
import { VideoBlock, detectProvider } from "./extensions/video";
import { DocumentBlock } from "./extensions/document";
import { EmbedBlock } from "./extensions/embed";

// ── Upload handler ──────────────────────────────────────────────────────────

async function uploadToR2(file: File, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const data = (await res.json()) as { url: string };
  return data.url;
}

const uploadFn = createImageUpload({
  onUpload: async (file: File) => {
    const url = await uploadToR2(file, "content/images");
    return url;
  },
  validateFn: (file) => {
    if (!file.type.includes("image/")) return false;
    if (file.size / 1024 / 1024 > 20) return false;
    return true;
  },
});

// ── Slash command items ─────────────────────────────────────────────────────

const suggestionItems = createSuggestionItems([
  {
    title: "Título",
    description: "Título de seção",
    searchTerms: ["heading", "titulo", "h2"],
    icon: <Heading2 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Subtítulo",
    description: "Subtítulo menor",
    searchTerms: ["subtitle", "subtitulo", "h3"],
    icon: <Heading3 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "Lista",
    description: "Lista com marcadores",
    searchTerms: ["bullet", "lista", "unordered"],
    icon: <List size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Lista numerada",
    description: "Lista com números",
    searchTerms: ["ordered", "numerada", "numbered"],
    icon: <ListOrdered size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Citação",
    description: "Bloco de citação",
    searchTerms: ["blockquote", "citacao", "quote"],
    icon: <Quote size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").toggleBlockquote().run();
    },
  },
  {
    title: "Separador",
    description: "Linha separadora",
    searchTerms: ["hr", "separador", "divider"],
    icon: <Minus size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Imagem",
    description: "Upload de imagem",
    searchTerms: ["image", "imagem", "foto", "photo"],
    icon: <Image size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        if (input.files?.length) {
          const file = input.files[0];
          const pos = editor.view.state.selection.from;
          uploadFn(file, editor.view, pos);
        }
      };
      input.click();
    },
  },
  {
    title: "Vídeo (link)",
    description: "YouTube, Vimeo ou link direto",
    searchTerms: ["video", "youtube", "vimeo", "link"],
    icon: <Film size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const url = window.prompt("URL do vídeo (YouTube, Vimeo ou link direto):");
      if (url) {
        const provider = detectProvider(url);
        editor.chain().focus().insertContent({ type: "video", attrs: { src: url, provider } }).run();
      }
    },
  },
  {
    title: "Vídeo (upload)",
    description: "Upload de arquivo de vídeo",
    searchTerms: ["video", "upload", "mp4"],
    icon: <Upload size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "video/mp4,video/webm,video/quicktime";
      input.onchange = async () => {
        if (input.files?.length) {
          const file = input.files[0];
          const url = await uploadToR2(file, "content/videos");
          editor.chain().focus().insertContent({ type: "video", attrs: { src: url, provider: "upload" } }).run();
        }
      };
      input.click();
    },
  },
  {
    title: "Áudio",
    description: "Upload de arquivo de áudio",
    searchTerms: ["audio", "mp3", "som", "musica"],
    icon: <Headphones size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "audio/mpeg,audio/wav,audio/ogg,audio/mp4";
      input.onchange = async () => {
        if (input.files?.length) {
          const file = input.files[0];
          const url = await uploadToR2(file, "content/audio");
          editor.chain().focus().insertContent({ type: "audio", attrs: { src: url, name: file.name } }).run();
        }
      };
      input.click();
    },
  },
  {
    title: "Documento",
    description: "Upload de PDF, DOC, etc.",
    searchTerms: ["documento", "pdf", "doc", "arquivo", "file"],
    icon: <FileText size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx";
      input.onchange = async () => {
        if (input.files?.length) {
          const file = input.files[0];
          const url = await uploadToR2(file, "content/documents");
          editor.chain().focus().insertContent({
            type: "document",
            attrs: { src: url, name: file.name, size: file.size },
          }).run();
        }
      };
      input.click();
    },
  },
  {
    title: "Embed",
    description: "Incorporar URL externa",
    searchTerms: ["embed", "iframe", "incorporar"],
    icon: <Globe size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const url = window.prompt("URL do embed:");
      if (url) {
        editor.chain().focus().insertContent({ type: "embed", attrs: { src: url } }).run();
      }
    },
  },
]);

// ── Slash command extension ─────────────────────────────────────────────────

const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionItems,
    render: renderItems,
  },
});

// ── Extensions ──────────────────────────────────────────────────────────────

const tiptapImage = TiptapImage.configure({
  allowBase64: true,
  HTMLAttributes: { class: "rounded-[var(--radius-md)] max-w-full my-4" },
});

const tiptapLink = TiptapLink.configure({
  HTMLAttributes: {
    class: "text-aulas underline underline-offset-2 cursor-pointer",
  },
});

const placeholder = Placeholder.configure({
  placeholder: "Comece a escrever ou digite / para inserir mídia...",
});

const starterKit = StarterKit.configure({
  heading: { levels: [2, 3] },
  bulletList: { HTMLAttributes: { class: "list-disc list-outside ml-4 space-y-1" } },
  orderedList: { HTMLAttributes: { class: "list-decimal list-outside ml-4 space-y-1" } },
  blockquote: {
    HTMLAttributes: {
      class: "border-l-4 border-fora pl-4 italic text-text-muted",
    },
  },
  codeBlock: false,
  code: {
    HTMLAttributes: {
      class: "rounded bg-bg-light px-1.5 py-0.5 font-mono text-sm",
    },
  },
  horizontalRule: false,
  dropcursor: { color: "#6c5ce7", width: 4 },
});

const horizontalRule = HorizontalRule.configure({
  HTMLAttributes: { class: "my-6 border-border" },
});

const extensions = [
  starterKit,
  tiptapImage,
  tiptapLink,
  placeholder,
  horizontalRule,
  TiptapUnderline,
  AudioBlock,
  VideoBlock,
  DocumentBlock,
  EmbedBlock,
  slashCommand,
];

// ── Editor component ────────────────────────────────────────────────────────

interface RichEditorProps {
  content?: string;
  onChange: (json: string) => void;
}

export function RichEditor({ content, onChange }: RichEditorProps) {
  const [initialContent] = useState<JSONContent | undefined>(() => {
    if (!content) return undefined;
    try {
      return JSON.parse(content);
    } catch {
      return undefined;
    }
  });

  return (
    <EditorRoot>
      <EditorContent
        immediatelyRender={false}
        extensions={extensions}
        initialContent={initialContent}
        onUpdate={({ editor }) => {
          onChange(JSON.stringify(editor.getJSON()));
        }}
        editorProps={{
          handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
          handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
          attributes: {
            class: "tiptap-editor",
          },
        }}
        className="border border-border rounded-[var(--radius-md)] bg-bg-card overflow-hidden focus-within:border-aulas transition-colors"
      >
        {/* Slash command menu */}
        <EditorCommand className="z-50 w-64 max-h-80 overflow-y-auto rounded-[var(--radius-md)] border border-border bg-bg-card shadow-lg animate-fade-in">
          <EditorCommandEmpty className="px-3 py-2 text-sm text-text-muted">
            Nenhum resultado
          </EditorCommandEmpty>
          <EditorCommandList>
            {suggestionItems.map((item) => (
              <EditorCommandItem
                key={item.title}
                value={item.title}
                onCommand={(val) => item.command?.(val)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-bg-light rounded cursor-pointer aria-selected:bg-aulas/10 aria-selected:text-aulas"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-bg-light shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-text-muted">{item.description}</p>
                </div>
              </EditorCommandItem>
            ))}
          </EditorCommandList>
        </EditorCommand>

        {/* Bubble menu (appears on text selection) */}
        <EditorBubble className="flex items-center rounded-[var(--radius-md)] border border-border bg-bg-card shadow-lg overflow-hidden">
          <EditorBubbleItem
            onSelect={(editor) => editor.chain().focus().toggleBold().run()}
          >
            <button type="button" className="p-2 text-text-muted hover:text-text-primary transition-colors">
              <Bold size={14} />
            </button>
          </EditorBubbleItem>
          <EditorBubbleItem
            onSelect={(editor) => editor.chain().focus().toggleItalic().run()}
          >
            <button type="button" className="p-2 text-text-muted hover:text-text-primary transition-colors">
              <Italic size={14} />
            </button>
          </EditorBubbleItem>
          <EditorBubbleItem
            onSelect={(editor) => editor.chain().focus().toggleUnderline().run()}
          >
            <button type="button" className="p-2 text-text-muted hover:text-text-primary transition-colors">
              <UnderlineIcon size={14} />
            </button>
          </EditorBubbleItem>
          <EditorBubbleItem
            onSelect={(editor) => {
              const url = window.prompt("URL do link:");
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
          >
            <button type="button" className="p-2 text-text-muted hover:text-text-primary transition-colors">
              <Link size={14} />
            </button>
          </EditorBubbleItem>
        </EditorBubble>
      </EditorContent>
    </EditorRoot>
  );
}
