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
    immediatelyRender: false,
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

        if (file.type.startsWith("image/")) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "content/images");
          fetch("/api/upload", { method: "POST", body: formData })
            .then((res) => res.json() as Promise<{ url: string }>)
            .then(({ url }) => {
              editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
            });
          return true;
        }

        if (file.type.startsWith("audio/")) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "content/audio");
          fetch("/api/upload", { method: "POST", body: formData })
            .then((res) => res.json() as Promise<{ url: string }>)
            .then(({ url }) => {
              editor
                ?.chain()
                .focus()
                .insertContent({ type: "audio", attrs: { src: url, name: file.name } })
                .run();
            });
          return true;
        }

        if (
          file.type === "application/pdf" ||
          file.name.match(/\.(doc|docx|ppt|pptx|xls|xlsx)$/i)
        ) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "content/documents");
          fetch("/api/upload", { method: "POST", body: formData })
            .then((res) => res.json() as Promise<{ url: string }>)
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
