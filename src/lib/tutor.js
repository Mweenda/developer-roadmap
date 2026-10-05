import { getPhaseById, getExerciseById, getTopicById } from '../data/phases.js';
import { libraryForPhase } from '../data/library.js';
import { tutor, TUTOR_RULES } from '../data/tutor.js';

const OFF_TOPIC = /\b(recipe|pasta|celebrity|lottery|who won|crypto price|stock pick|vote for|medical diagnos|dating advice)\b/i;
const SPOILER = /\b(give me the (answer|solution)|what is the (correct )?answer|solve (this|it) for me|paste the (code|solution)|quiz answers?)\b/i;

function invalid(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function isOnCurriculum(question, phase) {
  if (OFF_TOPIC.test(question)) return false;
  if (phase) return true;
  return /\b(javascript|node|express|react|html|css|http|sql|git|function|array|promise|async|dom|api)\b/i.test(question);
}

export function wantsSpoiler(question) {
  return SPOILER.test(question);
}

export function buildTutorRequest({ question, phaseId, topicId, exerciseId } = {}) {
  if (typeof question !== 'string' || question.trim().length < 3) {
    throw invalid('INVALID_QUESTION', 'Ask a short question about what you are learning.');
  }
  const text = question.trim();
  if (text.length > 2000) throw invalid('INVALID_QUESTION', 'Question is too long.');

  const fromExercise = exerciseId ? getExerciseById(exerciseId) : null;
  const fromTopic = topicId ? getTopicById(topicId) : null;
  const phase = getPhaseById(phaseId) ?? fromExercise?.phase ?? fromTopic?.phase ?? getPhaseById('javascript-core');
  const topic = fromTopic?.topic ?? phase.topics.find((item) => item.id === topicId) ?? null;
  const exercise = fromExercise?.exercise ?? phase.exercises.find((item) => item.id === exerciseId) ?? null;
  const library = libraryForPhase(phase.id);

  if (!isOnCurriculum(text, phase) || OFF_TOPIC.test(text)) {
    return { skipModel: true, reply: tutor.offCurriculum, phaseId: phase.id };
  }
  if (wantsSpoiler(text)) {
    return { skipModel: true, reply: tutor.noSpoiler, phaseId: phase.id };
  }

  const docs = library.sources.map((source) => `${source.title} (${source.url}) — ${source.summary}`).join('\n');
  const system = [
    'You are the Fieldnotes software-engineering apprenticeship tutor.',
    ...TUTOR_RULES,
    `Current chapter: ${phase.title}.`,
    `Chapter summary: ${phase.summary}`,
    `Learners should be able to: ${(phase.expected ?? []).join('; ')}`,
    `Lessons in this chapter: ${phase.topics.map((item) => item.title).join(', ')}`,
    library.use ? `How to use docs now: ${library.use}` : '',
    library.skip ? `Do not send them to: ${library.skip}` : '',
    docs ? `Official documentation for this chapter:\n${docs}` : '',
    topic ? `They are on the lesson “${topic.title}”: ${topic.summary}` : '',
    exercise ? `They are on the exercise “${exercise.title}”: ${exercise.prompt}. Guide; do not solve.` : '',
    'Reply in short paragraphs. End with one question that makes them think.',
  ].filter(Boolean).join('\n');

  return { skipModel: false, system, user: text, phaseId: phase.id };
}

function readGeminiText(body) {
  const text = body?.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join('\n');
  return text?.trim() || '';
}

export const GEMINI_FALLBACKS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

function modelQueue(preferred) {
  return [...new Set([preferred, ...GEMINI_FALLBACKS].filter(Boolean))];
}

export async function askTutor(payload, {
  apiKey,
  model = GEMINI_FALLBACKS[0],
  fetchImpl = fetch,
  generate,
} = {}) {
  const built = buildTutorRequest(payload);
  if (built.skipModel) {
    return { text: built.reply, guided: true, source: 'policy', phaseId: built.phaseId };
  }
  if (generate) {
    const text = String(await generate({ system: built.system, prompt: built.user, model }) ?? '').trim();
    if (text) return { text, guided: true, source: 'genkit', phaseId: built.phaseId, model };
  }
  if (!apiKey) throw invalid('TUTOR_UNAVAILABLE', tutor.unavailable);

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: built.system }] },
    contents: [{ role: 'user', parts: [{ text: built.user }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
  });

  let lastStatus = 0;
  for (const id of modelQueue(model)) {
    const response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${id}:generateContent`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: requestBody,
    });
    lastStatus = response.status;
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) break;
      continue;
    }
    const body = await response.json();
    const text = readGeminiText(body);
    if (text) return { text, guided: true, source: 'gemini', phaseId: built.phaseId, model: id };
  }

  if (lastStatus === 401 || lastStatus === 403) {
    throw invalid('TUTOR_UNAVAILABLE', tutor.unavailable);
  }
  throw invalid('TUTOR_UNAVAILABLE', 'The tutor could not reach the model. Try again in a moment.');
}
