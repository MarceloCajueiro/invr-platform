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

const lessonIds = [uuid(), uuid(), uuid(), uuid(), uuid()];
const taskIds = [uuid(), uuid(), uuid(), uuid()];
const postIds = [uuid(), uuid(), uuid()];
const submissionIds = [uuid(), uuid()];

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
sql(`INSERT INTO students (id, user_id, teacher_id, xp, current_streak, longest_streak, created_at, updated_at) VALUES ('${studentId}', '${studentUserId}', '${teacherId}', 250, 5, 12, ${ts}, ${ts})`);

// ============================================================
// Invitation (accepted)
// ============================================================
sql(`INSERT INTO invitations (id, email, token, teacher_id, expires_at, accepted_at, created_at) VALUES ('${invitationId}', 'marcelo@fluent.app', '${uuid()}', '${teacherId}', ${ts + 86400}, ${ts}, ${ts})`);

// ============================================================
// Lessons
// ============================================================
console.log("Creating lessons...");
const lessonsData = [
  { title: "Introduction to Present Simple", category: "grammar", desc: "Learn when and how to use the Present Simple tense in English. We cover affirmative, negative, and question forms.", duration: 15, status: "published", pos: 1 },
  { title: "Ordering Food at a Restaurant", category: "conversation", desc: "Practice common phrases and vocabulary for ordering food, asking for the bill, and making special requests.", duration: 20, status: "published", pos: 2 },
  { title: "Daily Routine Vocabulary", category: "vocabulary", desc: "Essential words and phrases to describe your daily routine: wake up, get dressed, commute, have lunch, etc.", duration: 12, status: "published", pos: 3 },
  { title: "Listening Practice: The Weather", category: "listening", desc: "Listen to weather forecasts and practice understanding temperatures, conditions, and predictions.", duration: 10, status: "published", pos: 4 },
  { title: "British vs American English", category: "culture", desc: "Explore the differences between British and American English in vocabulary, spelling, and pronunciation.", duration: 18, status: "draft", pos: 5 },
];

lessonsData.forEach((l, i) => {
  const videoUrl = i === 0 ? "'https://www.youtube.com/watch?v=dQw4w9WgXcQ'" : "NULL";
  sql(`INSERT INTO lessons (id, teacher_id, title, description, category, video_url, duration_minutes, status, position, created_at, updated_at) VALUES ('${lessonIds[i]}', '${teacherId}', '${l.title}', '${l.desc}', '${l.category}', ${videoUrl}, ${l.duration}, '${l.status}', ${l.pos}, ${ts - (5 - i) * 86400}, ${ts})`);
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

sql(`INSERT INTO tasks (id, teacher_id, title, description, task_type, questions, level, status, ai_generated, created_at, updated_at) VALUES ('${taskIds[0]}', '${teacherId}', 'Present Simple Quiz', 'Test your knowledge of Present Simple tense.', 'quiz', '${quizQuestions.replace(/'/g, "''")}', 'beginner', 'published', 0, ${ts - 3 * 86400}, ${ts})`);
sql(`INSERT INTO tasks (id, teacher_id, title, description, task_type, questions, level, status, ai_generated, created_at, updated_at) VALUES ('${taskIds[1]}', '${teacherId}', 'Daily Routine - Fill the Gaps', 'Complete the sentences about daily routines.', 'fill_gaps', '${fillGapQuestions.replace(/'/g, "''")}', 'beginner', 'published', 0, ${ts - 2 * 86400}, ${ts})`);
sql(`INSERT INTO tasks (id, teacher_id, title, description, task_type, questions, level, status, ai_generated, created_at, updated_at) VALUES ('${taskIds[2]}', '${teacherId}', 'Describe Your Morning', 'Write about your morning routine.', 'writing', '${writingPrompt.replace(/'/g, "''")}', 'beginner', 'published', 0, ${ts - 86400}, ${ts})`);
sql(`INSERT INTO tasks (id, teacher_id, title, description, task_type, questions, level, status, ai_generated, created_at, updated_at) VALUES ('${taskIds[3]}', '${teacherId}', 'Weather Forecast Listening', 'Listen and answer questions about the weather.', 'listening', '${listeningData.replace(/'/g, "''")}', 'intermediate', 'published', 0, ${ts}, ${ts})`);

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
  { title: "5 Dicas para Melhorar seu Listening", slug: "5-dicas-listening", category: "tips", content: "# 5 Dicas para Melhorar seu Listening\n\n## 1. Ouça podcasts em inglês\nComece com podcasts para aprendizes como **6 Minute English** da BBC.\n\n## 2. Assista séries com legendas em inglês\nNão use legendas em português! Comece com legendas em inglês.\n\n## 3. Repita frases em voz alta\nShadowing é uma técnica poderosa para melhorar pronúncia e compreensão.\n\n## 4. Ouça a mesma coisa várias vezes\nRepetição é chave. Ouça o mesmo episódio 2-3 vezes.\n\n## 5. Anote palavras novas\nMantenha um caderno de vocabulário novo.", featured: true, views: 42 },
  { title: "Verbos Irregulares Mais Comuns", slug: "verbos-irregulares-comuns", category: "grammar", content: "# Verbos Irregulares Mais Comuns\n\n| Base | Past | Past Participle |\n|------|------|---|\n| be | was/were | been |\n| go | went | gone |\n| have | had | had |\n| do | did | done |\n| say | said | said |", featured: false, views: 28 },
  { title: "Filmes para Praticar Inglês", slug: "filmes-praticar-ingles", category: "culture", content: "# Filmes para Praticar Inglês\n\n## Para Iniciantes\n- **Toy Story** - vocabulário simples, diálogos claros\n- **Finding Nemo** - ótimo para pronúncia\n\n## Para Intermediários\n- **The Social Network** - inglês moderno\n- **The Intern** - vocabulário profissional", featured: false, views: 15 },
];

postsData.forEach((p, i) => {
  sql(`INSERT INTO posts (id, teacher_id, title, slug, content, category, featured, status, view_count, created_at, updated_at) VALUES ('${postIds[i]}', '${teacherId}', '${p.title}', '${p.slug}', '${p.content.replace(/'/g, "''")}', '${p.category}', ${p.featured ? 1 : 0}, 'published', ${p.views}, ${ts - (3 - i) * 86400}, ${ts})`);
});

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
