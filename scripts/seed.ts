/**
 * Seed script for local development
 * Run: npx tsx scripts/seed.ts
 *
 * Creates a teacher with lessons, tasks, posts, turmas, and a student.
 * Uses wrangler D1 local database directly via execFileSync (safe, no shell injection).
 */

import { execFileSync } from "child_process";

const DB = "fluent-db";

function sql(query: string) {
  try {
    execFileSync("npx", ["wrangler", "d1", "execute", DB, "--local", "--command", query], {
      stdio: "pipe",
    });
  } catch (e: any) {
    console.error(`Failed: ${query.substring(0, 80)}...`);
    console.error(e.stderr?.toString() || e.message);
  }
}

function uuid() {
  return crypto.randomUUID();
}

function now() {
  return Math.floor(Date.now() / 1000);
}

// ============================================================
// IDs
// ============================================================
const teacherUserId = uuid();
const teacherId = uuid();
const studentUserId = uuid();
const studentId = uuid();
const turmaId = uuid();
const invitationId = uuid();

const lessonIds = [uuid(), uuid(), uuid(), uuid(), uuid(), uuid()];
const taskIds = [uuid(), uuid(), uuid(), uuid()];
const postIds = [uuid(), uuid(), uuid()];
const submissionIds = [uuid(), uuid()];
const challengeIds = [uuid(), uuid()];
const challengeResponseId = uuid();

const ts = now();

console.log("Seeding Fluent database...\n");

// ============================================================
// Teacher User + Profile
// ============================================================
// better-auth uses scrypt, not bcrypt. Generate hash at seed time.
let passwordHash: string;

async function generateHash() {
  const { hashPassword } = await import("better-auth/crypto");
  passwordHash = await hashPassword("senha12345");
}

async function main() {
  await generateHash();
  console.log("Creating teacher...");

sql(`INSERT INTO user (id, name, email, emailVerified, role, createdAt, updatedAt) VALUES ('${teacherUserId}', 'Franciely Silva', 'fran@fluent.app', 0, 'teacher', ${ts}, ${ts})`);
sql(`INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt) VALUES ('${uuid()}', '${teacherUserId}', 'credential', '${teacherUserId}', '${passwordHash}', ${ts}, ${ts})`);
sql(`INSERT INTO teachers (id, user_id, plan, created_at, updated_at) VALUES ('${teacherId}', '${teacherUserId}', 'pro', ${ts}, ${ts})`);

// ============================================================
// Student User + Profile
// ============================================================
console.log("Creating student...");
sql(`INSERT INTO user (id, name, email, emailVerified, role, createdAt, updatedAt) VALUES ('${studentUserId}', 'Marcelo Aluno', 'marcelo@fluent.app', 0, 'student', ${ts}, ${ts})`);
sql(`INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt) VALUES ('${uuid()}', '${studentUserId}', 'credential', '${studentUserId}', '${passwordHash}', ${ts}, ${ts})`);
sql(`INSERT INTO students (id, user_id, teacher_id, created_at, updated_at) VALUES ('${studentId}', '${studentUserId}', '${teacherId}', ${ts}, ${ts})`);

// ============================================================
// Invitation (accepted)
// ============================================================
sql(`INSERT INTO invitations (id, email, token, teacher_id, expires_at, accepted_at, created_at) VALUES ('${invitationId}', 'marcelo@fluent.app', '${uuid()}', '${teacherId}', ${ts + 86400}, ${ts}, ${ts})`);

// ============================================================
// Lessons
// ============================================================
console.log("Creating lessons...");
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
  {
    title: "Future Scheduled Lesson",
    category: "conversation",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "This lesson is scheduled to go live three days from seed time." }] },
      ],
    }),
    duration: 10,
    status: "published",
    pos: 6,
  },
];

lessonsData.forEach((l, i) => {
  const isFuture = i === 5;
  const lessonCreatedAt = isFuture ? ts : ts - (5 - i) * 86400;
  const lessonPublishedAt = isFuture ? ts + 3 * 86400 : lessonCreatedAt;
  sql(`INSERT INTO lessons (id, teacher_id, title, content, category, duration_minutes, status, position, published_at, created_at, updated_at) VALUES ('${lessonIds[i]}', '${teacherId}', '${l.title}', '${l.content.replace(/'/g, "''")}', '${l.category}', ${l.duration}, '${l.status}', ${l.pos}, ${lessonPublishedAt}, ${lessonCreatedAt}, ${ts})`);
});

// ============================================================
// Lesson Progress (student watched some)
// ============================================================
console.log("Creating lesson progress...");
sql(`INSERT INTO lesson_progresses (id, student_id, lesson_id, progress, watched_at, created_at, updated_at) VALUES ('${uuid()}', '${studentId}', '${lessonIds[0]}', 100, ${ts - 86400}, ${ts - 86400}, ${ts - 86400})`);
sql(`INSERT INTO lesson_progresses (id, student_id, lesson_id, progress, watched_at, created_at, updated_at) VALUES ('${uuid()}', '${studentId}', '${lessonIds[1]}', 60, NULL, ${ts - 43200}, ${ts - 43200})`);

// ============================================================
// Tasks
// ============================================================
console.log("Creating tasks...");

const quizQuestions = JSON.stringify([
  { number: 1, text: "She ___ to school every day.", options: [{ letter: "a", text: "go", correct: false }, { letter: "b", text: "goes", correct: true }, { letter: "c", text: "going", correct: false }, { letter: "d", text: "gone", correct: false }], explanation: "Third person singular uses 'goes'." },
  { number: 2, text: "They ___ like coffee.", options: [{ letter: "a", text: "doesn't", correct: false }, { letter: "b", text: "don't", correct: true }, { letter: "c", text: "isn't", correct: false }, { letter: "d", text: "aren't", correct: false }], explanation: "'They' uses 'don't' for negation." },
  { number: 3, text: "___ you speak English?", options: [{ letter: "a", text: "Does", correct: false }, { letter: "b", text: "Do", correct: true }, { letter: "c", text: "Is", correct: false }, { letter: "d", text: "Are", correct: false }], explanation: "'Do' is used with 'you' in questions." },
]);

const fillGapQuestions = JSON.stringify([
  { number: 1, text: "I usually ______ (wake up) at 7 AM.", answer: "wake up", alternatives: ["wake up"], explanation: "Simple present for routines." },
  { number: 2, text: "She ______ (have) breakfast at 8.", answer: "has", alternatives: ["has"], explanation: "Third person: have -> has." },
  { number: 3, text: "We ______ (not/watch) TV in the morning.", answer: "don't watch", alternatives: ["do not watch", "don't watch"], explanation: "Negative with don't + base form." },
]);

const writingPrompt = JSON.stringify({
  prompt: "Write a short paragraph (60-80 words) describing your typical morning routine. Use Present Simple tense.",
  instructions: "Include at least 5 different verbs. Mention times if possible.",
});

const listeningData = JSON.stringify({
  text: "Good morning! Today will be sunny with temperatures around 25 degrees. In the afternoon, expect some clouds. Tomorrow will be rainy, so bring an umbrella!",
  questions: [
    { number: 1, text: "What will the weather be like today?", options: [{ letter: "a", text: "Rainy", correct: false }, { letter: "b", text: "Sunny", correct: true }, { letter: "c", text: "Snowy", correct: false }, { letter: "d", text: "Windy", correct: false }], explanation: "The forecast says 'sunny with temperatures around 25 degrees'." },
  ],
});

sql(`INSERT INTO tasks (id, teacher_id, title, description, task_type, questions, level, status, ai_generated, is_homework, published_at, created_at, updated_at) VALUES ('${taskIds[0]}', '${teacherId}', 'Present Simple Quiz', 'Test your knowledge of Present Simple tense.', 'quiz', '${quizQuestions.replace(/'/g, "''")}', 'beginner', 'published', 0, 1, ${ts - 3 * 86400}, ${ts - 3 * 86400}, ${ts})`);
sql(`INSERT INTO tasks (id, teacher_id, title, description, task_type, questions, level, status, ai_generated, published_at, created_at, updated_at) VALUES ('${taskIds[1]}', '${teacherId}', 'Daily Routine - Fill the Gaps', 'Complete the sentences about daily routines.', 'fill_gaps', '${fillGapQuestions.replace(/'/g, "''")}', 'beginner', 'published', 0, ${ts - 2 * 86400}, ${ts - 2 * 86400}, ${ts})`);
sql(`INSERT INTO tasks (id, teacher_id, title, description, task_type, questions, level, status, ai_generated, published_at, created_at, updated_at) VALUES ('${taskIds[2]}', '${teacherId}', 'Describe Your Morning', 'Write about your morning routine.', 'writing', '${writingPrompt.replace(/'/g, "''")}', 'beginner', 'published', 0, ${ts - 86400}, ${ts - 86400}, ${ts})`);
sql(`INSERT INTO tasks (id, teacher_id, title, description, task_type, questions, level, status, ai_generated, published_at, created_at, updated_at) VALUES ('${taskIds[3]}', '${teacherId}', 'Weather Forecast Listening', 'Listen and answer questions about the weather.', 'listening', '${listeningData.replace(/'/g, "''")}', 'intermediate', 'published', 0, ${ts}, ${ts}, ${ts})`);

// ============================================================
// Submissions (student completed quiz and fill-gaps)
// ============================================================
console.log("Creating submissions...");
const quizAnswers = JSON.stringify({
  "1": "b",
  "2": "b",
  "3": "b",
});
sql(`INSERT INTO submissions (id, student_id, task_id, answers, score, feedback, graded_by, status, created_at, updated_at) VALUES ('${submissionIds[0]}', '${studentId}', '${taskIds[0]}', '${quizAnswers.replace(/'/g, "''")}', 100, 'Perfeito! Todas as respostas corretas.', 'auto', 'graded', ${ts - 86400}, ${ts - 86400})`);

const fillAnswers = JSON.stringify({
  "1": "wake up",
  "2": "has",
  "3": "dont watch",
});
sql(`INSERT INTO submissions (id, student_id, task_id, answers, score, feedback, graded_by, status, created_at, updated_at) VALUES ('${submissionIds[1]}', '${studentId}', '${taskIds[1]}', '${fillAnswers.replace(/'/g, "''")}', 67, NULL, 'auto', 'graded', ${ts - 43200}, ${ts - 43200})`);

// ============================================================
// Posts
// ============================================================
console.log("Creating posts...");
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
  const postCreatedAt = ts - (3 - i) * 86400;
  sql(`INSERT INTO posts (id, teacher_id, title, slug, content, category, featured, status, view_count, published_at, created_at, updated_at) VALUES ('${postIds[i]}', '${teacherId}', '${p.title}', '${p.slug}', '${p.content.replace(/'/g, "''")}', '${p.category}', ${p.featured ? 1 : 0}, 'published', ${p.views}, ${postCreatedAt}, ${postCreatedAt}, ${ts})`);
});

// ============================================================
// Challenges
// ============================================================
console.log("Creating challenges...");

const challengeDesc1 = JSON.stringify({
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Escreva sobre a sua rotina diária em inglês e anexe uma foto do seu dia!" }] },
    { type: "paragraph", content: [{ type: "text", text: "Use Present Simple e inclua pelo menos 5 verbos diferentes." }] },
  ],
});

const challengeDesc2 = JSON.stringify({
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Grave um áudio de 30 segundos desejando Feliz Natal em inglês para um amigo." }] },
    { type: "paragraph", content: [{ type: "text", text: "Tente usar expressões como: Merry Christmas, Happy Holidays, Season's Greetings." }] },
  ],
});

const futureDue = ts + 7 * 86400; // 7 days from now

sql(`INSERT INTO challenges (id, teacher_id, title, description, cover_image_url, due_date, status, published_at, created_at, updated_at) VALUES ('${challengeIds[0]}', '${teacherId}', 'My Daily Routine', '${challengeDesc1.replace(/'/g, "''")}', NULL, ${futureDue}, 'published', ${ts - 2 * 86400}, ${ts - 2 * 86400}, ${ts})`);
sql(`INSERT INTO challenges (id, teacher_id, title, description, cover_image_url, due_date, status, published_at, created_at, updated_at) VALUES ('${challengeIds[1]}', '${teacherId}', 'Merry Christmas Audio', '${challengeDesc2.replace(/'/g, "''")}', NULL, NULL, 'draft', ${ts - 86400}, ${ts - 86400}, ${ts})`);

// Challenge response from student
sql(`INSERT INTO challenge_responses (id, challenge_id, student_id, content, attachments, created_at, updated_at) VALUES ('${challengeResponseId}', '${challengeIds[0]}', '${studentId}', 'Every day I wake up at 7 AM. I have breakfast and then I go to work. I usually eat lunch at noon. In the evening I watch TV and go to bed at 11 PM.', NULL, ${ts - 86400}, ${ts - 86400})`);

// ============================================================
// Turma
// ============================================================
console.log("Creating turma...");
sql(`INSERT INTO turmas (id, teacher_id, name, description, color, level, invite_code, notify_new_lesson, notify_new_task, created_at, updated_at) VALUES ('${turmaId}', '${teacherId}', 'Turma Iniciante 2026', 'Turma para alunos iniciantes, aulas às terças e quintas.', '#6c5ce7', 'beginner', 'FLU001', 1, 1, ${ts}, ${ts})`);

// Link student to turma
sql(`INSERT INTO turma_students (id, turma_id, student_id, created_at) VALUES ('${uuid()}', '${turmaId}', '${studentId}', ${ts})`);

// Link lessons and tasks to turma
lessonIds.slice(0, 3).forEach(lid => {
  sql(`INSERT INTO turma_lessons (id, turma_id, lesson_id, created_at) VALUES ('${uuid()}', '${turmaId}', '${lid}', ${ts})`);
});
taskIds.slice(0, 2).forEach(tid => {
  sql(`INSERT INTO turma_tasks (id, turma_id, task_id, created_at) VALUES ('${uuid()}', '${turmaId}', '${tid}', ${ts})`);
});
// Link posts to turma
postIds.forEach(pid => {
  sql(`INSERT INTO turma_posts (id, turma_id, post_id, created_at) VALUES ('${uuid()}', '${turmaId}', '${pid}', ${ts})`);
});
// Link challenges to turma
sql(`INSERT INTO turma_challenges (id, turma_id, challenge_id, created_at) VALUES ('${uuid()}', '${turmaId}', '${challengeIds[0]}', ${ts})`);

// ============================================================
// Done!
// ============================================================
console.log("\nSeed complete!\n");
console.log("Credentials:");
console.log("  Teacher: fran@fluent.app / senha12345");
console.log("  Student: marcelo@fluent.app / senha12345");
console.log("\nRun: npm run dev -- --port 3001");
console.log("Open: http://localhost:3001/sign-in\n");
}

main().catch(console.error);
