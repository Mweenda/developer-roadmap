import { expect, test } from '@playwright/test';

const isVercel = /vercel\.app/i.test(process.env.BASE_URL ?? '');

function uniqueUser() {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.slice(0, 20);
  return {
    name: 'E2E Learner',
    username: `e2e_${suffix}`.slice(0, 32),
    password: 'password123',
  };
}

test.describe.serial('apprenticeship portal', () => {
  const user = uniqueUser();

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.textContent = '*, *::before, *::after { animation: none !important; transition: none !important; }';
      document.documentElement.appendChild(style);
    });
  });

  test('health API stays up and names its storage', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok(), await response.text()).toBeTruthy();
    const health = await response.json();
    expect(health.ok).toBe(true);
    expect(health.api).toBe(true);
    expect(['disk', 'firestore']).toContain(health.storage);
    if (isVercel) {
      expect(health.storage, 'Vercel must not use ephemeral disk for learner progress').toBe('firestore');
    }
  });

  test('landing, register, dashboard, and session match local', async ({ page, context }) => {
    await page.goto('/');
    await expect(page.locator('body')).toHaveClass(/public/);
    await expect(page.locator('#view h1')).toContainText('Learn, practice, prove it, then move on.');
    await expect(page.locator('.sidebar')).toBeHidden();
    await expect(page.getByText('YOUR WORKSPACE')).toBeHidden();
    await expect(page.locator('#view h1')).not.toContainText('Start Phase 0.');
    await expect(page.locator('.feature-card span').first()).toContainText('Mock snapshot');
    await expect(page.getByRole('link', { name: /Create your learner account/i })).toHaveAttribute('href', '#/register');
    await page.goto('/#/register');
    await expect(page.locator('#view h1')).toContainText('Register to start Phase 0.');
    await page.locator('#name').fill(user.name);
    await page.locator('#username').fill(user.username);
    await page.locator('#password').fill(user.password);
    await page.getByRole('button', { name: /Create account/i }).click({ force: true });
    await expect(page).toHaveURL(/#\/overview/);
    await expect(page.locator('#view h1')).toContainText('Start Phase 0.');
    const cookies = await context.cookies();
    const session = cookies.find((cookie) => cookie.name === '__session');
    expect(session?.value).toBeTruthy();
    expect(session?.httpOnly).toBe(true);
    if (page.url().startsWith('https://')) expect(session?.secure).toBe(true);

    await page.goto('/');
    await expect(page.locator('body')).toHaveClass(/public/);
    await expect(page.locator('#view h1')).toContainText('Learn, practice, prove it, then move on.');
    await expect(page.locator('.sidebar')).toBeHidden();
    await page.goto('/#/overview');
    await expect(page.locator('#view h1')).toContainText('Start Phase 0.');
    await expect(page.locator('#tutorFab')).toBeVisible();
  });

  test('lesson progress and journal survive a reload', async ({ page }) => {
    await page.goto('/#/login');
    await page.locator('#username').fill(user.username);
    await page.locator('#password').fill(user.password);
    await page.getByRole('button', { name: /Sign in/i }).click({ force: true });
    await expect(page).toHaveURL(/#\/overview/);
    await expect(page.locator('#view h1')).toContainText('Start Phase 0.');
    await page.goto('/#/phase/environment/learn/environment__terminal');
    await expect(page.getByRole('button', { name: 'Mark lesson complete' })).toBeVisible();
    await page.getByRole('button', { name: 'Mark lesson complete' }).click({ force: true });
    await expect(page.getByRole('button', { name: 'Mark unread' })).toBeVisible();

    await page.goto('/#/journal');
    await expect(page.locator('#view h1')).toContainText('Your learning journal');
    await page.goto('/#/journal/edit/debugging.md');
    await expect(page.locator('#journalText')).toBeVisible();
    const note = `E2E journal ${user.username}`;
    await page.locator('#journalText').fill(`# Debugging\n\n${note}\n`);
    await page.locator('#saveJournal').click({ force: true });
    await expect(page.locator('#saveState')).toContainText(/saved/i);

    await page.reload();
    await page.goto('/#/journal/edit/debugging.md');
    await expect(page.locator('#journalText')).toContainText(note);
    await page.goto('/#/phase/environment/learn/environment__terminal');
    await expect(page.getByRole('button', { name: 'Mark unread' })).toBeVisible();

    await page.goto('/#/roadmap');
    await expect(page.locator('#view h1')).toContainText('The apprenticeship roadmap');
    await page.goto('/#/docs');
    await expect(page.locator('#view h1')).toContainText('Developer reference library');
  });

  test('sign out and sign in keep the same learner', async ({ page }) => {
    await page.goto('/#/login');
    await page.locator('#username').fill(user.username);
    await page.locator('#password').fill(user.password);
    await page.getByRole('button', { name: /Sign in/i }).click({ force: true });
    await expect(page).toHaveURL(/#\/overview/);
    await expect(page.locator('#view h1')).toContainText(/Start Phase 0|Learn:/);
    await page.locator('#accountBtn').click({ force: true });
    await page.locator('[data-logout]').click({ force: true });
    await expect(page.locator('#view h1')).toContainText('Learn, practice, prove it, then move on.');
    await page.goto('/#/login');
    await page.locator('#username').fill(user.username);
    await page.locator('#password').fill(user.password);
    await page.getByRole('button', { name: /Sign in/i }).click({ force: true });
    await expect(page).toHaveURL(/#\/overview/);
    await expect(page.locator('#view h1')).toContainText(/Start Phase 0|Learn:/);
    await page.goto(`/#/phase/environment/learn/environment__terminal`);
    await expect(page.getByRole('button', { name: 'Mark unread' })).toBeVisible();
  });
});
