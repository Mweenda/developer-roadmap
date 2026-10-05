import { escapeHtml } from './html.js';
import { store } from './store.js';

function burstFireworks(canvas) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width = window.innerWidth;
  const height = canvas.height = window.innerHeight;
  const particles = [];
  const colors = ['#2dd4bf', '#38bdf8', '#c4b5fd', '#fb7185', '#fbbf24'];

  function boom(x, y) {
    for (let i = 0; i < 42; i += 1) {
      const angle = (Math.PI * 2 * i) / 42;
      const speed = 2 + Math.random() * 4;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: colors[i % colors.length],
      });
    }
  }

  for (let n = 0; n < 5; n += 1) {
    boom(width * (0.2 + Math.random() * 0.6), height * (0.15 + Math.random() * 0.35));
  }

  const started = performance.now();
  function tick(now) {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.life -= 0.012;
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (now - started < 2400) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, width, height);
  }
  requestAnimationFrame(tick);
}

export function closeCelebrate() {
  const layer = document.querySelector('#celebrateLayer');
  if (layer) layer.hidden = true;
}

export function celebratePass({ title, insight, backHref, nextHref, nextEnabled }) {
  const layer = document.querySelector('#celebrateLayer');
  const dialog = document.querySelector('#celebrateDialog');
  const canvas = document.querySelector('#fireworks');
  if (!layer || !dialog) return;
  const copy = store.shell.celebrate ?? {};
  document.querySelector('#celebrateTitle').textContent = title;
  document.querySelector('#celebrateInsight').textContent = insight;
  const back = document.querySelector('#celebrateBack');
  const next = document.querySelector('#celebrateNext');
  back.textContent = copy.backLabel ?? 'Go back';
  back.href = backHref;
  next.textContent = copy.nextLabel ?? 'Proceed';
  next.href = nextHref;
  next.classList.toggle('is-disabled', !nextEnabled);
  next.setAttribute('aria-disabled', String(!nextEnabled));
  if (!nextEnabled) next.removeAttribute('href');
  const dismiss = document.querySelector('#celebrateDismiss');
  if (dismiss) dismiss.textContent = copy.dismissLabel ?? 'Keep working';
  layer.hidden = false;
  dialog.focus();
  if (canvas) burstFireworks(canvas);
}

export function bindCelebrate() {
  document.querySelector('#celebrateDismiss')?.addEventListener('click', closeCelebrate);
  document.querySelector('#celebrateBack')?.addEventListener('click', closeCelebrate);
  document.querySelector('#celebrateNext')?.addEventListener('click', (event) => {
    if (event.currentTarget.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      return;
    }
    closeCelebrate();
  });
}

export function renderStageNav(nav) {
  const copy = store.shell.celebrate ?? {};
  return `<nav class="stage-nav">
    <a class="button secondary" href="${nav.back.href}">${escapeHtml(copy.backLabel ?? 'Go back')}</a>
    ${nav.next.enabled
      ? `<a class="button primary" href="${nav.next.href}">${escapeHtml(copy.nextLabel ?? 'Proceed')}</a>`
      : `<span class="button primary is-disabled" aria-disabled="true">${escapeHtml(copy.waitLabel ?? 'Finish this stage to proceed')}</span>`}
  </nav>`;
}
