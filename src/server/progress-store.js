import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { nextReviewAt } from '../data/learning-model.js';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeLearner(value) {
  if (!isPlainObject(value) || typeof value.name !== 'string') return null;
  const name = value.name.trim();
  return name ? { name: name.slice(0, 80) } : null;
}

function sanitizeMisses(value, validIds) {
  const misses = {};
  for (const [id, items] of Object.entries(value)) {
    if (!validIds.has(id) || !Array.isArray(items)) continue;
    misses[id] = items.filter((item) => typeof item === 'string');
  }
  return misses;
}

function sanitizeReviews(value, validIds) {
  const reviews = {};
  for (const [id, date] of Object.entries(value)) {
    if (!validIds.has(id) || typeof date !== 'string') continue;
    reviews[id] = date;
  }
  return reviews;
}

export function createProgressStore(filePath, validPhaseIds, catalog = {}) {
  const validIds = new Set(validPhaseIds);
  const validTopicIds = new Set(catalog.topicIds ?? []);
  const validExerciseIds = new Set(catalog.exerciseIds ?? []);
  const validQuizIds = new Set(catalog.quizIds ?? validPhaseIds);
  let writeQueue = Promise.resolve();

  function invalid(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function sanitize(parsed) {
    const completed = Array.isArray(parsed.completed)
      ? [...new Set(parsed.completed.filter((id) => validIds.has(id)))]
      : [];
    const topics = Array.isArray(parsed.topics)
      ? [...new Set(parsed.topics.filter((id) => validTopicIds.has(id)))]
      : [];
    const exercises = {};
    if (isPlainObject(parsed.exercises)) {
      for (const [id, value] of Object.entries(parsed.exercises)) {
        if (!validExerciseIds.has(id) || !isPlainObject(value)) continue;
        exercises[id] = {
          completed: Boolean(value.completed),
          passed: Boolean(value.passed),
          attempts: Number.isInteger(value.attempts) ? value.attempts : 0,
        };
      }
    }
    const quizzes = {};
    if (isPlainObject(parsed.quizzes)) {
      for (const [id, value] of Object.entries(parsed.quizzes)) {
        if (!validQuizIds.has(id) || !isPlainObject(value)) continue;
        quizzes[id] = {
          score: Number.isInteger(value.score) ? value.score : 0,
          passed: Boolean(value.passed),
          attempts: Number.isInteger(value.attempts) ? value.attempts : 0,
          missed: Array.isArray(value.missed) ? value.missed.filter((item) => typeof item === 'string') : [],
        };
      }
    }
    return {
      completed,
      topics,
      exercises,
      quizzes,
      misses: isPlainObject(parsed.misses) ? sanitizeMisses(parsed.misses, validIds) : {},
      reviews: isPlainObject(parsed.reviews) ? sanitizeReviews(parsed.reviews, validIds) : {},
      projectReviews: isPlainObject(parsed.projectReviews) ? parsed.projectReviews : {},
      hints: isPlainObject(parsed.hints) ? parsed.hints : {},
      learner: sanitizeLearner(parsed.learner),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
    };
  }

  async function read() {
    try {
      return sanitize(JSON.parse(await readFile(filePath, 'utf8')));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { completed: [], topics: [], exercises: {}, quizzes: {}, misses: {}, reviews: {}, projectReviews: {}, hints: {}, learner: null, updatedAt: null };
      }
      throw error;
    }
  }

  async function write(next) {
    await mkdir(dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    await rename(tempPath, filePath);
    return next;
  }

  function enqueue(work) {
    const operation = writeQueue.then(work);
    writeQueue = operation.catch(() => {});
    return operation;
  }

  async function get() {
    await writeQueue;
    return read();
  }

  async function update(phaseId, completed) {
    if (!validIds.has(phaseId)) throw invalid('INVALID_PHASE', `Unknown phase: ${phaseId}`);
    if (typeof completed !== 'boolean') throw invalid('INVALID_COMPLETED', 'completed must be a boolean');
    return enqueue(async () => {
      const current = await read();
      const ids = new Set(current.completed);
      if (completed) ids.add(phaseId);
      else ids.delete(phaseId);
      return write({ ...current, completed: [...ids], updatedAt: new Date().toISOString() });
    });
  }

  async function completeTopic(topicId, completed) {
    if (!validTopicIds.has(topicId)) throw invalid('INVALID_TOPIC', `Unknown topic: ${topicId}`);
    if (typeof completed !== 'boolean') throw invalid('INVALID_COMPLETED', 'completed must be a boolean');
    return enqueue(async () => {
      const current = await read();
      const ids = new Set(current.topics);
      if (completed) ids.add(topicId);
      else ids.delete(topicId);
      return write({ ...current, topics: [...ids], updatedAt: new Date().toISOString() });
    });
  }

  async function recordExercise(exerciseId, { completed, passed }) {
    if (!validExerciseIds.has(exerciseId)) throw invalid('INVALID_EXERCISE', `Unknown exercise: ${exerciseId}`);
    if (typeof completed !== 'boolean') throw invalid('INVALID_COMPLETED', 'completed must be a boolean');
    return enqueue(async () => {
      const current = await read();
      const existing = current.exercises[exerciseId] ?? { completed: false, passed: false, attempts: 0 };
      current.exercises[exerciseId] = {
        completed,
        passed: Boolean(passed),
        attempts: existing.attempts + 1,
      };
      return write({ ...current, updatedAt: new Date().toISOString() });
    });
  }

  async function recordQuiz(quizId, { score, passed, missed = [] }) {
    if (!validQuizIds.has(quizId)) throw invalid('INVALID_QUIZ', `Unknown quiz: ${quizId}`);
    if (!Number.isInteger(score)) throw invalid('INVALID_SCORE', 'score must be an integer');
    return enqueue(async () => {
      const current = await read();
      const existing = current.quizzes[quizId] ?? { score: 0, passed: false, attempts: 0, missed: [] };
      const attempts = existing.attempts + 1;
      current.quizzes[quizId] = {
        score,
        passed: Boolean(passed),
        attempts,
        missed: Array.isArray(missed) ? missed.filter((item) => typeof item === 'string') : [],
      };
      current.misses[quizId] = current.quizzes[quizId].missed;
      current.reviews[quizId] = nextReviewAt(Boolean(passed), attempts);
      return write({ ...current, updatedAt: new Date().toISOString() });
    });
  }

  async function setLearner(name) {
    if (typeof name !== 'string') throw invalid('INVALID_LEARNER', 'name must be a string');
    const trimmed = name.trim();
    if (!trimmed) throw invalid('INVALID_LEARNER', 'name is required');
    return enqueue(async () => {
      const current = await read();
      return write({ ...current, learner: { name: trimmed.slice(0, 80) }, updatedAt: new Date().toISOString() });
    });
  }

  async function recordHint(exerciseId, level) {
    return enqueue(async () => {
      const current = await read();
      const used = Number(current.hints[exerciseId] ?? 0);
      current.hints[exerciseId] = Math.max(used, Number(level) || 0);
      return write({ ...current, updatedAt: new Date().toISOString() });
    });
  }

  async function recordProjectReview(projectId, review) {
    return enqueue(async () => {
      const current = await read();
      current.projectReviews[projectId] = review;
      return write({ ...current, updatedAt: new Date().toISOString() });
    });
  }

  return { get, update, completeTopic, recordExercise, recordQuiz, setLearner, recordHint, recordProjectReview };
}
