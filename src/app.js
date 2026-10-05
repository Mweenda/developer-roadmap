import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { phases, getPhaseById, getExerciseById, getDocById, listDocs, summarizePhase, toPublicPhase, progressCatalog } from './data/phases.js';
import { isPhaseUnlocked, previousPhaseId } from './data/learning-model.js';
import { listShell } from './data/shell.js';
import { gitWorkflow } from './data/git-workflow.js';
import { debugLab } from './data/debug-lab.js';
import { mentorHelp } from './data/mentor.js';
import { knowledgeGraph } from './data/graph.js';
import { projects } from './data/projects.js';
import { listLibrary, getLibrarySource } from './data/library.js';
import { createProgressStore } from './server/progress-store.js';
import { createJournalStore } from './server/journal-store.js';
import { createAuthStore, sessionCookie, clearSessionCookie, sessionTokenFrom } from './server/auth-store.js';
import { gradeQuiz, gradeChoiceExercise, gradeTerminalExercise } from './lib/grade.js';
import { buildLearningSnapshot } from './lib/learning.js';
import { scoreProject, REVIEW_CRITERIA } from './lib/project-review.js';
import { buildHealth } from './lib/health.js';
import { SANDBOX } from './lib/sandbox.js';
import { askTutor } from './lib/tutor.js';
import { resolveGeminiApiKey, publicRuntimeConfig } from './lib/firebase-config.js';

const rootDir = dirname(fileURLToPath(import.meta.url));

function clientError(res, error) {
  const statusByCode = {
    INVALID_PHASE: 400,
    INVALID_COMPLETED: 400,
    INVALID_TOPIC: 400,
    INVALID_EXERCISE: 400,
    INVALID_QUIZ: 400,
    INVALID_QUESTION: 400,
    INVALID_ANSWERS: 400,
    INVALID_COMMANDS: 400,
    INVALID_SCORE: 400,
    INVALID_REVIEW: 400,
    INVALID_LEVEL: 400,
    INVALID_LEARNER: 400,
    INVALID_AUTH: 400,
    UNAUTHORIZED: 401,
    CONFLICT: 409,
    INVALID_PATH: 400,
    INVALID_CONTENT: 400,
    INVALID_TYPE: 400,
    TUTOR_UNAVAILABLE: 503,
    NOT_FOUND: 404,
  };
  const status = statusByCode[error.code];
  if (!status) return false;
  res.status(status).json({ error: error.message });
  return true;
}

export function createApp({
  progressPath = join(rootDir, '..', 'data', 'progress.json'),
  journalPath = join(rootDir, '..', 'journal'),
  authPath = join(rootDir, '..', 'data', 'users.json'),
  progressIo = null,
  authIo = null,
  journalFileMap = null,
  geminiKey = resolveGeminiApiKey(),
  geminiModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  geminiFetch = fetch,
  genkitGenerate = null,
  storage = 'disk',
} = {}) {
  const app = express();
  const progress = createProgressStore(progressPath, phases.map((phase) => phase.id), progressCatalog(), progressIo ? { jsonIo: progressIo } : {});
  const journal = createJournalStore(journalPath, {
    async getContext() {
      return { completed: [], currentPhaseId: phases[0].id };
    },
    fileMap: journalFileMap ?? undefined,
  });
  const auth = createAuthStore(authPath, authIo ? { jsonIo: authIo } : {});
  const startedAt = Date.now();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '256kb' }));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) res.setHeader('X-Request-Logged', '1');
    next();
  });

  function isProtected(req) {
    const { method, path } = req;
    if (path === '/api/mentor' || path === '/api/tutor') return true;
    if (method === 'POST' && /^\/api\/debug-lab\//.test(path)) return true;
    if (method === 'POST' && /^\/api\/projects\/[^/]+\/review$/.test(path)) return true;
    if (path.startsWith('/api/journal')) return true;
    if (path.startsWith('/api/progress')) return true;
    if (path === '/api/learning' || path === '/api/profile') return true;
    if (method === 'POST' && /^\/api\/phases\/[^/]+\/quiz$/.test(path)) return true;
    if (method === 'POST' && /^\/api\/exercises\/[^/]+\/submit$/.test(path)) return true;
    return false;
  }

  function learnerId(req) {
    return req.user?.id ?? null;
  }

  function cookieOpts(req) {
    const proto = req.headers['x-forwarded-proto'];
    const secure = Boolean(req.secure || proto === 'https' || process.env.FUNCTION_TARGET || process.env.K_SERVICE);
    return { secure };
  }

  async function issueSession(req, res, result) {
    if (!progress.get || !result.user) return result;
    const state = await progress.get(result.user.id);
    if (!state.learner) await progress.setLearner(result.user.name, result.user.id);
    res.setHeader('Set-Cookie', sessionCookie(result.token, cookieOpts(req)));
    return { user: result.user };
  }

  app.post('/api/auth/register', async (req, res, next) => {
    try {
      const result = await auth.register(req.body ?? {});
      return res.status(201).json(await issueSession(req, res, result));
    } catch (error) {
      if (clientError(res, error)) return undefined;
      return next(error);
    }
  });

  app.post('/api/auth/login', async (req, res, next) => {
    try {
      const result = await auth.login(req.body ?? {});
      return res.json(await issueSession(req, res, result));
    } catch (error) {
      if (clientError(res, error)) return undefined;
      return next(error);
    }
  });

  app.post('/api/auth/logout', async (req, res, next) => {
    try {
      await auth.logout(sessionTokenFrom(req.headers.cookie));
      res.setHeader('Set-Cookie', clearSessionCookie(cookieOpts(req)));
      return res.json({ user: null });
    } catch (error) { next(error); }
  });

  app.get('/api/auth/me', async (req, res, next) => {
    try {
      const user = await auth.userFromToken(sessionTokenFrom(req.headers.cookie));
      return res.json({ user });
    } catch (error) { next(error); }
  });

  app.use(async (req, res, next) => {
    if (!req.path.startsWith('/api')) return next();
    try {
      req.user = await auth.userFromToken(sessionTokenFrom(req.headers.cookie));
      if (isProtected(req) && !req.user) return res.status(401).json({ error: 'Sign in required' });
      return next();
    } catch (error) { next(error); }
  });

  async function maybeCompletePhase(phase, userId) {
    const state = await progress.get(userId);
    if (state.completed.includes(phase.id)) return state;
    const quizPassed = Boolean(state.quizzes[phase.quiz.id]?.passed);
    const allExercises = phase.exercises.every((exercise) => {
      const record = state.exercises[exercise.id];
      if (!record) return false;
      return exercise.type === 'build' ? record.completed : record.passed;
    });
    if (quizPassed && allExercises) return progress.update(phase.id, true, userId);
    return state;
  }

  app.get('/api/phases', async (req, res, next) => {
    try {
      const state = await progress.get(learnerId(req));
      res.json({
        phases: phases.map((phase) => ({
          ...summarizePhase(phase),
          unlocked: isPhaseUnlocked(phase.id, state.completed),
          requires: previousPhaseId(phase.id),
        })),
      });
    } catch (error) { next(error); }
  });

  app.get('/api/phases/:id', (req, res) => {
    const phase = getPhaseById(req.params.id);
    if (!phase) return res.status(404).json({ error: 'Phase not found' });
    return res.json(toPublicPhase(phase));
  });

  app.post('/api/phases/:id/quiz', async (req, res, next) => {
    const phase = getPhaseById(req.params.id);
    if (!phase) return res.status(404).json({ error: 'Phase not found' });
    try {
      const graded = gradeQuiz(phase.quiz, req.body?.answers);
      const missed = graded.results.filter((result) => !result.isCorrect).map((result) => result.id);
      await progress.recordQuiz(phase.quiz.id, { score: graded.score, passed: graded.passed, missed }, learnerId(req));
      return res.json({ ...graded, progress: await maybeCompletePhase(phase, learnerId(req)) });
    } catch (error) {
      if (clientError(res, error)) return undefined;
      return next(error);
    }
  });

  app.get('/api/docs', (_req, res) => {
    res.json({ articles: listDocs() });
  });

  app.get('/api/docs/:id', (req, res) => {
    const article = getDocById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    return res.json(article);
  });

  app.get('/api/library', (_req, res) => {
    res.json(listLibrary());
  });

  app.get('/api/library/:id', (req, res) => {
    const source = getLibrarySource(req.params.id);
    if (!source) return res.status(404).json({ error: 'Library source not found' });
    return res.json(source);
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ...buildHealth(startedAt),
      storage,
      api: true,
      backup: storage === 'firestore'
        ? 'Progress, auth, and journal persist in Firestore.'
        : 'Copy data/ and journal/ for a local snapshot.',
    });
  });

  app.get('/api/sandbox', (_req, res) => {
    res.json(SANDBOX);
  });

  app.get('/api/git-workflow', (_req, res) => {
    res.json(gitWorkflow);
  });

  app.get('/api/debug-lab', (_req, res) => {
    res.json({
      bugs: debugLab.map(({ answer, explanation, ...bug }) => bug),
    });
  });

  app.get('/api/graph', (_req, res) => {
    res.json(knowledgeGraph());
  });

  app.get('/api/shell', (_req, res) => {
    res.json(listShell());
  });

  app.get('/api/config', (_req, res) => {
    res.json(publicRuntimeConfig({ geminiConfigured: Boolean(geminiKey) }));
  });

  app.get('/api/profile', async (req, res, next) => {
    try {
      const state = await progress.get(learnerId(req));
      return res.json({ learner: state.learner, user: req.user });
    } catch (error) { next(error); }
  });

  app.put('/api/profile', async (req, res, next) => {
    try {
      const user = await auth.renameUser(req.user.id, req.body?.name);
      const saved = await progress.setLearner(user.name, learnerId(req));
      return res.json({ ...saved, user });
    } catch (error) {
      if (clientError(res, error)) return undefined;
      return next(error);
    }
  });

  app.get('/api/projects', (_req, res) => {
    res.json({ projects, reviewCriteria: REVIEW_CRITERIA });
  });

  app.get('/api/journal', async (_req, res, next) => {
    try { res.json(await journal.get()); } catch (error) { next(error); }
  });

  app.post('/api/journal/phases/:id/open', async (req, res, next) => {
    try {
      return res.json(await journal.openPhase(req.params.id));
    } catch (error) {
      if (clientError(res, error)) return undefined;
      return next(error);
    }
  });

  app.get('/api/journal/file', async (req, res, next) => {
    try {
      return res.json(await journal.read(String(req.query.path ?? '')));
    } catch (error) {
      if (clientError(res, error)) return undefined;
      return next(error);
    }
  });

  app.put('/api/journal/file', async (req, res, next) => {
    const { path: filePath, content } = req.body ?? {};
    try {
      return res.json(await journal.write(filePath, content));
    } catch (error) {
      if (clientError(res, error)) return undefined;
      return next(error);
    }
  });

  app.post('/api/journal/file', async (req, res, next) => {
    try {
      return res.status(201).json(await journal.create(req.body ?? {}));
    } catch (error) {
      if (clientError(res, error)) return undefined;
      return next(error);
    }
  });

  app.get('/api/progress', async (req, res, next) => {
    try { res.json(await progress.get(learnerId(req))); } catch (error) { next(error); }
  });

  app.get('/api/learning', async (req, res, next) => {
    try { res.json(buildLearningSnapshot(await progress.get(learnerId(req)))); } catch (error) { next(error); }
  });

  app.put('/api/progress', async (req, res, next) => {
    const { phaseId, completed } = req.body ?? {};
    if (typeof phaseId !== 'string' || typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'phaseId and boolean completed are required' });
    }
    try {
      return res.json(await progress.update(phaseId, completed, learnerId(req)));
    } catch (error) {
      if (clientError(res, error)) return undefined;
      return next(error);
    }
  });

  app.put('/api/progress/topics', async (req, res, next) => {
    const { topicId, completed } = req.body ?? {};
    if (typeof topicId !== 'string' || typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'topicId and boolean completed are required' });
    }
    try {
      return res.json(await progress.completeTopic(topicId, completed, learnerId(req)));
    } catch (error) {
      if (clientError(res, error)) return undefined;
      return next(error);
    }
  });

  app.post('/api/exercises/:id/submit', async (req, res, next) => {
    const found = getExerciseById(req.params.id);
    if (!found) return res.status(404).json({ error: 'Exercise not found' });
    const { exercise } = found;
    const userId = learnerId(req);
    try {
      if (exercise.type === 'choice' || exercise.type === 'predict' || exercise.type === 'debug') {
        const graded = gradeChoiceExercise(exercise, req.body?.selected);
        await progress.recordExercise(exercise.id, { completed: graded.passed, passed: graded.passed }, userId);
        return res.json({ ...graded, progress: await maybeCompletePhase(found.phase, userId), evaluatedOnServer: false });
      }
      if (exercise.type === 'build') {
        const completed = req.body?.completed === true;
        await progress.recordExercise(exercise.id, { completed, passed: completed }, userId);
        return res.json({
          passed: completed,
          completed,
          solution: completed ? exercise.solution : null,
          progress: await maybeCompletePhase(found.phase, userId),
          evaluatedOnServer: false,
        });
      }
      if (exercise.type === 'terminal') {
        const graded = gradeTerminalExercise(exercise, req.body?.commands);
        await progress.recordExercise(exercise.id, { completed: graded.passed, passed: graded.passed }, userId);
        return res.json({
          ...graded,
          progress: await maybeCompletePhase(found.phase, userId),
        });
      }
      if (exercise.type === 'code') {
        if (req.body?.reveal === true) {
          return res.json({ solution: exercise.solution, passed: false, progress: await progress.get(userId), evaluatedOnServer: false });
        }
        const passed = req.body?.passed === true;
        await progress.recordExercise(exercise.id, { completed: passed, passed }, userId);
        return res.json({
          passed,
          completed: passed,
          solution: passed ? exercise.solution : null,
          progress: await maybeCompletePhase(found.phase, userId),
          evaluatedOnServer: false,
        });
      }
      return res.status(400).json({ error: 'Unsupported exercise type' });
    } catch (error) {
      if (clientError(res, error)) return undefined;
      return next(error);
    }
  });

  app.get('/api/mentor', async (req, res, next) => {
    try {
      const help = mentorHelp(String(req.query.exerciseId ?? ''), req.query.level);
      await progress.recordHint(String(req.query.exerciseId ?? ''), help.level, learnerId(req));
      return res.json(help);
    } catch (error) {
      if (clientError(res, error)) return undefined;
      return next(error);
    }
  });

  app.post('/api/tutor', async (req, res, next) => {
    try {
      const reply = await askTutor(req.body ?? {}, {
        apiKey: geminiKey,
        model: geminiModel,
        fetchImpl: geminiFetch,
        generate: genkitGenerate,
      });
      return res.json(reply);
    } catch (error) {
      if (clientError(res, error)) return undefined;
      return next(error);
    }
  });

  app.post('/api/projects/:id/review', async (req, res, next) => {
    const project = projects.find((item) => item.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    try {
      const scored = scoreProject(req.body?.ratings);
      const saved = await progress.recordProjectReview(project.id, scored, learnerId(req));
      return res.json({ ...scored, projectId: project.id, progress: saved });
    } catch (error) {
      if (clientError(res, error)) return undefined;
      return next(error);
    }
  });

  app.post('/api/debug-lab/:id/submit', async (req, res, next) => {
    const bug = debugLab.find((item) => item.id === req.params.id);
    if (!bug) return res.status(404).json({ error: 'Bug not found' });
    try {
      return res.json({ ...gradeChoiceExercise(bug, req.body?.selected), evaluatedOnServer: false });
    } catch (error) {
      if (clientError(res, error)) return undefined;
      return next(error);
    }
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));
  app.use(express.static(join(rootDir, 'public')));
  app.get('/{*splat}', (_req, res) => res.sendFile(join(rootDir, 'public', 'index.html')));

  app.use((error, _req, res, _next) => {
    if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'Invalid JSON body' });
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
