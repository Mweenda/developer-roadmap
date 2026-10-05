import { nextReviewAt } from '../data/learning-model.js';
import { createFileJsonIo } from './json-io.js';

const DEFAULT_USER = 'default';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function emptyState() {
  return {
    completed: [],
    topics: [],
    exercises: {},
    quizzes: {},
    misses: {},
    reviews: {},
    projectReviews: {},
    hints: {},
    learner: null,
    updatedAt: null,
  };
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

export function createProgressStore(filePath, validPhaseIds, catalog = {}, { jsonIo } = {}) {
  const validIds = new Set(validPhaseIds);
  const validTopicIds = new Set(catalog.topicIds ?? []);
  const validExerciseIds = new Set(catalog.exerciseIds ?? []);
  const validQuizIds = new Set(catalog.quizIds ?? validPhaseIds);
  let writeQueue = Promise.resolve();
  const io = jsonIo ?? createFileJsonIo(filePath);

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

  function parseFile(parsed) {
    if (isPlainObject(parsed?.byUser)) {
      const byUser = {};
      for (const [id, value] of Object.entries(parsed.byUser)) {
        if (!isPlainObject(value)) continue;
        byUser[id] = sanitize(value);
      }
      return { byUser };
    }
    return { byUser: {} };
  }

  async function readFileState() {
    const parsed = await io.read();
    if (!parsed) return { byUser: {} };
    return parseFile(parsed);
  }

  async function writeFileState(next) {
    return io.write(next);
  }

  function enqueue(work) {
    const operation = writeQueue.then(work);
    writeQueue = operation.catch(() => {});
    return operation;
  }

  function accountId(userId) {
    return userId || DEFAULT_USER;
  }

  async function get(userId = DEFAULT_USER) {
    await writeQueue;
    if (userId === null) return emptyState();
    const file = await readFileState();
    return file.byUser[accountId(userId)] ?? emptyState();
  }

  function mutate(userId, updater) {
    const id = accountId(userId);
    return enqueue(async () => {
      const file = await readFileState();
      const current = file.byUser[id] ?? emptyState();
      const next = updater(current);
      file.byUser[id] = { ...next, updatedAt: new Date().toISOString() };
      await writeFileState(file);
      return file.byUser[id];
    });
  }

  async function update(phaseId, completed, userId = DEFAULT_USER) {
    if (!validIds.has(phaseId)) throw invalid('INVALID_PHASE', `Unknown phase: ${phaseId}`);
    if (typeof completed !== 'boolean') throw invalid('INVALID_COMPLETED', 'completed must be a boolean');
    return mutate(userId, (current) => {
      const ids = new Set(current.completed);
      if (completed) ids.add(phaseId);
      else ids.delete(phaseId);
      return { ...current, completed: [...ids] };
    });
  }

  async function completeTopic(topicId, completed, userId = DEFAULT_USER) {
    if (!validTopicIds.has(topicId)) throw invalid('INVALID_TOPIC', `Unknown topic: ${topicId}`);
    if (typeof completed !== 'boolean') throw invalid('INVALID_COMPLETED', 'completed must be a boolean');
    return mutate(userId, (current) => {
      const ids = new Set(current.topics);
      if (completed) ids.add(topicId);
      else ids.delete(topicId);
      return { ...current, topics: [...ids] };
    });
  }

  async function recordExercise(exerciseId, { completed, passed }, userId = DEFAULT_USER) {
    if (!validExerciseIds.has(exerciseId)) throw invalid('INVALID_EXERCISE', `Unknown exercise: ${exerciseId}`);
    if (typeof completed !== 'boolean') throw invalid('INVALID_COMPLETED', 'completed must be a boolean');
    return mutate(userId, (current) => {
      const existing = current.exercises[exerciseId] ?? { completed: false, passed: false, attempts: 0 };
      return {
        ...current,
        exercises: {
          ...current.exercises,
          [exerciseId]: {
            completed,
            passed: Boolean(passed),
            attempts: existing.attempts + 1,
          },
        },
      };
    });
  }

  async function recordQuiz(quizId, { score, passed, missed = [] }, userId = DEFAULT_USER) {
    if (!validQuizIds.has(quizId)) throw invalid('INVALID_QUIZ', `Unknown quiz: ${quizId}`);
    if (!Number.isInteger(score)) throw invalid('INVALID_SCORE', 'score must be an integer');
    return mutate(userId, (current) => {
      const existing = current.quizzes[quizId] ?? { score: 0, passed: false, attempts: 0, missed: [] };
      const attempts = existing.attempts + 1;
      const quiz = {
        score,
        passed: Boolean(passed),
        attempts,
        missed: Array.isArray(missed) ? missed.filter((item) => typeof item === 'string') : [],
      };
      return {
        ...current,
        quizzes: { ...current.quizzes, [quizId]: quiz },
        misses: { ...current.misses, [quizId]: quiz.missed },
        reviews: { ...current.reviews, [quizId]: nextReviewAt(Boolean(passed), attempts) },
      };
    });
  }

  async function setLearner(name, userId = DEFAULT_USER) {
    if (typeof name !== 'string') throw invalid('INVALID_LEARNER', 'name must be a string');
    const trimmed = name.trim();
    if (!trimmed) throw invalid('INVALID_LEARNER', 'name is required');
    return mutate(userId, (current) => ({ ...current, learner: { name: trimmed.slice(0, 80) } }));
  }

  async function recordHint(exerciseId, level, userId = DEFAULT_USER) {
    return mutate(userId, (current) => {
      const used = Number(current.hints[exerciseId] ?? 0);
      return { ...current, hints: { ...current.hints, [exerciseId]: Math.max(used, Number(level) || 0) } };
    });
  }

  async function recordProjectReview(projectId, review, userId = DEFAULT_USER) {
    return mutate(userId, (current) => ({
      ...current,
      projectReviews: { ...current.projectReviews, [projectId]: review },
    }));
  }

  return { get, update, completeTopic, recordExercise, recordQuiz, setLearner, recordHint, recordProjectReview };
}
