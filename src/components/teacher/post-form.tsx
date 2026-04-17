"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload, type FileItem } from "@/components/ui/file-upload";
import { BlockEditor } from "@/components/ui/block-editor";
import { TurmaSelector } from "@/components/teacher/turma-selector";

interface PostData {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  coverImageUrl: string | null;
  category: "tips" | "grammar" | "culture" | "vocabulary";
  featured: boolean;
  publishedAt: Date | null;
}

interface PostFormProps {
  post?: PostData;
  action: (formData: FormData) => Promise<void>;
  turmas?: { id: string; name: string; color: string | null }[];
  selectedTurmaIds?: string[];
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

function toInputDate(date: Date | null | undefined): string {
  if (!date) return new Date().toISOString().split("T")[0];
  return new Date(date).toISOString().split("T")[0];
}

export function PostForm({ post, action, turmas = [], selectedTurmaIds = [] }: PostFormProps) {
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
                className="flex-1 px-3 py-2.5 rounded-[var(--radius-sm)] bg-input-bg border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-aulas transition-colors"
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

          <div className="space-y-1.5">
            <Input
              label="Data de publicação"
              name="publishedAt"
              type="date"
              defaultValue={toInputDate(post?.publishedAt)}
            />
            <p className="text-xs text-text-muted">
              Pode agendar para o futuro — alunos só veem a partir dessa data.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-text-primary">
              Conteúdo
            </h3>
            <BlockEditor
              initialContent={post?.content || undefined}
              onChange={setContent}
            />
          </div>

          {turmas.length > 0 && (
            <TurmaSelector turmas={turmas} selectedIds={selectedTurmaIds} />
          )}

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
