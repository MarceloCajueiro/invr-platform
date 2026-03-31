"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PostData {
  id: string;
  title: string;
  slug: string;
  content: string | null;
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

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function PostForm({ post, action }: PostFormProps) {
  const isEdit = !!post;
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [preview, setPreview] = useState(false);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-5">
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-text-primary">
                Conteúdo
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreview(!preview)}
              >
                {preview ? "Editar" : "Visualizar"}
              </Button>
            </div>

            {preview ? (
              <div className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-[#f8f9fb] border border-border min-h-[192px] prose prose-sm max-w-none text-text-primary prose-headings:text-text-primary prose-p:text-text-primary prose-strong:text-text-primary prose-a:text-aulas">
                {content ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  <p className="text-text-muted italic">
                    Nenhum conteúdo para visualizar.
                  </p>
                )}
              </div>
            ) : (
              <textarea
                name="content"
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva o conteúdo do post em Markdown..."
                className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-[#f8f9fb] border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-aulas transition-colors resize-y"
              />
            )}

            {preview && <input type="hidden" name="content" value={content} />}
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
