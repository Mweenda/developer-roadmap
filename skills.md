# MVP spec — stop, implement, then audit

Source of truth: [`docs/MVP_Spec.pdf`](docs/MVP_Spec.pdf). Companion: [`docs/PRODUCT.md`](docs/PRODUCT.md). Cursor skill: [`.cursor/skills/mvp-spec/SKILL.md`](.cursor/skills/mvp-spec/SKILL.md).

## Git branches

Work on **`dev`**. **`main` is only updated by merging `dev`.** Never commit feature work directly to `main`. Never merge `main` into `dev` as a substitute for finishing work on `dev`. Pull requests flow `dev` → `main`. After the ship gate below, push `dev` to GitHub and deploy Firebase Hosting’s **live** channel from that branch.

## Hard rule

**If a feature from `./docs/MVP_Spec.pdf` is missing, the development team must STOP and implement that feature, ensure all tests pass (`pnpm test`), then proceed to audit.**

Do not continue the audit, do not start the next milestone, and do not add unrelated work while a spec feature is missing.

Order:

1. Compare the running product to `docs/MVP_Spec.pdf`.
2. If anything required is missing → **stop**.
3. Implement that feature (content in `src/data/`, not hardcoded UI).
4. Run `pnpm test` until the suite is green.
5. Only then resume the audit or move to the next milestone.

Tackle milestones **one by one**. Do not build the entire platform at once (spec §10).

## Development rule (§24)

A feature ships only if it makes the learner better at understanding, reasoning, building, debugging, or engineering software.

## Content rule (§17)

Lessons, exercises, quizzes, habits, landing copy, and projects live in `src/data/`. The UI renders data.

## MVP loop (§13–§14)

```text
Landing → Register / Login → Dashboard ("Start Phase 0.") → Roadmap → Phase
  → Topic → Lesson → Exercise → Quiz → Score → Weak areas → Review → Gate → Unlock
```

| Step | Status |
| --- | --- |
| Landing page | Done (`src/data/shell.js` → `#/`) |
| Authentication (register, login, session cookie) | Done (`/api/auth/*`, scrypt, HttpOnly `sid`) |
| Dashboard opens | Done |
| System says "Start Phase 0." | Done |
| Lesson → exercise → feedback → quiz → score | Done |
| Weak concepts + review schedule | Done |
| Milestone gate → next phase unlocks | Done |
| Variables, types, operators, conditionals, loops, functions | Done |

## Milestone todo list

Work top to bottom. Check a milestone off only after its review gate is true **and** `pnpm test` is green.

- [x] **M0** Product foundation — spec, states, mastery, API
- [x] **M1** Application shell — landing, layout, nav, dashboard, profile
- [x] **M2** Roadmap engine — phases, prerequisites, lock/unlock
- [x] **M3** Lesson engine — data-driven concept lessons
- [x] **M4** Exercise engine — choice, predict, debug, code, build
- [x] **M5** Isolated code execution — in-browser Worker + timeout; API never evals learner code
- [x] **M6** Quiz engine — phase quizzes, scores, retake
- [x] **M7** Mastery engine — evidence, not “opened the lesson”
- [x] **M8** Review / spaced practice — quiz schedules `REVIEW_DUE`
- [x] **M9** Adaptive learning engine — strong / weak / forgotten / recommended
- [x] **M10** Documentation / reference center
- [x] **M11** Milestone review gates (journal phase-gate)
- [x] **M12** Project engine (ladder)
- [x] **M13** Project review system — 9 dimensions + next improvement
- [x] **M14** Git / engineering workflow teaching
- [x] **M15** Debugging lab
- [x] **M16** Mentor hint ladder (levels 0–5) plus Gemini curriculum tutor (guide, never give the answer)
- [x] **M17** Knowledge graph — concept edges on the map
- [x] **M18** Personal learning dashboard
- [x] **M19** Full concept-level curriculum depth (17 phases, ≥2 content blocks/topic)
- [x] **M20** Production readiness — auth, health, request logging header, local backup note (Postgres later)

## Test suite

Run from the repository root:

```sh
pnpm test
```

That is the test gate. GitHub Actions runs the same command on every push and pull request to `main` and `dev`. **If a test fails, stop. Tweak the implementation or the test until `pnpm test` is green, then continue.** Do not push, deploy, or start the next milestone on a red suite.

| File | What it proves |
| --- | --- |
| `test/app.test.js` | API, docs, library, quizzes, exercise submit, phase auto-complete |
| `test/auth.test.js` | Register, login, session cookie, landing copy from data |
| `test/helpers.js` | Test server + cookie helper (not a test file) |
| `test/journal.test.js` | Journal folders, templates, path sandbox |
| `test/learning.test.js` | Phase locks, mastery vs opened lesson, `REVIEW_DUE` |
| `test/learning-engine.test.js` | `/api/learning` command center |
| `test/library.test.js` | Official reference library |
| `test/milestones.test.js` | M5 runner, M9 adaptive, M13–M17, M19 depth, M20 APIs + UI |
| `test/mvp.test.js` | JS fundamentals headings, “Start Phase 0.” |
| `test/progress.test.js` | Progress store persistence and validation |
| `test/roadmap.test.js` | 17 phases and javascript-core content |
| `test/celebrate.test.js` | Pass fireworks, center insight dialog, back/proceed locked until the stage is done |
| `test/studio.test.js` | Start Phase opens lesson studio; chatbot is a corner icon, not a nav `?` |
| `test/tutor.test.js` | Gemini tutor: chapter docs, no spoilers, auth, chatbot widget, `.env` ignored |
| `test/account.test.js` | Profile is in the avatar menu, not the sidebar; Settings and Sign out live there too |
| `test/exercise-lab.test.js` | Exercise briefing popup, sandboxed terminal grading, Genkit/Firebase env |
| `test/firebase-hosting.test.js` | Hosting rewrites `/api`; App Hosting uses Firestore; `__session` cookie |

Watch mode: `pnpm test:watch`. Rebuild CSS before a production start: `pnpm build`.

## Deployment architecture

Do **not** deploy a static-only Firebase Hosting site. That would drop `/api`.

```text
GitHub `dev`
   → pnpm test && pnpm build
   → Node/Express (frontend + /api)
        → Firebase App Hosting (Cloud Run)  and/or
        → Hosting + Cloud Function rewrite for `/api/**`
   → Firestore for auth, progress, journal
```

Local `pnpm dev` still uses `data/` and `journal/` on disk. Cloud Run and Cloud Functions set `FIELDNOTES_DATA=firestore` (see `apphosting.yaml`) so production-critical learner state is not the container filesystem.

Smoke-test after a live deploy: `/` (UI), `/api/health` (`storage` must be `firestore`, `api` true), register/login, then a progress write that survives a cold start.

Cloud Functions and App Hosting require the Firebase **Blaze** plan. Enable billing for `fieldnotes-apprenticeship` before the first live deploy.

## Ship gate

Whenever a feature is implemented successfully, ship it. Do not leave finished work uncommitted on the machine.

1. `pnpm test` is green.
2. `pnpm build` completes with **no chunking errors**.
3. If the build or `test/size.test.js` reports a public JS file over **32KB** or `src/public/styles.css` over **48KB**, **stop**. Split `src/public` into smaller ES modules until every chunk is under the limit and the suite is green. Do not raise the size cap to make the error go away.
4. Commit on **`dev`** (never `.env`, `data/users.json`, or API keys).
5. Push to GitHub: `git push -u origin HEAD`.
6. Deploy only a Node/Express target that still serves `/api` (App Hosting and/or Hosting + the `api` function). Never a static-only `public/` folder.

```sh
firebase deploy --only hosting,functions,firestore --project fieldnotes-apprenticeship
```

## Housekeeping

- No empty folders. No unused imports.
- Never execute arbitrary learner code on the application server.
- Passwords are hashed (scrypt). Do not commit `data/users.json`, `.env`, or plaintext secrets.
