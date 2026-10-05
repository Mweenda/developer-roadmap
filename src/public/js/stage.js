function phaseHref(phaseId, kind, id) {
  const base = `#/phase/${encodeURIComponent(phaseId)}`;
  if (kind === 'topic') return `${base}/learn/${encodeURIComponent(id)}`;
  if (kind === 'exercise') return `${base}/exercise/${encodeURIComponent(id)}`;
  if (kind === 'quiz') return `${base}/quiz`;
  return base;
}

function exerciseComplete(exercise, record) {
  if (!record) return false;
  return exercise.type === 'build' ? Boolean(record.completed) : Boolean(record.passed || record.completed);
}

export function nextPhaseId(phaseId, sequence = []) {
  const index = sequence.findIndex((item) => (item.id ?? item) === phaseId);
  const next = index >= 0 ? sequence[index + 1] : null;
  return next ? (next.id ?? next) : null;
}

export function stageNavigation(phase, progress = {}, { kind = 'guide', topicId, exerciseId } = {}, sequence = []) {
  const topics = phase.topics ?? [];
  const exercises = phase.exercises ?? [];
  const back = { href: '#/roadmap', label: 'Go back' };
  const next = { href: '#/roadmap', label: 'Proceed', enabled: false };

  if (kind === 'guide') {
    const first = topics[0];
    return {
      back,
      next: first
        ? { href: phaseHref(phase.id, 'topic', first.id), label: 'Proceed', enabled: true }
        : next,
      complete: true,
    };
  }

  if (kind === 'topic') {
    const index = Math.max(0, topics.findIndex((topic) => topic.id === topicId));
    const complete = Boolean(progress.topics?.includes(topics[index]?.id));
    if (index > 0) back.href = phaseHref(phase.id, 'topic', topics[index - 1].id);
    else back.href = phaseHref(phase.id, 'guide');
    if (index < topics.length - 1) next.href = phaseHref(phase.id, 'topic', topics[index + 1].id);
    else if (exercises[0]) next.href = phaseHref(phase.id, 'exercise', exercises[0].id);
    else next.href = phaseHref(phase.id, 'quiz');
    next.enabled = complete;
    return { back, next, complete };
  }

  if (kind === 'exercise') {
    const index = Math.max(0, exercises.findIndex((item) => item.id === exerciseId));
    const current = exercises[index];
    const complete = exerciseComplete(current, progress.exercises?.[current?.id]);
    if (index > 0) back.href = phaseHref(phase.id, 'exercise', exercises[index - 1].id);
    else if (topics.length) back.href = phaseHref(phase.id, 'topic', topics[topics.length - 1].id);
    else back.href = phaseHref(phase.id, 'guide');
    if (index < exercises.length - 1) next.href = phaseHref(phase.id, 'exercise', exercises[index + 1].id);
    else next.href = phaseHref(phase.id, 'quiz');
    next.enabled = complete;
    return { back, next, complete };
  }

  const quizPassed = Boolean(progress.quizzes?.[phase.id]?.passed || progress.quizzes?.[phase.quiz?.id]?.passed);
  if (exercises.length) back.href = phaseHref(phase.id, 'exercise', exercises[exercises.length - 1].id);
  else if (topics.length) back.href = phaseHref(phase.id, 'topic', topics[topics.length - 1].id);
  const following = nextPhaseId(phase.id, sequence);
  if (progress.completed?.includes(phase.id) && following) {
    next.href = phaseHref(following, 'guide');
    next.enabled = true;
  } else {
    next.href = `#/journal/phase/${encodeURIComponent(phase.id)}`;
    next.enabled = quizPassed;
  }
  return { back, next, complete: quizPassed };
}

export function celebrationCopy({ kind = 'exercise', phase, topic, exercise, explanation, phaseComplete = false } = {}, copy = {}) {
  const titles = copy.titles ?? {
    question: 'Correct.',
    exercise: 'You proved this one.',
    quiz: 'Quiz passed.',
    phase: 'Stage complete.',
  };
  const title = phaseComplete ? titles.phase : titles[kind] ?? titles.exercise;
  const stage = [phase?.title, topic?.title ?? exercise?.title].filter(Boolean).join(' · ');
  const insight = [
    stage,
    explanation,
    phase?.advice,
    copy.insightLead ?? 'Keep using the idea from this chapter’s official docs. Opening a page is not mastery.',
  ].filter(Boolean).join(' ');
  return {
    title,
    insight,
    backLabel: copy.backLabel ?? 'Go back',
    nextLabel: copy.nextLabel ?? 'Proceed',
    waitLabel: copy.waitLabel ?? 'Finish this stage to proceed',
    dismissLabel: copy.dismissLabel ?? 'Keep working',
  };
}
