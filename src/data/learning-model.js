export const THRESHOLDS = {
  quizPass: 70,
  quizMastery: 80,
  exerciseMastery: 80,
};

export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30];

export const PHASE_SEQUENCE = [
  'environment',
  'web-fundamentals',
  'javascript-core',
  'runtime-async',
  'browser-dom',
  'http-api',
  'node',
  'databases-sql',
  'express-api',
  'auth-security',
  'react',
  'full-stack',
  'typescript',
  'testing',
  'production',
  'nextjs',
  'advanced-engineering',
];

export function previousPhaseId(phaseId) {
  const index = PHASE_SEQUENCE.indexOf(phaseId);
  return index > 0 ? PHASE_SEQUENCE[index - 1] : null;
}

export function isPhaseUnlocked(phaseId, completed) {
  const previous = previousPhaseId(phaseId);
  return previous === null || completed.includes(previous);
}

export function daysFromNow(days, from = new Date()) {
  return new Date(from.getTime() + days * 86400000).toISOString();
}

export function nextReviewAt(passed, attempts = 1, from = new Date()) {
  if (!passed) return daysFromNow(REVIEW_INTERVALS_DAYS[0], from);
  const index = Math.min(attempts, REVIEW_INTERVALS_DAYS.length) - 1;
  return daysFromNow(REVIEW_INTERVALS_DAYS[Math.max(index, 1)], from);
}

export function phaseState({ unlocked, started, practicing, assessed, passed, mastered, reviewDue, reinforce }) {
  if (!unlocked) return 'LOCKED';
  if (reinforce) return 'REINFORCE';
  if (reviewDue) return 'REVIEW_DUE';
  if (mastered) return 'MASTERED';
  if (assessed && passed) return 'ASSESSED';
  if (assessed && !passed) return 'REINFORCE';
  if (practicing) return 'PRACTICING';
  if (started) return 'LEARNING';
  return 'AVAILABLE';
}
