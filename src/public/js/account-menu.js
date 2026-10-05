import { escapeHtml } from './html.js';
import { request } from './api.js';
import { store, hooks, initials } from './store.js';

function closeMenu() {
  const menu = document.querySelector('#accountMenu');
  const button = document.querySelector('#accountBtn');
  if (!menu || !button) return;
  menu.hidden = true;
  button.setAttribute('aria-expanded', 'false');
}

async function signOut() {
  await request('/api/auth/logout', { method: 'POST' });
  store.session = null;
  closeMenu();
  location.hash = '#/';
  await hooks.render();
}

function fillAccountMenu() {
  const button = document.querySelector('#accountBtn');
  const menu = document.querySelector('#accountMenu');
  if (!button || !menu) return;
  const copy = store.shell.accountMenu ?? { items: [] };
  button.setAttribute('aria-label', copy.label ?? 'Account menu');
  const name = store.session?.name ?? store.progress.learner?.name ?? '';
  const username = store.session?.username ?? '';
  const head = name || username
    ? `<div class="account-head"><b>${escapeHtml(name || username)}</b>${username ? `<span>@${escapeHtml(username)}</span>` : ''}</div>`
    : '';
  menu.innerHTML = head + (copy.items ?? []).map((item) => {
    if (item.action === 'logout') {
      return `<button type="button" class="account-item account-item-danger" role="menuitem" data-logout>${escapeHtml(item.label)}</button>`;
    }
    return `<a class="account-item" role="menuitem" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`;
  }).join('');
}

export function bindAccountMenu() {
  const button = document.querySelector('#accountBtn');
  const menu = document.querySelector('#accountMenu');
  if (!button || !menu || button.dataset.bound) return;
  button.dataset.bound = '1';
  fillAccountMenu();
  button.textContent = initials(store.session?.name ?? store.progress.learner?.name);
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = menu.hidden;
    if (open) fillAccountMenu();
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', (event) => {
    event.stopPropagation();
    if (event.target.closest('[data-logout]')) signOut();
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('click', (event) => {
    if (!menu.hidden && !menu.contains(event.target) && event.target !== button) closeMenu();
  });
  window.addEventListener('hashchange', closeMenu);
}
