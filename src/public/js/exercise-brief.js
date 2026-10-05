import { store } from './store.js';

export function closeExerciseBrief() {
  const layer = document.querySelector('#briefLayer');
  if (layer) layer.hidden = true;
}

export function showExerciseBrief(exercise) {
  const layer = document.querySelector('#briefLayer');
  const dialog = document.querySelector('#briefDialog');
  const guideline = exercise?.guideline;
  if (!layer || !dialog || !guideline) return;
  const copy = store.shell.exerciseUi ?? {};
  document.querySelector('#briefEyebrow').textContent = guideline.eyebrow ?? copy.briefEyebrow ?? 'Exercise briefing';
  document.querySelector('#briefTitle').textContent = guideline.title ?? exercise.title ?? '';
  document.querySelector('#briefPrompt').textContent = guideline.prompt ?? exercise.prompt ?? '';
  document.querySelector('#briefHowLabel').textContent = guideline.howLabel ?? copy.howLabel ?? 'How to go about it';
  document.querySelector('#briefHow').textContent = guideline.how ?? '';
  document.querySelector('#briefExpectedLabel').textContent = guideline.expectedLabel ?? copy.expectedLabel ?? 'What is expected';
  document.querySelector('#briefExpected').textContent = guideline.expected ?? '';
  document.querySelector('#briefStart').textContent = guideline.startLabel ?? copy.startLabel ?? 'Start the exercise';
  layer.hidden = false;
  dialog.focus();
}

export function bindExerciseBrief() {
  document.querySelector('#briefStart')?.addEventListener('click', closeExerciseBrief);
  document.querySelector('#briefLayer')?.addEventListener('click', (event) => {
    if (event.target.id === 'briefLayer') closeExerciseBrief();
  });
}

export function openExerciseBrief(exercise) {
  store.briefsSeen?.delete(exercise.id);
  showExerciseBrief(exercise);
}

export function maybeShowExerciseBrief(exercise) {
  store.briefsSeen ??= new Set();
  if (store.briefsSeen.has(exercise.id)) return;
  store.briefsSeen.add(exercise.id);
  showExerciseBrief(exercise);
}
