# Personal Developer Learning Portal

This is the **product specification and implementation backlog**. The application is a personal software-engineering apprenticeship, not a course catalog.

The system must continuously answer:

1. What should I learn next?
2. What should I practice?
3. Do I actually understand this?
4. Where am I weak?
5. What should I review?
6. Am I ready to move forward?
7. Can I build something with what I learned?

If a feature does not make the learner better at understanding, reasoning, building, debugging, or engineering software, it is not a priority.

## Principles

1. **Fundamentals before frameworks** — later phases stay locked until the previous phase is complete. React is not available while JavaScript is weak.
2. **Understanding over memorization** — opening a lesson is never mastery.
3. **Build instead of watch** — every phase ends in something tangible.
4. **Debugging is curriculum** — hard bugs belong in the journal.
5. **AI is a mentor** — hints before solutions. Not built yet; do not add it before the learning engine is solid.
6. **Progress is evidence-based** — exercises + quiz + challenges + projects + review + retention.

## Learning states

`LOCKED → AVAILABLE → STARTED/LEARNING → PRACTICING → ASSESSED → MASTERED`

Failure: `ASSESSED → REINFORCE → PRACTICE → REASSESS`

Review: `MASTERED → REVIEW_DUE → REVIEW → PASS or REINFORCE`

## Definition of mastery (current, configurable)

In `src/data/learning-model.js`:

- Continue (phase complete): all exercises done **and** quiz ≥ 70%
- Mastery score: quiz ≥ 80% **and** ≥ 80% of exercises passed
- Overall mastery is the average of knowledge (quiz) and application (exercises)
- A lesson marked read is **LEARNING**, not **MASTERED**

Major gates still require the journal phase-gate (PASS / REINFORCE / REPEAT) as the human review.

## Content hierarchy (now vs later)

**Now:** Roadmap → Phase → Topic/Lesson → Exercise → Quiz → Journal gate → Project ladder

**Later:** Module → Concept graph with per-concept prerequisites, coding sandbox, spaced repetition algorithm, AI mentor

## Architecture (now)

Vanilla JS UI + Express API + JSON progress (`data/progress.json`) + markdown journal (`journal/`). Content lives in data files, not in React components.

**Later (not this increment):** React UI, PostgreSQL, isolated code runner. Auth is local username/password with a session cookie.

Do not rewrite the stack until the learning loop is proven.

## Milestone backlog

| Milestone | Status |
| --- | --- |
| 0 Product foundation (this spec, states, mastery rules, API) | **Shipped** |
| 1 Application shell (dashboard, nav, roadmap, next action) | **Shipped** (landing, auth, command-center dashboard) |
| 2 Roadmap engine + prerequisite lock/unlock | **Shipped (phase chain)** |
| 3 Lesson engine | Partial (topics, not full concept template) |
| 4 Exercise engine | Partial (choice, predict, code, build) |
| 5 Isolated code execution | Not started (in-browser runner only; do not exec on the API server) |
| 6 Quiz engine | Partial (phase quizzes, history, retake) |
| 7 Mastery engine | **Shipped (phase-level)** |
| 8 Review / spaced practice | **Minimal** (quiz schedules next review; due dates become `REVIEW_DUE`) |
| 9 Adaptive recommendations | **Minimal** (weak areas from failed work) |
| 10 Documentation center | Shipped (reference library) |
| 11 Milestone review gates | Shipped (journal phase-gate) |
| 12–13 Project engine and review | Partial (ladder + README template) |
| 14 Git workflow teaching | Not started |
| 15 Debugging lab | Partial (journal bugs) |
| 16 AI mentor | Not started — **after** the engine |
| 17 Knowledge graph | Partial (knowledge map of phase states) |
| 18 Personal dashboard | **Shipped (first version)** |
| 19 Full concept-level curriculum | Partial (17 phases exist; deepen JS core next) |
| 20 Production (auth, Postgres, monitoring) | **Partial** (username/password + session cookie; no Postgres/monitoring) |

## First MVP loop (acceptance)

A learner opens the app and sees **what to do next**. They read, practice, get feedback, take a quiz, see weak areas, get a review date, and cannot skip to React. That loop is the foundation. Fancy gamification is not.

## What not to prioritize yet

Animations, leaderboards, social, avatars, badges-for-opening-pages, AI chat, a React rewrite.

## Team priority order

1. Learning model
2. Curriculum engine
3. Exercise engine
4. Assessment engine
5. Progress / mastery / review
6. Coding environment (sandboxed)
7. Projects
8. AI mentor
9. Advanced personalization
