import { phases } from '../data/phases.js';
import { buildAdaptive } from './adaptive.js';
import {
  THRESHOLDS,
  PHASE_SEQUENCE,
  isPhaseUnlocked,
  previousPhaseId,
  phaseState,
} from '../data/learning-model.js';

function exerciseDone(exercise, record) {
  if (!record) return false;
  return exercise.type === 'build' ? record.completed : record.passed;
}

export function buildLearningSnapshot(progress) {
  const now = Date.now();
  const phaseReports = phases.map((phase) => {
    const unlocked = isPhaseUnlocked(phase.id, progress.completed);
    const quiz = progress.quizzes[phase.id] ?? progress.quizzes[phase.quiz.id];
    const exerciseRecords = phase.exercises.map((exercise) => progress.exercises[exercise.id]);
    const exercisesPassed = phase.exercises.filter((exercise, index) => exerciseDone(exercise, exerciseRecords[index])).length;
    const exercisesAttempted = exerciseRecords.filter((record) => record && record.attempts > 0).length;
    const application = phase.exercises.length
      ? Math.round((exercisesPassed / phase.exercises.length) * 100)
      : 0;
    const knowledge = Number.isInteger(quiz?.score) ? quiz.score : 0;
    const topicsRead = phase.topics.filter((topic) => progress.topics.includes(topic.id)).length;
    const started = topicsRead > 0 || exercisesAttempted > 0 || Boolean(quiz);
    const practicing = exercisesAttempted > 0;
    const assessed = Boolean(quiz);
    const passed = Boolean(quiz?.passed);
    const mastered = knowledge >= THRESHOLDS.quizMastery && application >= THRESHOLDS.exerciseMastery && exercisesPassed === phase.exercises.length;
    const reviewAt = progress.reviews?.[phase.id];
    const reviewDue = Boolean(reviewAt && Date.parse(reviewAt) <= now);
    const failedExercises = phase.exercises.filter((exercise) => {
      const record = progress.exercises[exercise.id];
      return record && record.attempts > 0 && !exerciseDone(exercise, record);
    });
    const missed = progress.misses?.[phase.id] ?? quiz?.missed ?? [];
    const reinforce = (assessed && !passed) || failedExercises.length > 0;
    const state = phaseState({
      unlocked, started, practicing, assessed, passed, mastered, reviewDue, reinforce,
    });
    const nextTopic = phase.topics.find((topic) => !progress.topics.includes(topic.id)) ?? phase.topics[0];
    const nextExercise = phase.exercises.find((exercise) => !exerciseDone(exercise, progress.exercises[exercise.id]));
    return {
      id: phase.id,
      title: phase.title,
      label: `Phase ${PHASE_SEQUENCE.indexOf(phase.id)}`,
      duration: phase.duration,
      project: phase.project ?? null,
      unlocked,
      requires: previousPhaseId(phase.id),
      state,
      knowledge,
      application,
      mastery: Math.round((knowledge + application) / 2),
      topicsRead,
      topicTotal: phase.topics.length,
      exercisesPassed,
      exerciseTotal: phase.exercises.length,
      quizPassed: passed,
      quizScore: quiz?.score ?? null,
      reviewAt: reviewAt ?? null,
      reviewDue,
      nextTopic,
      nextExercise,
      failedExercises: failedExercises.map((exercise) => ({ id: exercise.id, title: exercise.title })),
      missedQuestionIds: missed,
    };
  });

  const current = phaseReports.find((phase) => phase.unlocked && phase.state !== 'MASTERED')
    ?? phaseReports.find((phase) => !progress.completed.includes(phase.id))
    ?? phaseReports[phaseReports.length - 1];

  const today = [];
  if (current) {
    if (current.nextTopic && current.topicsRead < current.topicTotal) {
      today.push({
        id: 'read',
        label: `Read: ${current.nextTopic.title}`,
        href: `#/phase/${encodeURIComponent(current.id)}/learn/${encodeURIComponent(current.nextTopic.id)}`,
        done: false,
      });
    } else {
      today.push({ id: 'read', label: 'Read today’s concept', href: `#/phase/${encodeURIComponent(current.id)}`, done: true });
    }
    if (current.nextExercise) {
      today.push({
        id: 'practice',
        label: `Practice: ${current.nextExercise.title}`,
        href: `#/phase/${encodeURIComponent(current.id)}/exercise/${encodeURIComponent(current.nextExercise.id)}`,
        done: false,
      });
    } else {
      today.push({
        id: 'practice',
        label: 'Phase exercises complete',
        href: `#/phase/${encodeURIComponent(current.id)}`,
        done: true,
      });
    }
    today.push({
      id: 'quiz',
      label: current.quizPassed ? 'Phase quiz passed' : 'Pass the phase quiz',
      href: `#/phase/${encodeURIComponent(current.id)}/quiz`,
      done: current.quizPassed,
    });
    today.push({
      id: 'journal',
      label: 'Write the weekly review / phase gate',
      href: `#/journal/phase/${encodeURIComponent(current.id)}`,
      done: false,
    });
  }

  const weak = [];
  for (const phase of phaseReports) {
    for (const exercise of phase.failedExercises) {
      weak.push({
        id: exercise.id,
        title: exercise.title,
        phaseId: phase.id,
        phaseTitle: phase.title,
        reason: 'Exercise failed or unfinished after an attempt',
        href: `#/phase/${encodeURIComponent(phase.id)}/exercise/${encodeURIComponent(exercise.id)}`,
      });
    }
    if (phase.quizScore !== null && !phase.quizPassed) {
      weak.push({
        id: `${phase.id}-quiz`,
        title: `${phase.title} quiz`,
        phaseId: phase.id,
        phaseTitle: phase.title,
        reason: `Scored ${phase.quizScore}% — below the pass bar`,
        href: `#/phase/${encodeURIComponent(phase.id)}/quiz`,
      });
    }
  }

  const reviews = phaseReports
    .filter((phase) => phase.reviewDue || (phase.reviewAt && Date.parse(phase.reviewAt) <= now))
    .map((phase) => ({
      id: phase.id,
      title: phase.title,
      due: phase.reviewAt,
      href: `#/phase/${encodeURIComponent(phase.id)}/quiz`,
    }));

  const masteredCount = phaseReports.filter((phase) => phase.state === 'MASTERED').length;
  const progressPercent = Math.round((progress.completed.length / phases.length) * 100);
  const masteryPercent = Math.round(phaseReports.reduce((sum, phase) => sum + phase.mastery, 0) / phaseReports.length);

  let action;
  if (!current) {
    action = { title: 'Review the roadmap', href: '#/roadmap', why: 'Every phase is complete. Keep reviewing weak areas.' };
  } else if (!current.unlocked) {
    action = { title: `Finish ${previousPhaseId(current.id)} first`, href: '#/roadmap', why: 'Fundamentals before frameworks. Do not skip ahead.' };
  } else if (current.state === 'AVAILABLE' && current.topicsRead === 0 && current.exercisesPassed === 0 && !current.quizPassed) {
    action = {
      title: `Start ${current.label}.`,
      href: `#/phase/${encodeURIComponent(current.id)}/learn/${encodeURIComponent(current.nextTopic.id)}`,
      why: 'Open the first lesson. Reading it is not mastery — you will practice and take a quiz next.',
    };
  } else if (current.nextTopic && current.topicsRead < current.topicTotal) {
    action = {
      title: `Learn: ${current.nextTopic.title}`,
      href: `#/phase/${encodeURIComponent(current.id)}/learn/${encodeURIComponent(current.nextTopic.id)}`,
      why: 'Understand the idea before you practice it.',
    };
  } else if (current.nextExercise) {
    action = {
      title: `Practice: ${current.nextExercise.title}`,
      href: `#/phase/${encodeURIComponent(current.id)}/exercise/${encodeURIComponent(current.nextExercise.id)}`,
      why: 'Opening a lesson is not mastery. Use the concept.',
    };
  } else if (!current.quizPassed) {
    action = {
      title: `Assess: ${current.title} quiz`,
      href: `#/phase/${encodeURIComponent(current.id)}/quiz`,
      why: 'The system needs evidence that you understand this phase.',
    };
  } else {
    action = {
      title: `Review gate: ${current.title}`,
      href: `#/journal/phase/${encodeURIComponent(current.id)}`,
      why: 'Explain it in your own words before moving on.',
    };
  }

  return {
    thresholds: THRESHOLDS,
    learner: progress.learner ?? null,
    current,
    action,
    today,
    weak: weak.slice(0, 8),
    reviews,
    adaptive: buildAdaptive(phaseReports, weak),
    phases: phaseReports,
    overall: {
      progressPercent,
      masteryPercent,
      completed: progress.completed.length,
      mastered: masteredCount,
      total: phases.length,
    },
  };
}
