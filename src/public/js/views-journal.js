import { escapeHtml } from './html.js';
import { request } from './api.js';
import { store, nextPhase, updateChrome } from './store.js';

function fileLabel(path) {
  return path.split('/').slice(1).join('/') || path;
}

export async function renderJournal() {
  const data = await request('/api/journal');
  const current = nextPhase();
  store.view.innerHTML = `<div class="section-title"><div><div class="eyebrow">Learn · build · review</div><h1>Your learning journal</h1></div></div>
    <p class="lede">${escapeHtml(data.rule)} Folders are created when you reach a phase, not before.</p>
    <section class="foundation">
      <article><b>Current phase</b><p>${current ? escapeHtml(current.title) : 'All phases complete'} — write notes, a weekly review, and a phase gate before you claim you are done.</p></article>
      <article class="stack"><small>TIME SPLIT</small><p>80–90% code <i>→</i> 10–20% docs</p></article>
    </section>
    <div class="phase-actions">
      <a class="button primary" href="${current ? `#/journal/phase/${encodeURIComponent(current.id)}` : '#/journal/edit/README.md'}">Document this week</a>
      <a class="button secondary" href="#/journal/edit/${encodeURIComponent('debugging.md')}">Debugging journal</a>
      <a class="button secondary" href="#/journal/edit/${encodeURIComponent('DECISIONS.md')}">Decisions (ADRs)</a>
      <a class="button secondary" href="#/journal/edit/${encodeURIComponent('README.md')}">Living index</a>
    </div>
    <div class="section-title"><div><div class="eyebrow">Eight document types</div><h2>What to write, and when</h2></div></div>
    <div class="doc-grid">${data.types.map((type) => `<article class="doc-card"><strong>${escapeHtml(type.title)}</strong><small>${escapeHtml(type.question)}</small></article>`).join('')}</div>
    <div class="section-title"><div><div class="eyebrow">Phases</div><h2>Open a folder only when you are there</h2></div></div>
    <div class="preview-list">${data.phases.map((phase) => `<a class="phase-link" href="#/journal/phase/${encodeURIComponent(phase.id)}"><span class="phase-number">${phase.opened ? '✎' : '·'}</span><span><strong>${escapeHtml(phase.title)}</strong><small>${escapeHtml(phase.folder)} · ${phase.opened ? 'folder created' : 'not started'}</small></span></a>`).join('')}</div>`;
  updateChrome();
}

export async function renderJournalPhase(phaseId) {
  const data = await request(`/api/journal/phases/${encodeURIComponent(phaseId)}/open`, { method: 'POST' });
  const phase = data.phases.find((item) => item.id === phaseId);
  const files = (data.files ?? []).filter((path) => path === 'README.md' || path === 'DECISIONS.md' || path === 'debugging.md' || path.startsWith(`${phase.folder}/`));
  store.view.innerHTML = `<div class="crumb"><a href="#/journal">Journal</a> / ${escapeHtml(phase.title)}</div>
    <div class="section-title"><div><div class="eyebrow">${escapeHtml(phase.folder)}</div><h1>${escapeHtml(phase.title)} documentation</h1></div></div>
    <p class="lede">What you learned, what you built, decisions, bugs, and whether you are ready to move on. Leave empty headings if you have nothing real to say — do not fill them from a tutorial.</p>
    <div class="phase-actions">
      <button type="button" class="primary-btn" data-create="weekly-review">New weekly review</button>
      <button type="button" data-create="debugging">Log a bug</button>
      <button type="button" data-create="notes">New note</button>
      <a class="button secondary" href="#/phase/${encodeURIComponent(phaseId)}">Back to the phase</a>
    </div>
    <div class="preview-list">${files.map((path) => `<a class="phase-link" href="#/journal/edit/${encodeURIComponent(path)}"><span class="phase-number">md</span><span><strong>${escapeHtml(fileLabel(path))}</strong><small>${escapeHtml(path)}</small></span></a>`).join('')}</div>`;
  store.view.querySelectorAll('[data-create]').forEach((button) => {
    button.addEventListener('click', async () => {
      const type = button.dataset.create;
      const title = type === 'debugging' ? window.prompt('Bug title (short symptom)') : type === 'notes' ? window.prompt('Note title') : 'Week review';
      if (title === null) return;
      const created = await request('/api/journal/file', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phaseId, type, title: title || type }),
      });
      location.hash = `#/journal/edit/${encodeURIComponent(created.path)}`;
    });
  });
  updateChrome();
}

export async function renderJournalEditor(filePath) {
  const file = await request(`/api/journal/file?path=${encodeURIComponent(filePath)}`);
  store.view.innerHTML = `<div class="crumb"><a href="#/journal">Journal</a> / ${escapeHtml(file.path)}</div>
    <div class="editor-head">
      <h1>${escapeHtml(file.path)}</h1>
      <p class="lede">Write your own explanation. Saving stores markdown in the <code>journal/</code> folder of this repo.</p>
    </div>
    <textarea id="journalText" class="editor journal-editor" spellcheck="true">${escapeHtml(file.content)}</textarea>
    <div class="phase-actions">
      <button type="button" class="primary-btn" id="saveJournal">Save</button>
      <span id="saveState" class="lede"></span>
    </div>`;
  store.view.querySelector('#saveJournal').addEventListener('click', async () => {
    const content = store.view.querySelector('#journalText').value;
    const status = store.view.querySelector('#saveState');
    try {
      await request('/api/journal/file', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: file.path, content }),
      });
      status.textContent = 'Saved.';
    } catch (error) {
      status.textContent = error.message;
    }
  });
  updateChrome();
}
