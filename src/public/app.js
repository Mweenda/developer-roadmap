import { escapeHtml } from './js/html.js';
import { request } from './js/api.js';
import { parseRoute } from './js/router.js';
import { runCodeExercise } from './js/runner-client.js';
import {
  store, hooks, bindShell, showNotice, loadLearning, loadPhase, reportFor, loadWorkspace,
} from './js/store.js';
import {
  renderOverview, renderDocs, renderSource, renderDoc, renderProjects, renderMap,
  renderHabits, renderGit, renderDebugLab, renderProfile, renderLanding, renderRegister, renderLogin,
} from './js/views-pages.js';
import { renderJournal, renderJournalPhase, renderJournalEditor } from './js/views-journal.js';
import { renderRoadmap, renderPhaseGuide, renderTopic, renderExercise, renderQuiz } from './js/views-learn.js';

async function render() {
  showNotice('');
  const route = parseRoute();
  try {
    if (!store.session) {
      document.body.classList.add('public');
      if (route.name === 'login') return renderLogin();
      if (route.name === 'register') return renderRegister();
      return renderLanding();
    }
    document.body.classList.remove('public');
    if (route.name === 'login' || route.name === 'register') {
      location.hash = '#/';
      return renderOverview();
    }
    if (route.name === 'map') return renderMap();
    if (route.name === 'git') return renderGit();
    if (route.name === 'lab') return renderDebugLab();
    if (route.name === 'roadmap') return renderRoadmap();
    if (route.name === 'projects') return renderProjects();
    if (route.name === 'habits') return renderHabits();
    if (route.name === 'profile') {
      await loadLearning();
      return renderProfile();
    }
    if (route.name === 'journal') return renderJournal();
    if (route.name === 'journal-phase') return renderJournalPhase(route.phaseId);
    if (route.name === 'journal-edit') return renderJournalEditor(route.path);
    if (route.name === 'docs') return renderDocs();
    if (route.name === 'source') return renderSource(await request(`/api/library/${encodeURIComponent(route.id)}`));
    if (route.name === 'doc') return renderDoc(await request(`/api/docs/${encodeURIComponent(route.id)}`));
    if (route.name === 'phase' || route.name === 'topic' || route.name === 'exercise' || route.name === 'quiz') {
      const phase = await loadPhase(route.phaseId);
      await loadLearning();
      const report = reportFor(phase.id);
      if (report && !report.unlocked) return renderPhaseGuide(phase);
      if (route.name === 'topic') return renderTopic(phase, route.topicId);
      if (route.name === 'exercise') return renderExercise(phase, route.exerciseId);
      if (route.name === 'quiz') return renderQuiz(phase);
      return renderPhaseGuide(phase);
    }
    return renderOverview();
  } catch (error) {
    store.view.innerHTML = `<div class="loading">Could not load this view. ${escapeHtml(error.message)}</div>`;
  }
}

async function init() {
  bindShell();
  hooks.render = render;
  try {
    store.shell = await request('/api/shell');
    store.session = (await request('/api/auth/me')).user;
    if (store.session) await loadWorkspace();
    await render();
  } catch (error) {
    store.view.innerHTML = '<div class="loading">Could not load the roadmap. Start the app with <code>pnpm dev</code> and refresh.</div>';
    showNotice(`Backend unavailable: ${error.message}`);
  }
}

window.addEventListener('hashchange', () => { render(); });
init();

export { runCodeExercise, parseRoute };
