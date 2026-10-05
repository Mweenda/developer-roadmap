import { request } from './api.js';
import { parseRoute } from './router.js';
import { store } from './store.js';

function contextFromRoute() {
  const route = parseRoute();
  return {
    phaseId: route.phaseId ?? store.learning?.current?.id ?? null,
    topicId: route.topicId ?? store.learning?.current?.nextTopic?.id ?? null,
    exerciseId: route.exerciseId ?? store.learning?.current?.nextExercise?.id ?? null,
  };
}

function appendMessage(log, role, text) {
  const item = document.createElement('p');
  item.className = `tutor-msg ${role}`;
  item.textContent = text;
  log.append(item);
  log.scrollTop = log.scrollHeight;
}

export function setTutorVisible(visible) {
  const fab = document.querySelector('#tutorFab');
  const panel = document.querySelector('#tutorPanel');
  if (!fab || !panel) return;
  fab.hidden = !visible;
  if (!visible) {
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
  }
}

export function bindTutor() {
  const fab = document.querySelector('#tutorFab');
  const panel = document.querySelector('#tutorPanel');
  const form = document.querySelector('#tutorForm');
  const input = document.querySelector('#tutorInput');
  const log = document.querySelector('#tutorLog');
  if (!fab || !panel || !form || !input || !log) return;

  const copy = store.shell.tutor ?? {};
  const title = document.querySelector('#tutorTitle');
  if (title) title.textContent = copy.title ?? 'Curriculum tutor';
  fab.setAttribute('aria-label', copy.fabLabel ?? 'Ask the tutor');
  const greeting = document.querySelector('#tutorGreeting');
  if (greeting) greeting.textContent = copy.greeting ?? '';
  input.placeholder = copy.placeholder ?? 'Ask about this chapter';
  const send = form.querySelector('button[type="submit"]');
  if (send) send.textContent = copy.sendLabel ?? 'Ask';

  fab.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    fab.setAttribute('aria-expanded', String(open));
    if (open) input.focus();
  });

  panel.querySelector('#tutorClose')?.addEventListener('click', () => {
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    fab.focus();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (question.length < 3) return;
    input.value = '';
    appendMessage(log, 'learner', question);
    try {
      const reply = await request('/api/tutor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question, ...contextFromRoute() }),
      });
      appendMessage(log, 'tutor', reply.text);
    } catch (error) {
      appendMessage(log, 'tutor', error.message);
    }
  });
}
