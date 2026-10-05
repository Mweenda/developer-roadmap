import { escapeHtml, renderBlocks, bindCopies } from './html.js';
import { request } from './api.js';
import { store, applyProgress, loadLearning, reportFor, phaseProgress, setCompleted, updateChrome } from './store.js';
import { runCodeExercise } from './runner-client.js';

export function workspaceTabs(phase, active) {
  return `<nav class="tabs">
    <a class="${active === 'guide' ? 'on' : ''}" href="#/phase/${encodeURIComponent(phase.id)}">Guide</a>
    <a class="${active === 'learn' ? 'on' : ''}" href="#/phase/${encodeURIComponent(phase.id)}/learn/${encodeURIComponent(phase.topics[0].id)}">Lessons</a>
    <a class="${active === 'exercise' ? 'on' : ''}" href="#/phase/${encodeURIComponent(phase.id)}/exercise/${encodeURIComponent(phase.exercises[0].id)}">Exercises</a>
    <a class="${active === 'quiz' ? 'on' : ''}" href="#/phase/${encodeURIComponent(phase.id)}/quiz">Quiz</a>
    <a class="${active === 'journal' ? 'on' : ''}" href="#/journal/phase/${encodeURIComponent(phase.id)}">Journal</a>
  </nav>`;
}

export function workspaceHeader(phase, active) {
  const stats = phaseProgress(phase);
  const done = store.progress.completed.includes(phase.id);
  return `<div class="crumb"><a href="#/roadmap">Roadmap</a> / ${escapeHtml(phase.title)}</div>
    <div class="workspace-head">
      <div>
        <div class="eyebrow">${escapeHtml(phase.duration)} · ${done ? 'COMPLETE' : 'IN PROGRESS'}</div>
        <h1>${escapeHtml(phase.title)}</h1>
        <p>${escapeHtml(phase.summary)}</p>
      </div>
      <article class="progress-card compact">
        <div class="tiny-label">PHASE PROGRESS</div>
        <div class="percent"><strong>${stats.percent}%</strong><span>of this phase</span></div>
        <div class="meter"><i style="width:${stats.percent}%"></i></div>
        <div class="progress-detail">
          <span>${stats.topicsDone}/${stats.topicTotal} lessons</span>
          <span>${stats.exercisesDone}/${stats.exerciseTotal} exercises</span>
          <span>${stats.quizDone ? 'Quiz passed' : 'Quiz open'}</span>
        </div>
      </article>
    </div>
    ${workspaceTabs(phase, active)}`;
}

export async function renderRoadmap() {
  const snapshot = await loadLearning();
  const nextId = snapshot.current?.id;
  store.view.innerHTML = `
    <div class="section-title"><div><div class="eyebrow">17 phases</div><h1>The apprenticeship roadmap</h1></div></div>
    <p class="lede">Later phases stay locked until the previous phase is complete. That is fundamentals before frameworks, not a suggestion.</p>
    <div class="columns">
      <section class="phase-list" aria-label="Learning phases">${store.phases.map((phase, index) => {
        const done = store.progress.completed.includes(phase.id);
        const stats = phaseProgress(phase);
        const report = snapshot.phases.find((item) => item.id === phase.id);
        const locked = report && !report.unlocked;
        const href = locked ? '#/roadmap' : `#/phase/${encodeURIComponent(phase.id)}`;
        return `<article class="phase-card ${done ? 'done' : ''} ${phase.id === nextId ? 'next' : ''} ${locked ? 'locked' : ''}">
          <a class="phase-row" href="${href}">
            <span class="phase-number">${locked ? '⊘' : done ? '✓' : String(index).padStart(2, '0')}</span>
            <span><span class="phase-name">${escapeHtml(phase.title)}</span><span class="phase-summary">${locked ? `Locked until ${escapeHtml(store.phases.find((item) => item.id === report.requires)?.title ?? 'the previous phase')} is complete` : escapeHtml(phase.summary)}</span></span>
            <span class="phase-duration">${locked ? 'LOCKED' : `${escapeHtml(report?.state.replaceAll('_', ' ') ?? '')} · ${stats.percent}%`}</span>
          </a>
          <div class="phase-body open">
            <div class="meter"><i style="width:${stats.percent}%"></i></div>
            <p>Knowledge ${report?.knowledge ?? 0}% · Application ${report?.application ?? 0}% · Mastery ${report?.mastery ?? 0}%</p>
            ${locked ? '' : `<div class="phase-actions">
              <a class="button-link" href="#/phase/${encodeURIComponent(phase.id)}">Open phase workspace</a>
              <button type="button" data-complete="${escapeHtml(phase.id)}">${done ? 'Mark in progress' : 'Mark complete ✓'}</button>
            </div>`}
          </div>
        </article>`;
      }).join('')}</section>
      <aside class="right-rail">
        <article class="panel advice"><div class="panel-title"><h3>Evidence, not clicks</h3><span>MASTERY</span></div>
          <ol class="plain"><li>Read the concept</li><li>Practice until exercises pass</li><li>Pass the quiz (70% to continue, 80% toward mastery)</li><li>Write the phase gate in the journal</li></ol>
          <p>React stays locked until JavaScript, the browser, HTTP, Node, SQL, Express, and auth are complete.</p>
        </article>
        <article class="panel"><div class="panel-title"><h3>Engineering habits</h3><span>CONTINUOUS</span></div>
          <ul><li>Git from day one</li><li>Debug with evidence</li><li>Read official docs</li><li>AI is a teacher, not autopilot</li></ul>
          <p><a href="#/habits">Full habit list ↗</a></p>
        </article>
      </aside>
    </div>`;
  store.view.querySelectorAll('[data-complete]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const phaseId = button.dataset.complete;
      await setCompleted(phaseId, !store.progress.completed.includes(phaseId));
      renderRoadmap();
    });
  });
  updateChrome();
}

export async function renderPhaseGuide(phase) {
  await loadLearning();
  const report = reportFor(phase.id);
  if (report && !report.unlocked) {
    const required = store.phases.find((item) => item.id === report.requires);
    store.view.innerHTML = `${workspaceHeader(phase, 'guide')}
      <section class="lesson">
        <aside class="callout">This phase is locked. Fundamentals before frameworks: complete ${escapeHtml(required?.title ?? 'the previous phase')} with exercises and a passing quiz first.</aside>
        <p>${escapeHtml(phase.summary)}</p>
        <div class="phase-actions"><a class="button primary" href="#/phase/${encodeURIComponent(report.requires)}">Go to ${escapeHtml(required?.title ?? 'the previous phase')}</a></div>
      </section>`;
    updateChrome();
    return;
  }
  store.view.innerHTML = `${workspaceHeader(phase, 'guide')}
    <section class="lesson">
      <h2>What you should be able to do</h2>
      <ul>${phase.expected.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      <h2>Advice</h2>
      <p>${escapeHtml(phase.advice)}</p>
      <h2>Code examples</h2>
      ${phase.snippets.map((snippet) => `<section class="snippet"><div class="snippet-head"><span>${escapeHtml(snippet.label)} · ${escapeHtml(snippet.language)}</span><button type="button">Copy</button></div><pre><code>${escapeHtml(snippet.code)}</code></pre></section>`).join('')}
      <h2>Official documentation for this phase</h2>
      ${phase.library?.sources?.length ? `<aside class="callout">${escapeHtml(phase.library.use)} ${escapeHtml(phase.library.skip)}</aside>
      <div class="library-now">${phase.library.sources.map((source) => `<a class="lib-card ${source.later ? 'later' : ''}" href="#/docs/${encodeURIComponent(source.id)}"><strong>${escapeHtml(source.title)}</strong><small>${source.role === 'learn' ? 'Learn / understand' : 'Reference / verify'} · ${escapeHtml(source.summary)}</small></a>`).join('')}</div>
      <p class="lede">Open the official site when you are stuck. In-app lessons teach the path; these sources are the authority.</p>` : ''}
      <div class="doc-resources">${(phase.library?.sources?.length ? phase.library.sources : phase.resources).map((resource) => `<a href="${escapeHtml(resource.url)}" target="_blank" rel="noreferrer">${escapeHtml(resource.title ?? resource.label)} ↗</a>`).join('')}</div>
      <div class="phase-actions">
        <a class="button primary" href="#/phase/${encodeURIComponent(phase.id)}/learn/${encodeURIComponent(phase.topics[0].id)}">Start lessons</a>
        <a class="button secondary" href="#/journal/phase/${encodeURIComponent(phase.id)}">Document this phase</a>
      </div>
    </section>`;
  bindCopies(store.view);
  updateChrome();
}

export function renderTopic(phase, topicId) {
  const topic = phase.topics.find((item) => item.id === topicId) ?? phase.topics[0];
  const read = store.progress.topics.includes(topic.id);
  store.view.innerHTML = `${workspaceHeader(phase, 'learn')}
    <div class="split">
      <nav class="toc">${phase.topics.map((item) => `<a class="${item.id === topic.id ? 'on' : ''} ${store.progress.topics.includes(item.id) ? 'done' : ''}" href="#/phase/${encodeURIComponent(phase.id)}/learn/${encodeURIComponent(item.id)}">${store.progress.topics.includes(item.id) ? '✓ ' : ''}${escapeHtml(item.title)}<small>${item.minutes} min</small></a>`).join('')}</nav>
      <article class="lesson">
        <div class="eyebrow">PHASE DOCUMENTATION · ${topic.minutes} MIN</div>
        <h2>${escapeHtml(topic.title)}</h2>
        <p class="lede">${escapeHtml(topic.summary)}</p>
        ${renderBlocks(topic.content)}
        <div class="phase-actions">
          <button type="button" class="primary-btn" data-topic="${escapeHtml(topic.id)}">${read ? 'Mark unread' : 'Mark lesson complete'}</button>
        </div>
        ${phase.library?.sources?.length ? `<div class="doc-resources tight">${phase.library.sources.map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">Look up: ${escapeHtml(source.title)} ↗</a>`).join('')}</div>` : ''}
      </article>
    </div>`;
  bindCopies(store.view);
  store.view.querySelector('[data-topic]').addEventListener('click', async () => {
    applyProgress(await request('/api/progress/topics', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ topicId: topic.id, completed: !read }),
    }));
    renderTopic(phase, topic.id);
  });
  updateChrome();
}

function exerciseStatus(exercise) {
  const record = store.progress.exercises[exercise.id];
  if (record?.passed || record?.completed) return 'Passed';
  if (record?.attempts) return 'Attempted';
  return 'Open';
}

export function renderExercise(phase, exerciseId) {
  const exercise = phase.exercises.find((item) => item.id === exerciseId) ?? phase.exercises[0];
  store.view.innerHTML = `${workspaceHeader(phase, 'exercise')}
    <div class="split">
      <nav class="toc">${phase.exercises.map((item) => `<a class="${item.id === exercise.id ? 'on' : ''}" href="#/phase/${encodeURIComponent(phase.id)}/exercise/${encodeURIComponent(item.id)}">${escapeHtml(item.title)}<small>${item.type} · ${exerciseStatus(item)}</small></a>`).join('')}</nav>
      <article class="lesson" id="exercisePanel"></article>
    </div>`;
  const panel = store.view.querySelector('#exercisePanel');
  panel.innerHTML = `<div class="eyebrow">${escapeHtml(exercise.type)} EXERCISE</div><h2>${escapeHtml(exercise.title)}</h2><p class="lede">${escapeHtml(exercise.prompt)}</p>${exercise.code ? `<section class="snippet"><div class="snippet-head"><span>snippet</span></div><pre><code>${escapeHtml(exercise.code)}</code></pre></section>` : ''}${renderExerciseBody(exercise)}
    <aside class="panel" style="margin-top:14px">
      <div class="panel-title"><h3>Mentor</h3><span>HINTS 0–5</span></div>
      <p>Ask only after you have tried. Each level is more help; the last level is the solution.</p>
      <div class="hint-ladder" id="hintLadder"></div>
      <div id="hintBox"></div>
    </aside>`;
  bindExercise(phase, exercise, panel);
  bindMentor(exercise, panel);
  updateChrome();
}

function renderExerciseBody(exercise) {
  if (exercise.type === 'code') {
    return `<label class="editor-label" for="code">Your function</label>
      <textarea id="code" class="editor" spellcheck="false">${escapeHtml(exercise.starter)}</textarea>
      <div class="phase-actions">
        <button type="button" class="primary-btn" data-run>Run tests</button>
        <button type="button" data-reveal>Show a worked solution</button>
      </div>
      <div id="exerciseResult"></div>`;
  }
  if (exercise.type === 'build') {
    return `<ol class="plain">${exercise.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
      <div class="phase-actions"><button type="button" class="primary-btn" data-build>I completed this deliverable</button></div>
      <div id="exerciseResult"></div>`;
  }
  return `<form id="choiceForm" class="choices">${exercise.choices.map((choice, index) => `<label class="choice"><input type="radio" name="choice" value="${index}"><span>${escapeHtml(choice)}</span></label>`).join('')}<button class="primary-btn" type="submit">Check answer</button></form><div id="exerciseResult"></div>`;
}

function bindExercise(phase, exercise, panel) {
  const result = panel.querySelector('#exerciseResult');
  const form = panel.querySelector('#choiceForm');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const selected = Number(new FormData(form).get('choice'));
      if (Number.isNaN(selected)) {
        result.innerHTML = '<p class="fail">Choose an answer first.</p>';
        return;
      }
      try {
        const graded = await request(`/api/exercises/${encodeURIComponent(exercise.id)}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ selected }),
        });
        applyProgress(graded.progress);
        result.innerHTML = `<div class="${graded.passed ? 'pass' : 'fail'} box">${graded.passed ? 'Correct.' : 'Not yet.'} ${escapeHtml(graded.explanation)}</div>`;
        renderExercise(phase, exercise.id);
        store.view.querySelector('#exerciseResult').innerHTML = result.innerHTML;
      } catch (error) {
        result.innerHTML = `<p class="fail">${escapeHtml(error.message)}</p>`;
      }
    });
  }
  panel.querySelector('[data-run]')?.addEventListener('click', async () => {
    const code = panel.querySelector('#code').value;
    const results = await runCodeExercise(exercise, code);
    const passed = results.every((item) => item.pass);
    result.innerHTML = `<ul class="results">${results.map((item) => `<li class="${item.pass ? 'pass' : 'fail'}">${escapeHtml(item.label)} — ${item.pass ? 'passed' : escapeHtml(item.error ?? `expected ${JSON.stringify(item.expected)}, got ${JSON.stringify(item.actual)}`)}</li>`).join('')}</ul>`;
    if (passed) {
      const graded = await request(`/api/exercises/${encodeURIComponent(exercise.id)}/submit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ passed: true }),
      });
      applyProgress(graded.progress);
      result.innerHTML += `<div class="pass box">All tests passed. Progress saved.${graded.solution ? `<pre><code>${escapeHtml(graded.solution)}</code></pre>` : ''}</div>`;
    }
  });
  panel.querySelector('[data-reveal]')?.addEventListener('click', async () => {
    const revealed = await request(`/api/exercises/${encodeURIComponent(exercise.id)}/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reveal: true }),
    });
    result.innerHTML = `<div class="box"><p>Worked solution — type it from memory after you read it.</p><pre><code>${escapeHtml(revealed.solution)}</code></pre></div>`;
  });
  panel.querySelector('[data-build]')?.addEventListener('click', async () => {
    const graded = await request(`/api/exercises/${encodeURIComponent(exercise.id)}/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    applyProgress(graded.progress);
    result.innerHTML = `<div class="pass box">Deliverable marked complete. ${escapeHtml(graded.solution ?? '')}</div>`;
  });
}

function bindMentor(exercise, panel) {
  const used = Number(store.hints[exercise.id] ?? 0);
  const ladder = panel.querySelector('#hintLadder');
  const box = panel.querySelector('#hintBox');
  if (!ladder) return;
  ladder.innerHTML = [0, 1, 2, 3, 4, 5].map((level) => `<button type="button" class="${level <= used ? 'primary-btn' : 'secondary'}" data-hint="${level}">Level ${level}</button>`).join('');
  ladder.querySelectorAll('[data-hint]').forEach((button) => {
    button.addEventListener('click', async () => {
      const level = Number(button.dataset.hint);
      try {
        const help = await request(`/api/mentor?exerciseId=${encodeURIComponent(exercise.id)}&level=${level}`);
        store.hints[exercise.id] = Math.max(used, help.level);
        box.innerHTML = `<div class="box"><p><b>${escapeHtml(help.name)}</b></p><p>${escapeHtml(help.text)}</p></div>`;
      } catch (error) {
        box.innerHTML = `<p class="fail">${escapeHtml(error.message)}</p>`;
      }
    });
  });
}

export function renderQuiz(phase) {
  const previous = store.progress.quizzes[phase.id];
  store.view.innerHTML = `${workspaceHeader(phase, 'quiz')}
    <article class="lesson">
      <div class="eyebrow">PASSING SCORE ${phase.quiz.passingScore}%</div>
      <h2>Phase quiz</h2>
      <p class="lede">This checks whether you understand the phase, not whether you can recast the syntax. Answers are graded on the server.</p>
      ${previous ? `<p>Last attempt: <b>${previous.score}%</b> · ${previous.passed ? 'passed' : 'not yet'} · ${previous.attempts} attempt(s)</p>` : ''}
      <form id="quizForm">${phase.quiz.questions.map((question, index) => `<fieldset class="question"><legend>${index + 1}. ${escapeHtml(question.prompt)}</legend>${question.choices.map((choice, choiceIndex) => `<label class="choice"><input type="radio" name="${escapeHtml(question.id)}" value="${choiceIndex}"><span>${escapeHtml(choice)}</span></label>`).join('')}</fieldset>`).join('')}<button class="primary-btn" type="submit">Submit quiz</button></form>
      <div id="quizResult"></div>
    </article>`;
  store.view.querySelector('#quizForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const answers = {};
    for (const question of phase.quiz.questions) {
      const value = data.get(question.id);
      if (value !== null) answers[question.id] = Number(value);
    }
    try {
      const graded = await request(`/api/phases/${encodeURIComponent(phase.id)}/quiz`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      applyProgress(graded.progress);
      const result = store.view.querySelector('#quizResult');
      result.innerHTML = `<div class="${graded.passed ? 'pass' : 'fail'} box"><p><b>${graded.score}%</b> — ${graded.correct}/${graded.total} correct. ${graded.passed ? 'Quiz passed.' : 'Score at least ' + phase.quiz.passingScore + '% to pass.'}</p></div>
        <ol class="review">${graded.results.map((item, index) => {
          const question = phase.quiz.questions[index];
          return `<li class="${item.isCorrect ? 'pass' : 'fail'}"><p>${escapeHtml(question.prompt)}</p><p>${item.isCorrect ? 'Correct' : `Your answer: ${question.choices[item.selected] ?? 'blank'}. Correct: ${question.choices[item.correct]}`}</p><p>${escapeHtml(item.explanation)}</p></li>`;
        }).join('')}</ol>`;
      result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      store.notice.textContent = error.message;
      store.notice.hidden = !error.message;
    }
  });
  updateChrome();
}
