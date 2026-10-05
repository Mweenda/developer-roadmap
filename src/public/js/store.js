import { request } from './api.js';
import { parseRoute } from './router.js';

export const hooks = { render: async () => {} };

export const store = {
  view: null,
  notice: null,
  phases: [],
  projects: [],
  docs: [],
  library: { categories: [], whenToRead: [], principle: '', sources: [] },
  progress: { completed: [], topics: [], exercises: {}, quizzes: {}, misses: {}, reviews: {}, learner: null },
  learning: null,
  shell: { habits: [], projectMilestones: [], landing: null },
  session: null,
  reviewCriteria: [],
  projectReviews: {},
  hints: {},
  briefsSeen: new Set(),
  phaseCache: new Map(),
};

export function bindShell() {
  store.view = document.querySelector('#view');
  store.notice = document.querySelector('#notice');
}

export function showNotice(message) {
  store.notice.textContent = message;
  store.notice.hidden = !message;
}

export function initials(name) {
  if (!name) return '';
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function applyProgress(next) {
  store.progress = {
    completed: next.completed ?? [],
    topics: next.topics ?? [],
    exercises: next.exercises ?? {},
    quizzes: next.quizzes ?? {},
    misses: next.misses ?? {},
    reviews: next.reviews ?? {},
    learner: next.learner ?? null,
    updatedAt: next.updatedAt ?? null,
    hints: next.hints ?? {},
    projectReviews: next.projectReviews ?? {},
  };
  store.hints = store.progress.hints;
  store.projectReviews = store.progress.projectReviews;
  store.learning = null;
  updateChrome();
}

export async function loadLearning() {
  if (!store.learning) store.learning = await request('/api/learning');
  return store.learning;
}

export function reportFor(phaseId) {
  return store.learning?.phases?.find((phase) => phase.id === phaseId) ?? null;
}

export function phaseProgress(phase) {
  const topicIds = phase.topicIds ?? phase.topics?.map((topic) => topic.id) ?? [];
  const exerciseIds = phase.exerciseIds ?? phase.exercises?.map((exercise) => exercise.id) ?? [];
  const topicsDone = topicIds.filter((id) => store.progress.topics.includes(id)).length;
  const exercisesDone = exerciseIds.filter((id) => store.progress.exercises[id]?.passed || store.progress.exercises[id]?.completed).length;
  const quizDone = Boolean(store.progress.quizzes[phase.id]?.passed);
  const total = topicIds.length + exerciseIds.length + 1;
  const done = topicsDone + exercisesDone + (quizDone ? 1 : 0);
  return {
    topicsDone,
    topicTotal: topicIds.length,
    exercisesDone,
    exerciseTotal: exerciseIds.length,
    quizDone,
    quizScore: store.progress.quizzes[phase.id]?.score,
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0,
  };
}

export function nextPhase() {
  return store.learning?.current
    ? store.phases.find((phase) => phase.id === store.learning.current.id) ?? null
    : store.phases.find((phase) => !store.progress.completed.includes(phase.id)) ?? null;
}

export function updateChrome() {
  const snapshot = store.learning;
  const percent = snapshot?.overall?.progressPercent
    ?? (store.phases.length ? Math.round((store.progress.completed.length / store.phases.length) * 100) : 0);
  const count = snapshot?.overall?.completed ?? store.progress.completed.length;
  const streak = document.querySelector('#streak');
  if (streak) streak.textContent = count;
  const percentEl = document.querySelector('#percent');
  const meter = document.querySelector('#meter');
  const completed = document.querySelector('#completed');
  const total = document.querySelector('#total');
  if (percentEl) percentEl.textContent = `${percent}%`;
  if (meter) meter.style.width = `${percent}%`;
  if (completed) completed.textContent = count;
  if (total) total.textContent = store.phases.length;
  const avatar = document.querySelector('#accountBtn');
  if (avatar) avatar.textContent = initials(store.session?.name ?? store.progress.learner?.name);
  const route = parseRoute();
  const current = route.name === 'topic' || route.name === 'exercise' || route.name === 'quiz' || route.name === 'phase'
    ? 'roadmap'
    : route.name === 'doc' || route.name === 'source' ? 'docs'
      : route.name.startsWith('journal') ? 'journal'
        : route.name === 'git' || route.name === 'lab' || route.name === 'overview' ? route.name
          : '';
  document.querySelectorAll('#sidebarNav a').forEach((link) => {
    link.classList.toggle('selected', link.dataset.nav === current);
  });
}

export async function loadPhase(id) {
  if (!store.phaseCache.has(id)) store.phaseCache.set(id, await request(`/api/phases/${encodeURIComponent(id)}`));
  return store.phaseCache.get(id);
}

export async function setCompleted(phaseId, completed) {
  try {
    applyProgress(await request('/api/progress', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phaseId, completed }),
    }));
    showNotice('');
  } catch (error) {
    showNotice(`Could not save progress: ${error.message}`);
  }
}

export async function loadWorkspace() {
  const [roadmap, saved, projectData, docData, libraryData] = await Promise.all([
    request('/api/phases'),
    request('/api/progress'),
    request('/api/projects'),
    request('/api/docs'),
    request('/api/library'),
  ]);
  store.phases = roadmap.phases;
  store.projects = projectData.projects;
  store.reviewCriteria = projectData.reviewCriteria ?? [];
  store.docs = docData.articles;
  store.library = libraryData;
  applyProgress(saved);
}
