# AI Specifications

## Philosophy

AI acts as the teacher's copilot — automating repetitive content creation, not replacing the teacher. All AI-generated content is reviewed by the teacher before reaching students.

## Integrations

| Provider | Purpose | Model |
|----------|---------|-------|
| **Groq** | Text generation & correction | Chat Completions API |
| **Google Gemini Flash** | TTS (text-to-speech) | Gemini Flash TTS |
| **Google Gemini Flash** | STT (speech-to-text, future) | Gemini Flash STT |

## AI Features

### AI-001: Quiz Generator

**Trigger**: Teacher clicks "Generate with AI" in task creation (type: quiz)

**Input**:
- Type: quiz
- Prompt/theme (e.g., "Present Perfect tense")
- Level: beginner | intermediate | advanced
- Question count: 3-30
- Optional: linked lesson ID for context

**Process**: Server Action → Groq Chat Completions with system prompt requesting JSON output

**Output** (JSON):
```json
[
  {
    "number": 1,
    "text": "Which sentence uses the Present Perfect correctly?",
    "options": [
      { "letter": "a", "text": "I have went to the store", "correct": false },
      { "letter": "b", "text": "I have gone to the store", "correct": true },
      { "letter": "c", "text": "I has gone to the store", "correct": false },
      { "letter": "d", "text": "I had go to the store", "correct": false }
    ],
    "explanation": "The correct form is 'have gone' (have + past participle)."
  }
]
```

**UX**: Loading state → preview first 2 questions → Accept / Edit / Regenerate

### AI-002: Fill-the-Gaps Generator

**Input**: Same as quiz but type: fill_gaps

**Output** (JSON):
```json
[
  {
    "number": 1,
    "text": "She ______ (go) to the gym every morning.",
    "answer": "goes",
    "alternatives": ["goes"],
    "explanation": "Third person singular in Present Simple requires -es for 'go'."
  }
]
```

### AI-003: Writing Prompt Generator

**Input**: Theme, level, optional focus area

**Output** (JSON):
```json
{
  "prompt": "Write a short email to a colleague explaining why you'll miss the meeting tomorrow.",
  "rubric": {
    "grammar": "Correct use of future tenses",
    "vocabulary": "Professional/workplace vocabulary",
    "coherence": "Clear structure with greeting, body, closing",
    "length": "80-120 words"
  },
  "example_response": "Dear Sarah, I'm writing to let you know..."
}
```

### AI-004: TTS for Listening Exercises

**Trigger**: Teacher clicks "Generate Audio" in listening task creation

**Input**:
- Text (dialogue or passage)
- Number of voices (1-3)
- Speed: normal | slow

**Process**: Route Handler (`/api/ai/tts`) → Gemini Flash TTS → upload audio to R2

**Output**: `{ audioUrl: "https://r2.../audio.mp3" }`

### AI-005: Writing Correction

**Trigger**: Student submits writing exercise → auto-sent to Groq

**Input**:
- Student's text
- Original exercise prompt
- Student level

**System Prompt**: Evaluate grammar, vocabulary, coherence, task compliance. Return structured feedback in Portuguese.

**Output** (JSON):
```json
{
  "score": 7,
  "feedback": "Bom trabalho! Seu texto está claro e bem organizado...",
  "errors": [
    {
      "original": "I goed to the store",
      "correction": "I went to the store",
      "type": "grammar",
      "explanation": "O passado de 'go' é irregular: went"
    }
  ],
  "tips": [
    "Tente usar mais conectores (however, moreover, although)",
    "Varie o vocabulário — em vez de 'good', use 'excellent', 'great', 'wonderful'"
  ]
}
```

**Note**: AI correction is stored with `graded_by: 'ai'`. Teacher can review and override before student sees it (configurable per teacher plan).

### AI-006: AI Assistant Chat (Future)

- Chat interface with streaming responses
- Access to teacher's turmas, students, content, metrics
- Capabilities: generate content, analyze performance, suggest improvements
- Portuguese, friendly tone
- Tool use for structured actions

### AI-007: Content Suggestions (Future)

- Suggests movies, series, music relevant to student level
- Generates ready-to-publish blog post drafts

## Rate Limits

| Feature | Free Plan | Pro Plan |
|---------|-----------|----------|
| Task generations/day | 5 | 50 |
| Chat messages/session | — | 30 |
| TTS generations/day | 2 | 10 |
| Writing corrections | Teacher manual only | Auto AI + teacher review |

## Cost Estimates (12 students)

| Feature | Monthly Cost |
|---------|-------------|
| Quiz generation | ~$0.20 |
| Writing prompts | ~$0.50 |
| Writing correction | ~$0.50 |
| TTS | ~$0.10 |
| Chat | ~$0.30 |
| **Total** | **~$1.50** |

## Implementation

All AI services live in `src/lib/services/ai/`:

```
src/lib/services/ai/
├── groq.ts       → Groq client, generateQuiz, generateFillGaps,
│                    generateWritingPrompt, correctWriting
└── gemini.ts     → Gemini client, generateTTS, transcribeAudio
```

Server Actions in `src/app/(teacher)/tasks/` call these services. Route Handlers in `src/app/api/ai/` handle binary data (TTS/STT).
