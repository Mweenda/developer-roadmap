---
name: mvp-spec
description: >-
  Audits and implements the Personal Developer Learning Portal against docs/MVP_Spec.pdf
  and skills.md. Use when changing curriculum, auth, landing, the learning engine,
  progress, quizzes, exercises, dashboard, or when the user mentions MVP spec,
  apprenticeship, mastery, phase gates, or missing spec features.
---

# MVP spec

## Always read first

From the repository root: `skills.md`, then `docs/MVP_Spec.pdf`, then `docs/PRODUCT.md`.

## Hard rule

If a feature from `./docs/MVP_Spec.pdf` is missing, **stop and implement that feature**, ensure all tests pass (`pnpm test`), **then** proceed to audit. Do not skip ahead to the next milestone.

## Non-negotiables

- Follow the milestone todo list in `skills.md` **one by one**.
- Work on `dev`. Merge `dev` into `main` only; never land features on `main` directly.
- Curriculum and landing copy live in `src/data/`, never hardcoded into UI components.
- Opening a lesson is `LEARNING`, never `MASTERED`.
- Keep `PHASE_SEQUENCE` locks (fundamentals before frameworks).
- Never execute learner code on the API server.
- Auth is username + scrypt password + HttpOnly session cookie. Do not store plaintext passwords.
- Write or update a test before changing engine or auth behavior.

## MVP loop

```text
Landing → Register/Login → Dashboard ("Start Phase 0.") → Roadmap → Phase → Topic
  → Lesson → Exercise → Quiz → Score → Weak areas → Review → Journal gate → Unlock
```

## After a change

1. Update the milestone checkboxes in `skills.md`.
2. Follow the **Ship gate** and **Deployment architecture** in `skills.md`. Never deploy static-only Hosting. `pnpm test`, `pnpm build`, code-split oversized chunks, then commit and push `dev`. Live deploy only after `/api` and Firestore-backed progress are in the target.
3. Do not leave empty directories or unused imports.
