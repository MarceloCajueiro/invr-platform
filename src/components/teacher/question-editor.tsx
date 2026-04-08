"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Plus, Trash2, Volume2 } from "lucide-react";

const TTS_VOICES = [
  { id: "Kore", label: "Kore", gender: "Feminina", preview: "/audio/voices/kore.wav" },
  { id: "Aoede", label: "Aoede", gender: "Feminina", preview: "/audio/voices/aoede.wav" },
  { id: "Charon", label: "Charon", gender: "Masculino", preview: "/audio/voices/charon.wav" },
  { id: "Puck", label: "Puck", gender: "Masculino", preview: "/audio/voices/puck.wav" },
] as const;

interface QuestionEditorProps {
  taskType: "quiz" | "listening" | "fill_gaps" | "writing";
  initialQuestions?: string;
  name: string;
  level?: "beginner" | "intermediate" | "advanced";
}

// --- Quiz types & editor ---

interface QuizOption {
  letter: string;
  text: string;
  correct: boolean;
}

interface QuizQuestion {
  number: number;
  text: string;
  options: QuizOption[];
  explanation: string;
}

function makeEmptyQuizQuestion(number: number): QuizQuestion {
  return {
    number,
    text: "",
    options: [
      { letter: "A", text: "", correct: true },
      { letter: "B", text: "", correct: false },
      { letter: "C", text: "", correct: false },
      { letter: "D", text: "", correct: false },
    ],
    explanation: "",
  };
}

function QuizEditor({
  questions,
  onChange,
}: {
  questions: QuizQuestion[];
  onChange: (q: QuizQuestion[]) => void;
}) {
  const addQuestion = () => {
    onChange([...questions, makeEmptyQuizQuestion(questions.length + 1)]);
  };

  const removeQuestion = (index: number) => {
    const updated = questions
      .filter((_, i) => i !== index)
      .map((q, i) => ({ ...q, number: i + 1 }));
    onChange(updated);
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, text: string) => {
    const updated = [...questions];
    const options = [...updated[qIndex].options];
    options[oIndex] = { ...options[oIndex], text };
    updated[qIndex] = { ...updated[qIndex], options };
    onChange(updated);
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    const options = updated[qIndex].options.map((o, i) => ({
      ...o,
      correct: i === oIndex,
    }));
    updated[qIndex] = { ...updated[qIndex], options };
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {questions.map((q, qIndex) => (
        <div
          key={qIndex}
          className="border border-border rounded-[var(--radius-sm)] p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">
              Pergunta {q.number}
            </span>
            {questions.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeQuestion(qIndex)}
              >
                <Trash2 size={14} />
                Remover
              </Button>
            )}
          </div>

          <Input
            label="Texto da pergunta"
            value={q.text}
            onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
            placeholder="Ex: What is the correct translation?"
          />

          <div className="space-y-2">
            <span className="block text-xs font-medium text-text-primary">
              Opções (selecione a correta)
            </span>
            {q.options.map((opt, oIndex) => (
              <div key={oIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`quiz-correct-${qIndex}`}
                  checked={opt.correct}
                  onChange={() => setCorrectOption(qIndex, oIndex)}
                  className="accent-aulas"
                />
                <span className="text-sm font-medium text-text-secondary w-5">
                  {opt.letter}
                </span>
                <Input
                  value={opt.text}
                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                  placeholder={`Opção ${opt.letter}`}
                  className="flex-1"
                />
              </div>
            ))}
          </div>

          <Input
            label="Explicação (opcional)"
            value={q.explanation}
            onChange={(e) =>
              updateQuestion(qIndex, "explanation", e.target.value)
            }
            placeholder="Explique a resposta correta..."
          />
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" onClick={addQuestion}>
        <Plus size={14} />
        Adicionar pergunta
      </Button>
    </div>
  );
}

// --- Fill-gaps types & editor ---

interface FillGapQuestion {
  number: number;
  text: string;
  answer: string;
  explanation: string;
}

function makeEmptyFillGap(number: number): FillGapQuestion {
  return { number, text: "", answer: "", explanation: "" };
}

function FillGapsEditor({
  questions,
  onChange,
}: {
  questions: FillGapQuestion[];
  onChange: (q: FillGapQuestion[]) => void;
}) {
  const addItem = () => {
    onChange([...questions, makeEmptyFillGap(questions.length + 1)]);
  };

  const removeItem = (index: number) => {
    const updated = questions
      .filter((_, i) => i !== index)
      .map((q, i) => ({ ...q, number: i + 1 }));
    onChange(updated);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {questions.map((q, qIndex) => (
        <div
          key={qIndex}
          className="border border-border rounded-[var(--radius-sm)] p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">
              Item {q.number}
            </span>
            {questions.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(qIndex)}
              >
                <Trash2 size={14} />
                Remover
              </Button>
            )}
          </div>

          <Input
            label="Frase com lacuna (use ___ para o espaço)"
            value={q.text}
            onChange={(e) => updateItem(qIndex, "text", e.target.value)}
            placeholder="Ex: She ___ to the store yesterday."
          />

          <Input
            label="Resposta correta"
            value={q.answer}
            onChange={(e) => updateItem(qIndex, "answer", e.target.value)}
            placeholder="Ex: went"
          />

          <Input
            label="Explicação (opcional)"
            value={q.explanation}
            onChange={(e) => updateItem(qIndex, "explanation", e.target.value)}
            placeholder="Explique a resposta..."
          />
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" onClick={addItem}>
        <Plus size={14} />
        Adicionar item
      </Button>
    </div>
  );
}

// --- Writing types & editor ---

interface WritingPromptData {
  prompt: string;
  instructions: string;
}

function WritingEditor({
  data,
  onChange,
}: {
  data: WritingPromptData;
  onChange: (d: WritingPromptData) => void;
}) {
  return (
    <div className="space-y-4">
      <Textarea
        label="Prompt de escrita"
        value={data.prompt}
        onChange={(e) => onChange({ ...data, prompt: e.target.value })}
        placeholder="Ex: Write a paragraph about your daily routine..."
        rows={4}
      />

      <Textarea
        label="Instruções (opcional)"
        value={data.instructions}
        onChange={(e) => onChange({ ...data, instructions: e.target.value })}
        placeholder="Ex: Use at least 5 different verbs in the simple present tense."
        rows={3}
      />
    </div>
  );
}

// --- Listening types & editor ---

interface ListeningData {
  text: string;
  audioUrl: string;
  voice?: string;
}

function VoicePreviewButton({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useState<HTMLAudioElement | null>(null);

  function handlePlay(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (audioRef[0]) {
      audioRef[0].pause();
      audioRef[0].currentTime = 0;
    }
    const audio = new Audio(src);
    audioRef[0] = audio;
    setPlaying(true);
    audio.onended = () => setPlaying(false);
    audio.play();
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handlePlay}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handlePlay(e as unknown as React.MouseEvent); }}
      className="ml-auto shrink-0 text-text-muted hover:text-primary transition-colors cursor-pointer"
      title="Ouvir prévia"
    >
      {playing ? <Volume2 size={14} className="text-primary" /> : <Play size={14} />}
    </span>
  );
}

function ListeningEditor({
  data,
  onChange,
  level,
}: {
  data: ListeningData;
  onChange: (d: ListeningData) => void;
  level?: "beginner" | "intermediate" | "advanced";
}) {
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const selectedVoice = data.voice || "Kore";

  async function handleGenerateAudio() {
    if (!data.text.trim()) return;

    setGeneratingAudio(true);
    setAudioError(null);

    try {
      const res = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: data.text,
          voice: selectedVoice,
          level: level ?? "intermediate",
        }),
      });

      const result = (await res.json()) as {
        audioUrl?: string;
        error?: string;
      };

      if (!res.ok) {
        setAudioError(result.error || "Erro ao gerar áudio");
        return;
      }

      if (result.audioUrl) {
        onChange({ ...data, audioUrl: result.audioUrl });
      }
    } catch (e) {
      console.error("TTS error:", e);
      setAudioError("Erro de conexão ao gerar áudio");
    } finally {
      setGeneratingAudio(false);
    }
  }

  return (
    <div className="space-y-4">
      <Textarea
        label="Texto para leitura/áudio"
        value={data.text}
        onChange={(e) => onChange({ ...data, text: e.target.value })}
        placeholder="Ex: Hello, my name is John. I live in New York..."
        rows={6}
      />

      {/* Voice selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">Voz</label>
        <div className="grid grid-cols-2 gap-2">
          {TTS_VOICES.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onChange({ ...data, voice: v.id, audioUrl: "" })}
              className={`flex items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-2 text-sm transition-colors ${
                selectedVoice === v.id
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-border bg-white text-text-secondary hover:border-primary/40"
              }`}
            >
              <span>{v.label}</span>
              <span className="text-xs text-text-muted">({v.gender})</span>
              <VoicePreviewButton src={v.preview} />
            </button>
          ))}
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleGenerateAudio}
        disabled={generatingAudio || !data.text.trim()}
      >
        {generatingAudio ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Gerando áudio...
          </>
        ) : (
          <>
            <Volume2 size={14} />
            Gerar Áudio
          </>
        )}
      </Button>

      {audioError && (
        <p className="text-sm text-red-600">{audioError}</p>
      )}

      {data.audioUrl && (
        <div className="rounded-[var(--radius-sm)] bg-input-bg border border-border p-4 space-y-2">
          <p className="text-xs font-medium text-text-secondary">
            Prévia do áudio gerado
          </p>
          <audio controls src={data.audioUrl} className="w-full" />
        </div>
      )}

      {!data.audioUrl && !generatingAudio && (
        <div className="rounded-[var(--radius-sm)] bg-input-bg border border-border p-4">
          <p className="text-sm text-text-muted">
            Selecione uma voz e clique em &quot;Gerar Áudio&quot; para criar o
            áudio a partir do texto acima.
          </p>
        </div>
      )}
    </div>
  );
}

// --- Main component ---

export function QuestionEditor({
  taskType,
  initialQuestions,
  name,
  level,
}: QuestionEditorProps) {
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(() => {
    if (initialQuestions && taskType === "quiz") {
      try {
        return JSON.parse(initialQuestions);
      } catch {
        return [makeEmptyQuizQuestion(1)];
      }
    }
    return [makeEmptyQuizQuestion(1)];
  });

  const [fillGapQuestions, setFillGapQuestions] = useState<FillGapQuestion[]>(
    () => {
      if (initialQuestions && taskType === "fill_gaps") {
        try {
          return JSON.parse(initialQuestions);
        } catch {
          return [makeEmptyFillGap(1)];
        }
      }
      return [makeEmptyFillGap(1)];
    },
  );

  const [writingData, setWritingData] = useState<WritingPromptData>(() => {
    if (initialQuestions && taskType === "writing") {
      try {
        return JSON.parse(initialQuestions);
      } catch {
        return { prompt: "", instructions: "" };
      }
    }
    return { prompt: "", instructions: "" };
  });

  const [listeningData, setListeningData] = useState<ListeningData>(() => {
    if (initialQuestions && taskType === "listening") {
      try {
        return JSON.parse(initialQuestions);
      } catch {
        return { text: "", audioUrl: "", voice: "Kore" };
      }
    }
    return { text: "", audioUrl: "" };
  });

  const getJsonValue = (): string => {
    switch (taskType) {
      case "quiz":
        return JSON.stringify(quizQuestions);
      case "fill_gaps":
        return JSON.stringify(fillGapQuestions);
      case "writing":
        return JSON.stringify(writingData);
      case "listening":
        return JSON.stringify(listeningData);
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text-primary">
        {taskType === "quiz" && "Perguntas do Quiz"}
        {taskType === "fill_gaps" && "Preencher Lacunas"}
        {taskType === "writing" && "Exercício de Escrita"}
        {taskType === "listening" && "Exercício de Listening"}
      </h3>

      {taskType === "quiz" && (
        <QuizEditor questions={quizQuestions} onChange={setQuizQuestions} />
      )}
      {taskType === "fill_gaps" && (
        <FillGapsEditor
          questions={fillGapQuestions}
          onChange={setFillGapQuestions}
        />
      )}
      {taskType === "writing" && (
        <WritingEditor data={writingData} onChange={setWritingData} />
      )}
      {taskType === "listening" && (
        <ListeningEditor data={listeningData} onChange={setListeningData} level={level} />
      )}

      <input type="hidden" name={name} value={getJsonValue()} />
    </div>
  );
}
