"use client";

import { useState, useTransition } from "react";
import { Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { generateTaskQuestions } from "@/lib/actions/ai-generate";

interface AiGeneratorPanelProps {
  taskType: string;
  level: string;
  onGenerated: (questions: string, prompt: string) => void;
}

type PanelState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "error"; message: string };

const supportsCount = (taskType: string) =>
  taskType === "quiz" || taskType === "fill_gaps";

export function AiGeneratorPanel({
  taskType,
  level,
  onGenerated,
}: AiGeneratorPanelProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(5);
  const [panelState, setPanelState] = useState<PanelState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  const isLoading = panelState.status === "loading" || isPending;

  const handleGenerate = () => {
    if (!prompt.trim()) return;

    setPanelState({ status: "loading" });

    startTransition(async () => {
      const result = await generateTaskQuestions(
        taskType as "quiz" | "fill_gaps" | "writing",
        prompt,
        level as "beginner" | "intermediate" | "advanced",
        count,
      );

      if (result.success) {
        setPanelState({ status: "success" });
        onGenerated(result.questions, prompt);
      } else {
        setPanelState({
          status: "error",
          message: result.error ?? "Erro desconhecido ao gerar questões",
        });
      }
    });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors bg-challenges-bg/50 border-challenges/30 text-challenges-light hover:bg-challenges-bg hover:border-challenges/50"
        style={{ color: "#c9981f" }}
      >
        <Sparkles size={16} className="text-challenges" />
        {open ? "Fechar gerador IA" : "Gerar com IA"}
      </button>

      {open && (
        <div className="border border-challenges/30 bg-challenges-bg/50 rounded-md p-4 space-y-4">
          <Textarea
            label="Tema ou instruções para a IA"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Perguntas sobre Present Perfect com foco em 'already' e 'yet'"
            rows={3}
          />

          {supportsCount(taskType) && (
            <Input
              label="Número de questões"
              type="number"
              min={3}
              max={20}
              value={count}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setCount(Math.min(20, Math.max(3, val)));
              }}
            />
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              loading={isLoading}
              className="bg-challenges text-white glow-challenges"
              style={{ boxShadow: "0 4px 0 #c9981f" }}
            >
              {!isLoading && <Sparkles size={14} />}
              {isLoading ? "Gerando questões..." : "Gerar"}
            </Button>
          </div>

          {panelState.status === "success" && (
            <div className="flex items-center gap-2 text-sm text-tarefas font-medium">
              <CheckCircle size={16} />
              Questões geradas! Revise abaixo.
            </div>
          )}

          {panelState.status === "error" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-fora font-medium">
                <AlertCircle size={16} />
                {panelState.message}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerate}
                disabled={isLoading}
              >
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
