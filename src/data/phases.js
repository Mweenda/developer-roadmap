import { foundationPhases } from './curriculum/foundation.js';
import { backendPhases } from './curriculum/backend.js';
import { productPhases } from './curriculum/product.js';
import { publicPhase, publicTopic } from '../lib/grade.js';
import { libraryForPhase } from './library.js';

export const phases = [...foundationPhases, ...backendPhases, ...productPhases];

export function getPhaseById(id) {
  return phases.find((phase) => phase.id === id) ?? null;
}

export function getExerciseById(id) {
  for (const phase of phases) {
    const exercise = phase.exercises.find((item) => item.id === id);
    if (exercise) return { phase, exercise };
  }
  return null;
}

export function getTopicById(id) {
  for (const phase of phases) {
    const topic = phase.topics.find((item) => item.id === id);
    if (topic) return { phase, topic };
  }
  return null;
}

export function listDocs() {
  return phases.flatMap((phase) =>
    phase.topics.map((topic) => ({
      id: topic.id,
      phaseId: phase.id,
      phaseTitle: phase.title,
      title: topic.title,
      minutes: topic.minutes,
      summary: topic.summary,
    })),
  );
}

export function getDocById(id) {
  const found = getTopicById(id);
  return found ? publicTopic(found.topic, found.phase) : null;
}

export function summarizePhase(phase) {
  return {
    id: phase.id,
    title: phase.title,
    duration: phase.duration,
    summary: phase.summary,
    project: phase.project ?? null,
    topicCount: phase.topics.length,
    exerciseCount: phase.exercises.length,
    quizCount: phase.quiz.questions.length,
    topicIds: phase.topics.map((topic) => topic.id),
    exerciseIds: phase.exercises.map((exercise) => exercise.id),
  };
}

export function toPublicPhase(phase) {
  return { ...publicPhase(phase), library: libraryForPhase(phase.id) };
}

export function progressCatalog() {
  return {
    topicIds: phases.flatMap((phase) => phase.topics.map((topic) => topic.id)),
    exerciseIds: phases.flatMap((phase) => phase.exercises.map((exercise) => exercise.id)),
    quizIds: phases.map((phase) => phase.quiz.id),
  };
}
