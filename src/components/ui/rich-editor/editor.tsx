"use client";

import { useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
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
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const slashMenuOpenRef = useRef(false);

  const openSlashMenu = useCallback(() => {
    slashMenuOpenRef.current = true;
    setSlashMenuOpen(true);
  }, []);
  const closeSlashMenu = useCallback(() => {
    slashMenuOpenRef.current = false;
    setSlashMenuOpen(false);
  }, []);

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
      Underline,
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
        class: "tiptap-editor",
      },
      handleKeyDown(_view, event) {
        if (event.key === "/" && !event.ctrlKey && !event.metaKey && !slashMenuOpenRef.current) {
          // Only trigger on empty paragraph
          const { state } = _view;
          const { $from } = state.selection;
          const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
          if (textBefore === "") {
            event.preventDefault();
            openSlashMenu();
            return true;
          }
        }
        return false;
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
        <SlashMenu editor={editor} open={slashMenuOpen} onClose={closeSlashMenu} />
      </div>
    </div>
  );
}
