# Developer Roadmap

A project-led JavaScript apprenticeship with in-app documentation, embedded exercises, quizzes, and server-persisted progress. The `docs/Roadmap.pdf` blueprint is the curriculum. `docs/PRODUCT.md` is the product spec and milestone backlog: this is an apprenticeship engine, not a course catalog.

## Requirements

- Node.js 20 or newer
- pnpm 10 or newer

## Run the application

```sh
pnpm install
pnpm dev
```

Open <http://localhost:3000>. For a regular server start, use `pnpm start`.

## Test-first workflow

Tests use Node's built-in test runner and cover roadmap content, progress persistence/validation, and the Express API.

```sh
pnpm test
pnpm test:watch
```

When adding or changing a behavior, write or update its test first, run it to confirm the expected failure, implement the behavior, then rerun the full suite.

## Project layout

- `src/public/` — interactive learning workspace
- `src/data/` — 17 phases with lessons, exercises, quizzes, and the project ladder
- `src/app.js` — Express routes and static frontend
- `src/server/` — JSON file progress store
- `data/progress.json` — generated progress state (ignored by Git)
- `journal/` — your learning notes, reviews, gates, bugs, and ADRs (created as you go)
- `test/` — curriculum, store, grading, and API tests

## API

- `GET /api/phases` — phase list with lesson/exercise/quiz counts
- `GET /api/phases/:id` — guide, documentation lessons, exercises, and quiz (answers omitted)
- `POST /api/phases/:id/quiz` — body: `{ "answers": { "q1": 0 } }` — server-graded; 70% to pass
- `GET /api/docs` — in-app lessons
- `GET /api/docs/:id` — one lesson
- `GET /api/library` — official reference library (MDN, JavaScript.info, Node, Express, React, …)
- `GET /api/library/:id` — one official source, including which phases should open it
- `GET /api/projects` — project ladder
- `GET /api/learning` — next action, today, weak areas, review queue, mastery, lock state
- `GET /api/shell` — landing copy, habits, and project milestone labels
- `GET /api/auth/me` — current session (`{ "user": null }` when signed out)
- `POST /api/auth/register` — body: `{ "name", "username", "password" }` (password ≥ 8; HttpOnly session cookie)
- `POST /api/auth/login` — body: `{ "username", "password" }`
- `POST /api/auth/logout`
- `GET /api/profile` — display name (session required)
- `PUT /api/profile` — body: `{ "name": "Ada" }` (session required)
- `PUT /api/progress` — body: `{ "phaseId": "javascript-core", "completed": true }`
- `PUT /api/progress/topics` — body: `{ "topicId": "javascript-core__scope", "completed": true }`
- `POST /api/exercises/:id/submit` — choice `{ "selected": 1 }`, code `{ "passed": true }`, or build `{ "completed": true }`
- `GET /api/journal` — journal index (root files only until a phase is opened)
- `POST /api/journal/phases/:id/open` — create that phase's folder from templates
- `GET /api/journal/file?path=` — read a markdown file
- `POST /api/journal/file` — create a note, weekly review, bug, or ADR from a template
- `PUT /api/journal/file` — body: `{ "path": "00-foundations/notes.md", "content": "..." }`

A phase auto-completes when every exercise is done and its quiz is passed. The journal phase gate is the human review: PASS, REINFORCE, or REPEAT.

Sign in with username and password (`data/users.json`, scrypt hashes, HttpOnly session cookie). Progress is still one local file (`data/progress.json`) for this personal portal — not a multi-tenant database.
