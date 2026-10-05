import { escapeHtml, renderBlocks, bindCopies, field } from './html.js';
import { request } from './api.js';
import { store, hooks, applyProgress, loadLearning, loadWorkspace, updateChrome, showNotice } from './store.js';

export async function renderOverview() {
  const snapshot = await loadLearning();
  const current = snapshot.current;
  const action = snapshot.action;
  store.view.innerHTML = `
    <section class="hero">
      <div>
        <div class="eyebrow">${current ? `${escapeHtml(current.label ?? '')} · ${escapeHtml(current.state.replaceAll('_', ' '))}` : 'Apprenticeship'} · ${escapeHtml(store.progress.learner?.name ?? 'learner')}</div>
        <h1>${current ? escapeHtml(current.title) : 'Apprenticeship complete.'}<br><em>${escapeHtml(action.title)}</em></h1>
        <p>${escapeHtml(action.why)} Current lesson: ${escapeHtml(current?.nextTopic?.title ?? 'none')}. The portal does not treat “I opened a lesson” as understanding.</p>
        <div class="actions">
          <a class="button primary" href="${action.href}">${escapeHtml(action.title)} <span>→</span></a>
          <a class="button secondary" href="#/map">Knowledge map</a>
        </div>
      </div>
      <article class="progress-card">
        <div class="tiny-label">PROGRESS / MASTERY</div>
        <div class="percent"><strong id="percent">${snapshot.overall.progressPercent}%</strong><span>phases complete · ${snapshot.overall.masteryPercent}% mastery</span></div>
        <div class="meter"><i id="meter" style="width:${snapshot.overall.progressPercent}%"></i></div>
        <div class="progress-detail"><span><b id="completed">${snapshot.overall.completed}</b> of <b id="total">${snapshot.overall.total}</b> phases</span><span>${current ? escapeHtml(current.state.replaceAll('_', ' ')) : 'MASTERED'}</span></div>
      </article>
    </section>
    <div class="today-grid">
      <article class="panel">
        <div class="panel-title"><h3>Today</h3><span>DO THIS</span></div>
        <ul class="plain">${snapshot.today.map((item) => `<li>${item.done ? '✓' : '→'} <a href="${item.href}">${escapeHtml(item.label)}</a></li>`).join('')}</ul>
      </article>
      <article class="panel">
        <div class="panel-title"><h3>Needs attention</h3><span>WEAK AREAS</span></div>
        ${snapshot.weak.length ? `<ul class="plain">${snapshot.weak.map((item) => `<li>⚠ <a href="${item.href}">${escapeHtml(item.title)}</a><small> — ${escapeHtml(item.reason)}</small></li>`).join('')}</ul>` : '<p>No weak areas yet. Evidence comes from failed exercises and quizzes.</p>'}
      </article>
      <article class="panel">
        <div class="panel-title"><h3>Review queue</h3><span>RETAIN</span></div>
        ${snapshot.reviews.length ? `<ul class="plain">${snapshot.reviews.map((item) => `<li><a href="${item.href}">${escapeHtml(item.title)}</a></li>`).join('')}</ul>` : '<p>Nothing is due for review. Quizzes schedule the next check automatically.</p>'}
      </article>
    </div>
    <div class="today-grid">
      <article class="panel">
        <div class="panel-title"><h3>Recommended next</h3><span>ADAPTIVE</span></div>
        ${snapshot.adaptive?.recommended?.length
          ? `<ul class="plain">${snapshot.adaptive.recommended.map((item) => `<li><a href="${item.href}">${escapeHtml(item.title)}</a><small> — ${escapeHtml(item.why)}</small></li>`).join('')}</ul>`
          : '<p>No adaptive recommendations yet. Evidence appears after failed exercises, quizzes, and due reviews.</p>'}
      </article>
      <article class="panel">
        <div class="panel-title"><h3>Strong areas</h3><span>KEEP</span></div>
        ${snapshot.adaptive?.strong?.length
          ? `<ul class="plain">${snapshot.adaptive.strong.map((item) => `<li>${escapeHtml(item.title)} · ${item.mastery}%</li>`).join('')}</ul>`
          : '<p>Mastery ≥ 80% will show here.</p>'}
      </article>
      <article class="panel">
        <div class="panel-title"><h3>Due to forget</h3><span>REVIEW_DUE</span></div>
        ${snapshot.adaptive?.forgotten?.length
          ? `<ul class="plain">${snapshot.adaptive.forgotten.map((item) => `<li><a href="${item.href}">${escapeHtml(item.title)}</a></li>`).join('')}</ul>`
          : '<p>No review is due. Passed quizzes schedule the next check.</p>'}
      </article>
    </div>
    <section class="foundation">
      <article><b>How this portal works</b><p>Roadmap → concept → practice → quiz → project → journal gate. Opening a page is not mastery. Fundamentals stay locked until the previous phase is complete.</p></article>
      <article class="stack"><small>FOUNDATIONS BEFORE FRAMEWORKS</small><p>JavaScript <i>→</i> Browser <i>→</i> HTTP <i>→</i> Node <i>→</i> Database <i>→</i> React</p></article>
    </section>`;
  updateChrome();
}

export function renderDocs() {
  store.view.innerHTML = `<div class="section-title"><div><div class="eyebrow">Bookmark bar · official sources</div><h1>Developer reference library</h1></div></div>
    <p class="lede">${escapeHtml(store.library.principle || 'Understand the language well enough that you know what to look up.')} Do not read these cover-to-cover. The roadmap tells you which source to open at each stage.</p>
    <section class="foundation">
      <article><b>JavaScript.info</b><p>Learn / understand concepts progressively — fundamentals, objects, functions, prototypes, promises, async/await, DOM.</p></article>
      <article class="stack"><small>THEN VERIFY</small><p>MDN Guide + Reference <i>→</i> what the feature actually does</p></article>
    </section>
    <div class="section-title"><div><div class="eyebrow">When we are learning</div><h2>Primary documentation</h2></div></div>
    <table class="when-table"><thead><tr><th>Topic</th><th>Open this</th></tr></thead><tbody>${(store.library.whenToRead ?? []).map((row) => `<tr><td>${escapeHtml(row.when)}</td><td>${escapeHtml(row.primary)}</td></tr>`).join('')}</tbody></table>
    ${(store.library.categories ?? []).map((category) => `<section class="doc-group"><h2>${escapeHtml(category.title)}</h2><p class="lede">${escapeHtml(category.blurb)}</p><div class="doc-grid">${category.sources.map((source) => `<a class="doc-card ${source.later ? 'later' : ''}" href="#/docs/${encodeURIComponent(source.id)}"><strong>${escapeHtml(source.title)}</strong><small>${source.later ? 'Later in the roadmap · ' : source.role === 'learn' ? 'Learn / understand · ' : 'Reference / verify · '}${escapeHtml(source.summary)}</small></a>`).join('')}</div></section>`).join('')}
    <div class="section-title"><div><div class="eyebrow">Also in this app</div><h2>Fieldnotes lessons</h2></div></div>
    <p class="lede">Short in-app notes that sit on top of the official docs. They are not a replacement for MDN, Node, or React.</p>
    <div class="doc-grid">${store.docs.map((article) => `<a class="doc-card" href="#/lesson/${encodeURIComponent(article.id)}"><strong>${escapeHtml(article.title)}</strong><small>${escapeHtml(article.phaseTitle)} · ${article.minutes} min</small></a>`).join('')}</div>`;
  updateChrome();
}

export function renderSource(source) {
  const related = (source.phaseIds ?? []).map((id) => store.phases.find((phase) => phase.id === id)).filter(Boolean);
  store.view.innerHTML = `<div class="crumb"><a href="#/docs">Reference library</a> / ${escapeHtml(source.title)}</div>
    <article class="lesson wide">
      <div class="eyebrow">${source.later ? 'LATER IN THE ROADMAP' : source.role === 'learn' ? 'LEARN / UNDERSTAND' : 'REFERENCE / VERIFY'}</div>
      <h1>${escapeHtml(source.title)}</h1>
      <p class="lede">${escapeHtml(source.summary)}</p>
      <aside class="callout">${escapeHtml(source.rule)}</aside>
      <h2>Use it for</h2>
      <ul>${source.useFor.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      ${related.length ? `<h2>Open this during</h2><div class="chips">${related.map((phase) => `<a href="#/phase/${encodeURIComponent(phase.id)}">${escapeHtml(phase.title)}</a>`).join('')}</div>` : ''}
      <div class="phase-actions">
        <a class="button primary" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">Open official docs ↗</a>
        <a class="button secondary" href="#/docs">Back to the library</a>
      </div>
    </article>`;
  updateChrome();
}

export function renderDoc(article) {
  store.view.innerHTML = `<div class="crumb"><a href="#/docs">Reference library</a> / ${escapeHtml(article.phaseTitle)}</div>
    <article class="lesson wide">
      <div class="eyebrow">${escapeHtml(article.phaseTitle)} · ${article.minutes} MIN</div>
      <h1>${escapeHtml(article.title)}</h1>
      <p class="lede">${escapeHtml(article.summary)}</p>
      ${renderBlocks(article.content)}
      <div class="phase-actions">
        <a class="button primary" href="#/phase/${encodeURIComponent(article.phaseId)}/learn/${encodeURIComponent(article.id)}">Open this lesson in the ${escapeHtml(article.phaseTitle)} workspace</a>
        <a class="button secondary" href="#/docs">Back to the library</a>
      </div>
    </article>`;
  bindCopies(store.view);
  updateChrome();
}

export function renderProjects() {
  store.view.innerHTML = `<div class="section-title"><div><div class="eyebrow">Build the next thing from the last</div><h1>Your project ladder</h1></div></div>
    <p class="lede">Each project introduces the next engineering idea. They are not a pile of unrelated demos. Score a review when you think a deliverable is done.</p>
    <section class="project-grid large">${store.projects.map((project) => {
      const phase = store.phases.find((item) => item.id === project.phaseId);
      const review = store.projectReviews[project.id];
      return `<article class="project" data-review="${escapeHtml(project.id)}">
        <b>${String(project.number).padStart(2, '0')} · ${escapeHtml(project.title)}</b>
        <small>${escapeHtml(project.skills)}</small>
        <p>${escapeHtml(project.brief)}</p>
        <a href="#/phase/${encodeURIComponent(project.phaseId)}">${escapeHtml(phase?.title ?? project.phaseId)} ↗</a>
        ${review ? `<p class="lede">Last review: ${review.overall}/10 — ${escapeHtml(review.nextImprovement)}</p>` : ''}
        <form class="review-form" data-project="${escapeHtml(project.id)}">
          ${(store.reviewCriteria.length ? store.reviewCriteria : []).map((criterion) => `<div class="range-row"><label>${escapeHtml(criterion.label)}</label><input type="range" min="0" max="10" step="1" name="${escapeHtml(criterion.id)}" value="${review?.scores?.[criterion.id] ?? 7}"><output>${review?.scores?.[criterion.id] ?? 7}</output></div>`).join('')}
          <button class="primary-btn" type="submit">Save review</button>
        </form>
      </article>`;
    }).join('')}</section>
    <div class="section-title"><div><div class="eyebrow">Prove what you can do</div><h2>Milestones, not time spent</h2></div></div>
    <section class="milestones">${(store.shell.projectMilestones ?? []).map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</section>`;
  store.view.querySelectorAll('.review-form').forEach((form) => {
    form.querySelectorAll('input[type="range"]').forEach((input) => {
      input.addEventListener('input', () => {
        const output = input.parentElement.querySelector('output');
        if (output) output.textContent = input.value;
      });
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const ratings = Object.fromEntries([...new FormData(form).entries()].map(([key, value]) => [key, Number(value)]));
      try {
        const scored = await request(`/api/projects/${encodeURIComponent(form.dataset.project)}/review`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ratings }),
        });
        applyProgress(scored.progress);
        showNotice(scored.nextImprovement);
        renderProjects();
      } catch (error) {
        showNotice(error.message);
      }
    });
  });
  updateChrome();
}

export async function renderMap() {
  const snapshot = await loadLearning();
  const graph = await request('/api/graph');
  const conceptEdges = graph.edges.filter((edge) => edge.kind === 'concept-requires');
  const byId = Object.fromEntries(graph.nodes.map((node) => [node.id, node]));
  store.view.innerHTML = `<div class="section-title"><div><div class="eyebrow">What you know</div><h1>Knowledge map</h1></div></div>
    <p class="lede">States are derived from evidence: lessons read, exercises passed, quiz scores, and scheduled reviews. Opening a lesson never equals MASTERED. Concept edges show what must be understood before the next idea.</p>
    <div class="map-legend"><span>LOCKED</span><span>AVAILABLE</span><span>LEARNING</span><span>PRACTICING</span><span>REINFORCE</span><span>MASTERED</span></div>
    <div class="preview-list">${snapshot.phases.map((phase) => `<a class="phase-link ${phase.state === 'MASTERED' ? 'done' : ''} ${phase.unlocked ? '' : 'locked'}" href="${phase.unlocked ? `#/phase/${encodeURIComponent(phase.id)}` : '#/map'}">
      <span class="phase-number">${phase.unlocked ? phase.mastery : '⊘'}</span>
      <span><strong>${escapeHtml(phase.title)}</strong><small>${escapeHtml(phase.state.replaceAll('_', ' '))} · knowledge ${phase.knowledge}% · application ${phase.application}%</small></span>
      <span class="phase-duration">${phase.unlocked ? `${phase.exercisesPassed}/${phase.exerciseTotal} exercises` : 'locked'}</span>
    </a>`).join('')}</div>
    <div class="section-title"><div><div class="eyebrow">Concept graph</div><h2>Prerequisites between ideas</h2></div></div>
    <div class="graph-list">${conceptEdges.map((edge) => `<div class="graph-edge glass"><span class="graph-node">${escapeHtml(byId[edge.from]?.title ?? edge.from)}</span> → <span class="graph-node">${escapeHtml(byId[edge.to]?.title ?? edge.to)}</span></div>`).join('')}</div>
    <p class="lede">${graph.nodes.filter((node) => node.kind === 'concept').map((node) => `<span class="graph-node">${escapeHtml(node.title)}</span>`).join('')}</p>`;
  updateChrome();
}

export function renderHabits() {
  store.view.innerHTML = `<div class="section-title"><div><div class="eyebrow">More important than the stack</div><h1>Engineering habits</h1></div></div>
    <section class="habit-grid">${(store.shell.habits ?? []).map((habit) => `<article class="panel"><h3>${escapeHtml(habit.title)}</h3><p>${escapeHtml(habit.body)}</p></article>`).join('')}</section>
    <p class="lede"><a class="button secondary" href="#/git">Open the Git workflow ↗</a></p>`;
  updateChrome();
}

export async function renderGit() {
  const data = await request('/api/git-workflow');
  store.view.innerHTML = `<div class="section-title"><div><div class="eyebrow">Engineering loop</div><h1>${escapeHtml(data.title)}</h1></div></div>
    <p class="lede">${escapeHtml(data.lede)}</p>
    <ol class="git-list">${data.steps.map((step, index) => `<li class="git-step"><b>${String(index + 1).padStart(2, '0')} · ${escapeHtml(step.title)}</b><p>${escapeHtml(step.detail)}</p></li>`).join('')}</ol>
    <div class="section-title"><div><div class="eyebrow">Commit messages</div><h2>Say why the snapshot exists</h2></div></div>
    <div class="preview-list">${data.commits.map((item) => `<article class="phase-link"><span class="phase-number">git</span><span><strong>${escapeHtml(item.example)}</strong><small>${escapeHtml(item.why)}</small></span></article>`).join('')}</div>`;
  updateChrome();
}

export async function renderDebugLab() {
  const data = await request('/api/debug-lab');
  store.view.innerHTML = `<div class="section-title"><div><div class="eyebrow">Broken on purpose</div><h1>Debugging lab</h1></div></div>
    <p class="lede">Read the symptom, form a theory, then check it. The lab grades the diagnosis; it never runs your patch on the API server.</p>
    <div class="lab-list" id="labList">${data.bugs.map((bug) => `<article class="lab-card" data-bug="${escapeHtml(bug.id)}">
      <b>${escapeHtml(bug.title)}</b>
      <p>${escapeHtml(bug.error)}</p>
      <p>Expected: ${escapeHtml(bug.expected)}</p>
      <section class="snippet"><div class="snippet-head"><span>broken.js</span></div><pre><code>${escapeHtml(bug.code)}</code></pre></section>
      <p>${escapeHtml(bug.prompt)}</p>
      <form class="choices">${bug.choices.map((choice, index) => `<label class="choice"><input type="radio" name="choice" value="${index}"><span>${escapeHtml(choice)}</span></label>`).join('')}<button class="primary-btn" type="submit">Check diagnosis</button></form>
      <div class="lab-result"></div>
    </article>`).join('')}</div>`;
  store.view.querySelectorAll('[data-bug]').forEach((card) => {
    const form = card.querySelector('form');
    const result = card.querySelector('.lab-result');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const selected = Number(new FormData(form).get('choice'));
      if (Number.isNaN(selected)) {
        result.innerHTML = '<p class="fail">Choose a diagnosis first.</p>';
        return;
      }
      try {
        const graded = await request(`/api/debug-lab/${encodeURIComponent(card.dataset.bug)}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ selected }),
        });
        result.innerHTML = `<div class="${graded.passed ? 'pass' : 'fail'} box">${graded.passed ? 'Correct.' : 'Not yet.'} ${escapeHtml(graded.explanation)}</div>`;
      } catch (error) {
        result.innerHTML = `<p class="fail">${escapeHtml(error.message)}</p>`;
      }
    });
  });
  updateChrome();
}

export function renderProfile() {
  const snapshot = store.learning;
  store.view.innerHTML = `<div class="section-title"><div><div class="eyebrow">Signed in as ${escapeHtml(store.session?.username ?? '')}</div><h1>Profile & settings</h1></div></div>
    <p class="lede">Change the name the portal uses. Sign out when you leave this machine.</p>
    <article class="panel">
      <form id="profileForm">
        <label class="editor-label" for="learnerName">Display name</label>
        <input id="learnerName" name="name" class="editor auth-input" value="${escapeHtml(store.progress.learner?.name ?? store.session?.name ?? '')}" required maxlength="80">
        <div class="phase-actions">
          <button class="primary-btn" type="submit">Save</button>
          <button type="button" id="logoutBtn">Sign out</button>
        </div>
      </form>
    </article>
    <div class="stat-row">
      <article class="panel"><b>${snapshot?.overall?.completed ?? 0}</b><span>phases complete</span></article>
      <article class="panel"><b>${snapshot?.overall?.masteryPercent ?? 0}%</b><span>mastery</span></article>
      <article class="panel"><b>${snapshot?.thresholds?.quizPass ?? 70}%</b><span>quiz pass bar</span></article>
      <article class="panel"><b>${snapshot?.thresholds?.quizMastery ?? 80}%</b><span>mastery bar</span></article>
    </div>
    <article class="panel">
      <div class="panel-title"><h3>Local backups</h3><span>M20</span></div>
      <p>Copy <code>data/</code> and <code>journal/</code> for a snapshot. Auth cookies stay on this machine. The API never evaluates learner code.</p>
    </article>`;
  store.view.querySelector('#profileForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const saved = await request('/api/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: new FormData(event.target).get('name') }),
      });
      applyProgress(saved);
      if (saved.user) store.session = saved.user;
      showNotice('Profile saved.');
      renderProfile();
    } catch (error) {
      showNotice(error.message);
    }
  });
  store.view.querySelector('#logoutBtn').addEventListener('click', async () => {
    await request('/api/auth/logout', { method: 'POST' });
    store.session = null;
    location.hash = '#/';
    await hooks.render();
  });
  updateChrome();
}

export function renderLanding() {
  const land = store.shell.landing ?? {};
  store.view.innerHTML = `<section class="landing">
      <article class="landing-card">
        <div class="eyebrow">${escapeHtml(land.eyebrow ?? '')}</div>
        <h1>${escapeHtml(land.title ?? 'Fieldnotes')}</h1>
        <p class="lede">${escapeHtml(land.lede ?? '')}</p>
        <div class="landing-grid">${(land.bullets ?? []).map((item) => `<div class="feature-card"><b>${escapeHtml(item)}</b><span>The portal answers this from evidence, not from pages opened.</span></div>`).join('')}</div>
        <div class="actions">
          <a class="button primary" href="${escapeHtml(land.primary?.href ?? '#/register')}">${escapeHtml(land.primary?.label ?? 'Register')} <span>→</span></a>
          <a class="button secondary" href="${escapeHtml(land.secondary?.href ?? '#/login')}">${escapeHtml(land.secondary?.label ?? 'Sign in')}</a>
        </div>
      </article>
    </section>`;
}

export function renderRegister() {
  store.view.innerHTML = `<section class="landing">
      <article class="landing-card auth-card">
        <div class="eyebrow">Create account</div>
        <h1>Register to start Phase 0.</h1>
        <p class="lede">Username plus password. Passwords are hashed on the server. This is still a personal portal on this machine.</p>
        <form id="authForm">
          ${field('name', 'Display name', 'required maxlength="80" autocomplete="name"')}
          ${field('username', 'Username', 'required minlength="3" maxlength="32" autocomplete="username"')}
          ${field('password', 'Password (8+ characters)', 'type="password" required minlength="8" autocomplete="new-password"')}
          <div class="actions"><button class="button primary" type="submit">Create account <span>→</span></button><a class="button secondary" href="#/login">I already have an account</a></div>
        </form>
      </article>
    </section>`;
  bindAuthForm('/api/auth/register');
}

export function renderLogin() {
  store.view.innerHTML = `<section class="landing">
      <article class="landing-card auth-card">
        <div class="eyebrow">Welcome back</div>
        <h1>Sign in.</h1>
        <form id="authForm">
          ${field('username', 'Username', 'required autocomplete="username"')}
          ${field('password', 'Password', 'type="password" required autocomplete="current-password"')}
          <div class="actions"><button class="button primary" type="submit">Sign in <span>→</span></button><a class="button secondary" href="#/register">Create an account</a></div>
        </form>
      </article>
    </section>`;
  bindAuthForm('/api/auth/login');
}

function bindAuthForm(url) {
  store.view.querySelector('#authForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    try {
      const body = await request(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      store.session = body.user;
      await loadWorkspace();
      location.hash = '#/';
      await hooks.render();
    } catch (error) {
      showNotice(error.message);
    }
  });
}
