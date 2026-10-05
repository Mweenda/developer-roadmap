const today = () => new Date().toISOString().slice(0, 10);

function checklist(items) {
  return items.map((item) => `- [ ] ${item}`).join('\n');
}

export const journalTypes = [
  { id: 'notes', title: 'Learning notes', question: 'What did I learn?', kind: 'learn' },
  { id: 'mental-model', title: 'Mental model', question: 'How does the system work?', kind: 'learn' },
  { id: 'reference', title: 'Reference / cheat sheet', question: 'What do I look up while building?', kind: 'learn' },
  { id: 'project', title: 'Project README', question: 'What did I build, and how do I run it?', kind: 'build' },
  { id: 'architecture', title: 'Architecture', question: 'How do the pieces connect?', kind: 'build' },
  { id: 'debugging', title: 'Bug journal', question: 'What broke, and what did I learn from it?', kind: 'debug' },
  { id: 'weekly-review', title: 'Weekly review', question: 'Did this week actually happen?', kind: 'review' },
  { id: 'phase-gate', title: 'Phase completion gate', question: 'Am I ready to move on?', kind: 'review' },
  { id: 'decision', title: 'Architecture decision', question: 'What did we choose, and why?', kind: 'engineering' },
];

export const journalPhases = [
  {
    id: 'environment',
    folder: '00-foundations',
    title: 'Foundations',
    files: [
      { name: 'notes.md', type: 'notes' },
      { name: 'commands.md', type: 'reference', topic: 'Linux, Git, and Node commands' },
      { name: 'weekly-review.md', type: 'weekly-review' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['Terminal navigation', 'Git init/add/commit', 'Running a file with Node', 'What a runtime is'],
    practical: ['Create a repo with README and hello.js', 'Explain what happens between writing a file and executing it'],
  },
  {
    id: 'web-fundamentals',
    folder: '01-html-css',
    title: 'HTML & CSS',
    files: [
      { name: 'notes.md', type: 'notes' },
      { name: 'css-reference.md', type: 'reference', topic: 'CSS' },
      { name: 'weekly-review.md', type: 'weekly-review' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['Semantic HTML', 'Forms and labels', 'Cascade and specificity', 'Box model', 'Flexbox and grid', 'Responsive layout'],
    practical: ['Build a semantic profile page', 'Build a responsive landing page without a framework'],
  },
  {
    id: 'javascript-core',
    folder: '02-javascript',
    title: 'JavaScript',
    files: [
      { name: 'notes.md', type: 'notes' },
      { name: 'syntax-reference.md', type: 'reference', topic: 'JavaScript syntax and array methods' },
      { name: 'mental-models.md', type: 'mental-model', topic: 'Values, references, scope, and this' },
      { name: 'exercises/README.md', type: 'notes', topic: 'Exercise log' },
      { name: 'weekly-reviews/.gitkeep', type: 'folder' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['Variables', 'Data types', 'Operators', 'Conditionals', 'Loops', 'Functions', 'Arrays', 'Objects', 'Scope', 'Closures', 'Modules', 'Error handling'],
    practical: ['Solve problems without a tutorial', 'Manipulate arrays without accidental mutation', 'Write reusable functions', 'Debug JavaScript', 'Explain scope', 'Explain closures'],
  },
  {
    id: 'runtime-async',
    folder: '03-runtime-async',
    title: 'Runtime & Async',
    files: [
      { name: 'notes.md', type: 'notes' },
      { name: 'event-loop.md', type: 'mental-model', topic: 'The JavaScript event loop' },
      { name: 'weekly-review.md', type: 'weekly-review' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['Call stack vs host APIs', 'Callbacks', 'Promises', 'async/await', 'Microtasks vs tasks'],
    practical: ['Predict log order without running, then verify', 'Handle asynchronous errors'],
  },
  {
    id: 'browser-dom',
    folder: '04-dom-browser',
    title: 'DOM & Browser',
    files: [
      { name: 'notes.md', type: 'notes' },
      { name: 'browser-apis.md', type: 'reference', topic: 'DOM, events, storage, fetch' },
      { name: 'weekly-review.md', type: 'weekly-review' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['DOM tree', 'Events and delegation', 'localStorage', 'Fetch and JSON'],
    practical: ['Build a vanilla task manager', 'Keep data out of the DOM'],
  },
  {
    id: 'http-api',
    folder: '05-http-rest',
    title: 'HTTP & REST',
    files: [
      { name: 'notes.md', type: 'notes' },
      { name: 'http-reference.md', type: 'reference', topic: 'HTTP methods and status codes' },
      { name: 'weekly-review.md', type: 'weekly-review' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['Request and response', 'Methods', 'Status codes', 'REST resources'],
    practical: ['Choose methods and statuses on purpose', 'Read an API in the Network panel'],
  },
  {
    id: 'node',
    folder: '06-node',
    title: 'Node.js',
    files: [
      { name: 'notes.md', type: 'notes' },
      { name: 'weekly-review.md', type: 'weekly-review' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['Language vs host', 'fs and path', 'process and argv', 'package.json'],
    practical: ['Build a CLI that reads or writes a file', 'Handle invalid input'],
  },
  {
    id: 'databases-sql',
    folder: '07-postgresql',
    title: 'PostgreSQL',
    files: [
      { name: 'notes.md', type: 'notes' },
      { name: 'sql-reference.md', type: 'reference', topic: 'SQL' },
      { name: 'database-design.md', type: 'architecture', topic: 'Relational design' },
      { name: 'weekly-review.md', type: 'weekly-review' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['Tables and keys', 'Constraints', 'Joins', 'Transactions', 'Indexes'],
    practical: ['Model related tables', 'Write SELECT/INSERT/UPDATE/DELETE and a join'],
  },
  {
    id: 'express-api',
    folder: '08-express-api',
    title: 'Express',
    files: [
      { name: 'notes.md', type: 'notes' },
      { name: 'api-design.md', type: 'architecture', topic: 'REST API design' },
      { name: 'weekly-review.md', type: 'weekly-review' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['Routing', 'Middleware', 'Validation', 'Error handling'],
    practical: ['CRUD with useful status codes', 'Keep HTTP, domain, and SQL separable'],
  },
  {
    id: 'auth-security',
    folder: '09-auth-security',
    title: 'Authentication',
    files: [
      { name: 'notes.md', type: 'notes' },
      { name: 'security-checklist.md', type: 'reference', topic: 'Security checklist' },
      { name: 'weekly-review.md', type: 'weekly-review' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['Authentication vs authorization', 'Password hashing', '401 vs 403', 'XSS, CSRF, SQL injection'],
    practical: ['Protect routes server-side', 'Keep secrets out of Git'],
  },
  {
    id: 'react',
    folder: '10-react',
    title: 'React',
    files: [
      { name: 'notes.md', type: 'notes' },
      { name: 'react-mental-model.md', type: 'mental-model', topic: 'React rendering' },
      { name: 'weekly-reviews/.gitkeep', type: 'folder' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['Components and JSX', 'Props and state', 'Hooks', 'Controlled forms', 'Routing'],
    practical: ['Build a React app without Next.js', 'Explain a re-render'],
  },
  {
    id: 'full-stack',
    folder: '11-full-stack',
    title: 'Full Stack',
    files: [
      { name: 'architecture.md', type: 'architecture', topic: 'Application architecture' },
      { name: 'api-contract.md', type: 'architecture', topic: 'API contract' },
      { name: 'database-schema.md', type: 'architecture', topic: 'Database schema' },
      { name: 'weekly-reviews/.gitkeep', type: 'folder' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['Request path through the stack', 'Auth on the API', 'Loading and error states'],
    practical: ['Trace one click end to end', 'Authenticated CRUD with search and pagination'],
  },
  {
    id: 'typescript',
    folder: '12-typescript',
    title: 'TypeScript',
    files: [
      { name: 'notes.md', type: 'notes' },
      { name: 'weekly-review.md', type: 'weekly-review' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['Types vs runtime', 'Narrowing', 'Unknown at boundaries'],
    practical: ['Add types to real JavaScript', 'Validate untrusted input'],
  },
  {
    id: 'testing',
    folder: '13-testing',
    title: 'Testing',
    files: [
      { name: 'notes.md', type: 'notes' },
      { name: 'weekly-review.md', type: 'weekly-review' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['Unit vs integration vs E2E', 'What to mock'],
    practical: ['Test a function, an API failure, and a user-facing path'],
  },
  {
    id: 'production',
    folder: '14-production',
    title: 'Production',
    files: [
      { name: 'deployment.md', type: 'architecture', topic: 'Deployment' },
      { name: 'ci-cd.md', type: 'architecture', topic: 'CI/CD' },
      { name: 'troubleshooting.md', type: 'debugging', topic: 'Production troubleshooting' },
      { name: 'weekly-review.md', type: 'weekly-review' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['Environment config', 'Logs without secrets', 'Health checks'],
    practical: ['Deploy frontend, backend, and database with documented steps'],
  },
  {
    id: 'nextjs',
    folder: '15-nextjs',
    title: 'Next.js',
    files: [
      { name: 'notes.md', type: 'notes' },
      { name: 'weekly-review.md', type: 'weekly-review' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['Server vs client components', 'Rendering strategies'],
    practical: ['Explain where a page runs, without treating Next as a black box'],
  },
  {
    id: 'advanced-engineering',
    folder: '16-advanced',
    title: 'Advanced engineering',
    files: [
      { name: 'notes.md', type: 'notes' },
      { name: 'weekly-review.md', type: 'weekly-review' },
      { name: 'phase-gate.md', type: 'phase-gate' },
    ],
    knowledge: ['Measure before optimizing', 'Caching trade-offs', 'Background work'],
    practical: ['Name a bottleneck, measure it, change one thing, measure again'],
  },
];

export function getJournalPhase(phaseId) {
  return journalPhases.find((phase) => phase.id === phaseId) ?? null;
}

export function templateFor(type, { title = 'Untitled', topic, knowledge = [], practical = [] } = {}) {
  const date = today();
  if (type === 'notes') {
    return `# ${title}

## What is this?

Write the idea in one or two sentences.

## Example

\`\`\`js
// a small example you typed yourself
\`\`\`

## Important concepts

- 

## My own explanation

If you cannot explain it simply, you do not understand it yet.

## Official docs I used

- 
`;
  }
  if (type === 'mental-model') {
    return `# ${topic ?? title}

Describe how the system works — not only the syntax.

## How it works

JavaScript executes synchronous code on the call stack.

Asynchronous operations are handled by the runtime.

When that work finishes, callbacks or promise jobs go into queues.

The event loop decides when queued work can return to the call stack.

## Diagram

\`\`\`text
              JavaScript
                   │
                   ▼
              Call Stack
                   │
          ┌────────┴────────┐
          ▼                 ▼
     Web APIs          Node APIs
          │                 │
          └────────┬────────┘
                   ▼
              Queues
                   │
                   ▼
              Event Loop
                   │
                   ▼
              Call Stack
\`\`\`

## What this is not

- 
`;
  }
  if (type === 'reference') {
    return `# ${topic ?? title}

Personal cheat sheet. Not a textbook. Capture what you look up while building.

| Thing | Returns | Mutates? | Use |
| --- | --- | --- | --- |
| map() | New array | No | Transform |
| filter() | New array | No | Select |
| find() | Element | No | Find one |
| some() | Boolean | No | Check any |
| every() | Boolean | No | Check all |
| reduce() | Any value | No | Accumulate |
| sort() | Array | Yes | Sort |
`;
  }
  if (type === 'project') {
    return `# ${title}

## Description

What this project is, in one paragraph.

## Features

- 

## Technologies

- 

## How to run

\`\`\`sh
pnpm install
pnpm start
\`\`\`

## What I learned

- 

## Challenges

- 

## Future improvements

- 
`;
  }
  if (type === 'architecture') {
    return `# ${topic ?? title}

\`\`\`text
React
  │
  │ HTTP
  ▼
Express API
  │
  ▼
Service Layer
  │
  ▼
PostgreSQL
\`\`\`

## Pieces

- 

## Endpoints or schema

- 

## What this decision depends on

- 
`;
  }
  if (type === 'debugging') {
    return `# Bug: ${title}

## Symptom

What you saw.

## Expected

What should have happened.

## Investigation

1. 
2. 
3. 

## Root cause

## Fix

## What I learned

Authentication and network failures: check the request before assuming the backend is broken.

Date: ${date}
`;
  }
  if (type === 'weekly-review') {
    return `# Week review — ${date}

## What I learned

- 

## What I built

- 

## What I struggled with

- 

## Bugs I solved

- 

## Concepts I can explain

- 

## Concepts I still don't understand

- 

## Evidence

GitHub:

Project:

## Self-assessment

Confidence: _/10

## Review gate

- [ ] I can build the week's work without a tutorial open
- [ ] I can explain the week's ideas out loud
- [ ] Notes include a "my own explanation"

## Decision

PASS / REINFORCE / REPEAT

Do not write "I finished the week" if you only watched material.
`;
  }
  if (type === 'phase-gate') {
    return `# ${title} — Review gate

## Knowledge

${checklist(knowledge)}

## Practical ability

${checklist(practical)}

## Project

Can I build the required project independently?

YES / NO

## Explanation test

Can I explain the concepts without looking at notes?

YES / NO

## Review decision

PASS
REINFORCE
REPEAT PHASE
`;
  }
  if (type === 'decision') {
    return `# ADR — ${title}

## Decision

## Reason

## Alternatives considered

- 

## Decision date

${date}
`;
  }
  if (type === 'folder') return '';
  return `# ${title}\n`;
}

export function rootDebuggingTemplate() {
  return `# Debugging journal

A personal encyclopedia of bugs that were actually hard.

Add a new file from the Journal UI, or append a section here. Check the request before assuming the backend is broken.

`;
}

export function rootDecisionsTemplate() {
  return `# Architecture decisions

Short ADRs. Write one when you choose a tool or structure and might need to remember why.

Example:

## ADR-001 — PostgreSQL

### Decision

Use PostgreSQL as the primary database.

### Reason

Relational data: users, projects, tasks, comments. Transactions matter.

### Alternatives considered

- MongoDB
- SQLite

### Decision date

${today()}

`;
}

export function renderIndex({ currentPhase, completed = [], opened = [], percent = 0 }) {
  const bar = '█'.repeat(Math.round(percent / 10)).padEnd(10, '░');
  const phaseLines = journalPhases.map((phase, index) => {
    const state = completed.includes(phase.id) ? 'done' : opened.includes(phase.id) ? 'open' : 'not started';
    return `${index + 1}. [${phase.title}](./${phase.folder}/) — ${state}`;
  }).join('\n');
  return `# JavaScript learning journey

Living dashboard. 80–90% of time is learning, coding, and debugging. 10–20% is documentation. Capture what matters; do not transcribe every page you read.

## Current phase

${currentPhase ? `${currentPhase.title} (\`${currentPhase.id}\`)` : 'Not started'}

## Progress

\`${bar}\` ${percent}% of phases complete

---

## Phases

Folders are created when you reach that phase — not before.

${phaseLines}

---

## Standing documents

- [Debugging journal](./debugging.md)
- [Architecture decisions](./DECISIONS.md)

## Rule

If you cannot explain it in **My own explanation**, you are not ready to move on.
`;
}
