export const librarySources = [
  {
    id: 'mdn-guide',
    category: 'javascript',
    title: 'MDN JavaScript Guide',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
    role: 'reference',
    later: false,
    summary: 'Primary JavaScript reference. First stop when you need to know what a language feature actually does.',
    useFor: ['Variables', 'Data types', 'Functions', 'Objects', 'Arrays', 'Classes', 'Promises', 'Modules', 'Iterators', 'Error handling', 'Syntax', 'Browser APIs'],
    rule: 'If you are wondering “what does this JavaScript feature actually do?”, start here.',
  },
  {
    id: 'mdn-reference',
    category: 'javascript',
    title: 'MDN JavaScript Reference',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference',
    role: 'reference',
    later: false,
    summary: 'Lookup for exact syntax, methods, and objects. Keep it nearby while you build.',
    useFor: ['Array methods', 'Object APIs', 'Global functions', 'Statements', 'Operators'],
    rule: 'Use the Guide to understand; use the Reference to verify a specific method or value.',
  },
  {
    id: 'javascript-info',
    category: 'javascript',
    title: 'JavaScript.info',
    url: 'https://javascript.info/',
    role: 'learn',
    later: false,
    summary: 'Progressive explanations. Learn and understand concepts here; verify details on MDN.',
    useFor: ['JavaScript fundamentals', 'Objects', 'Functions', 'Prototypes', 'Promises', 'Async/await', 'DOM'],
    rule: 'JavaScript.info teaches the idea. MDN confirms the specification-level behavior.',
  },
  {
    id: 'node-docs',
    category: 'node',
    title: 'Node.js Documentation',
    url: 'https://nodejs.org/docs/latest/api/',
    role: 'reference',
    later: false,
    summary: 'Authoritative Node APIs once JavaScript moves outside the browser.',
    useFor: ['fs', 'path', 'http', 'events', 'streams', 'process', 'buffer', 'crypto', 'url', 'os', 'timers'],
    rule: 'When you ask “what exactly does fs provide?”, open this, not a random tutorial.',
  },
  {
    id: 'node-learn',
    category: 'node',
    title: 'Node.js Learn',
    url: 'https://nodejs.org/en/learn',
    role: 'learn',
    later: false,
    summary: 'Understand the Node runtime, not only look up APIs.',
    useFor: ['Node runtime', 'Event loop', 'Asynchronous programming', 'npm', 'HTTP', 'Environment variables', 'Streams', 'Modules', 'Debugging'],
    rule: 'Read Learn for mental models; read the API docs for method signatures.',
  },
  {
    id: 'npm-docs',
    category: 'backend',
    title: 'npm Documentation',
    url: 'https://docs.npmjs.com/',
    role: 'reference',
    later: false,
    summary: 'Installing and managing dependencies. Learn why package.json, the lockfile, and node_modules exist.',
    useFor: ['npm init', 'install / uninstall / update', 'npm run and scripts', 'package.json', 'package-lock.json', 'dependencies vs devDependencies'],
    rule: 'Do not treat npm install as magic. Know what those three artifacts are for.',
  },
  {
    id: 'express-docs',
    category: 'backend',
    title: 'Express.js Documentation',
    url: 'https://expressjs.com/',
    role: 'reference',
    later: false,
    summary: 'Major backend reference for routing, middleware, and HTTP handling.',
    useFor: ['Routing', 'Middleware', 'Request', 'Response', 'Error handling', 'Router', 'Static files', 'Application configuration'],
    rule: 'Know what app, .get(), req, and res are doing — they are not React.',
  },
  {
    id: 'mdn-http',
    category: 'backend',
    title: 'MDN HTTP',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP',
    role: 'learn',
    later: false,
    summary: 'The protocol under fetch, Express, and React data loading.',
    useFor: ['Request', 'Response', 'Headers', 'Body', 'Methods', 'Status codes', 'Cookies', 'Caching', 'Authentication'],
    rule: 'Learn HTTP before you treat Express as a framework of function names.',
  },
  {
    id: 'react-docs',
    category: 'frontend',
    title: 'React Documentation',
    url: 'https://react.dev/',
    role: 'learn',
    later: false,
    summary: 'Primary React reference. Use it for React’s mental model, not only JSX syntax.',
    useFor: ['Components', 'JSX', 'Props', 'State', 'Events', 'Hooks', 'Effects', 'Refs', 'Context', 'Forms', 'Rendering', 'Lists', 'Performance'],
    rule: 'Read to understand how state becomes UI, not to memorize every API on day one.',
  },
  {
    id: 'react-api',
    category: 'frontend',
    title: 'React API Reference',
    url: 'https://react.dev/reference/react',
    role: 'reference',
    later: false,
    summary: 'Lookup once you are building: the exact hook or API when you already know why you need it.',
    useFor: ['useState', 'useEffect', 'useRef', 'useContext', 'useMemo', 'useCallback'],
    rule: 'Professionals remember when to reach for a hook, then check the docs for the exact API.',
  },
  {
    id: 'mdn-web-apis',
    category: 'frontend',
    title: 'MDN Web APIs',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API',
    role: 'reference',
    later: false,
    summary: 'Browser platform: DOM, events, fetch, storage. Critical in the vanilla JavaScript phase.',
    useFor: ['DOM', 'Events', 'Fetch', 'Storage', 'Forms', 'WebSockets', 'Timers', 'Browser APIs'],
    rule: 'querySelector, localStorage, fetch, and addEventListener live here — not in React.',
  },
  {
    id: 'postgres-docs',
    category: 'database',
    title: 'PostgreSQL Documentation',
    url: 'https://www.postgresql.org/docs/',
    role: 'reference',
    later: true,
    summary: 'Primary database reference. Do not start this until JavaScript, Node, and HTTP are in place.',
    useFor: ['SQL', 'Tables', 'Queries', 'Constraints', 'Indexes', 'Transactions', 'JOINs', 'Data types', 'Functions'],
    rule: 'Bookmark it. Open it in the Databases & SQL phase, not during JavaScript core.',
  },
  {
    id: 'typescript-handbook',
    category: 'typescript',
    title: 'TypeScript Handbook',
    url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
    role: 'learn',
    later: true,
    summary: 'Types after solid JavaScript. Types complement runtime validation; they do not replace it.',
    useFor: ['Types', 'Interfaces', 'Generics', 'Unions', 'Narrowing', 'Utility types', 'Functions', 'Classes', 'Inference'],
    rule: 'TypeScript comes after JavaScript fundamentals on this roadmap.',
  },
  {
    id: 'vitest',
    category: 'testing',
    title: 'Vitest',
    url: 'https://vitest.dev/guide/',
    role: 'reference',
    later: true,
    summary: 'Unit and integration test runner. Relevant in the Testing phase.',
    useFor: ['Unit tests', 'Watch mode', 'Assertions'],
    rule: 'Do not study this yet. It becomes primary when we formalize testing.',
  },
  {
    id: 'testing-library',
    category: 'testing',
    title: 'React Testing Library',
    url: 'https://testing-library.com/docs/react-testing-library/intro/',
    role: 'reference',
    later: true,
    summary: 'Test components the way a user interacts with them.',
    useFor: ['Queries by role and label', 'User events', 'Async UI'],
    rule: 'Later. Pair with React, not with JavaScript core.',
  },
  {
    id: 'playwright',
    category: 'testing',
    title: 'Playwright',
    url: 'https://playwright.dev/docs/intro',
    role: 'reference',
    later: true,
    summary: 'End-to-end browser tests for real user workflows.',
    useFor: ['E2E flows', 'Browser automation'],
    rule: 'Later. After you can build and explain the app yourself.',
  },
  {
    id: 'supertest',
    category: 'testing',
    title: 'Supertest',
    url: 'https://github.com/ladjs/supertest',
    role: 'reference',
    later: true,
    summary: 'HTTP assertions against an Express app.',
    useFor: ['API testing', 'Status codes', 'JSON bodies'],
    rule: 'Later. This app already uses fetch against its own API as the same idea.',
  },
  {
    id: 'git-docs',
    category: 'devops',
    title: 'Git Documentation',
    url: 'https://git-scm.com/doc',
    role: 'reference',
    later: false,
    summary: 'Checkpoints and history from day one.',
    useFor: ['init', 'status', 'add', 'commit', 'log', 'branch', 'merge'],
    rule: 'Open this in phase 0. Git is not a later topic.',
  },
  {
    id: 'github-docs',
    category: 'devops',
    title: 'GitHub Docs',
    url: 'https://docs.github.com/',
    role: 'reference',
    later: false,
    summary: 'Remotes, pull requests, and later Actions.',
    useFor: ['Repositories', 'Pull requests', 'GitHub Actions'],
    rule: 'Push the hello-world repo here. CI docs wait until production.',
  },
  {
    id: 'docker-docs',
    category: 'devops',
    title: 'Docker Documentation',
    url: 'https://docs.docker.com/',
    role: 'reference',
    later: true,
    summary: 'Package an app and its runtime when environment drift is a real problem.',
    useFor: ['Images', 'Containers', 'Compose'],
    rule: 'Later. Production engineering, not week one.',
  },
];

export const libraryCategories = [
  { id: 'javascript', title: 'JavaScript', blurb: 'Learn on JavaScript.info. Verify on MDN.' },
  { id: 'node', title: 'Node', blurb: 'Runtime mental model, then API lookup.' },
  { id: 'backend', title: 'Backend', blurb: 'HTTP, npm, and Express as a request pipeline.' },
  { id: 'frontend', title: 'Frontend', blurb: 'Browser APIs first. React after the DOM is real to you.' },
  { id: 'database', title: 'Database', blurb: 'PostgreSQL after JavaScript, Node, and HTTP.' },
  { id: 'typescript', title: 'TypeScript', blurb: 'After JavaScript fundamentals, on real code.' },
  { id: 'testing', title: 'Testing', blurb: 'Formalize once you have behavior worth pinning down.' },
  { id: 'devops', title: 'DevOps', blurb: 'Git from day one. Docker when you need to operate.' },
];

export const whenToRead = [
  { when: 'JavaScript variables and functions', primary: 'JavaScript.info + MDN' },
  { when: 'Arrays and objects', primary: 'JavaScript.info + MDN' },
  { when: 'Promises and async', primary: 'JavaScript.info + MDN' },
  { when: 'DOM', primary: 'MDN Web APIs' },
  { when: 'Fetch', primary: 'MDN Web APIs' },
  { when: 'HTTP', primary: 'MDN HTTP' },
  { when: 'Node fundamentals', primary: 'Node Learn' },
  { when: 'Node APIs', primary: 'Node Docs' },
  { when: 'npm', primary: 'npm Docs' },
  { when: 'Express', primary: 'Express Docs' },
  { when: 'SQL', primary: 'PostgreSQL Docs' },
  { when: 'React', primary: 'React Docs + React API' },
  { when: 'TypeScript', primary: 'TypeScript Handbook' },
  { when: 'Testing', primary: 'Vitest / Testing Library / Playwright / Supertest' },
  { when: 'Deployment', primary: 'Docker + GitHub Docs' },
];

export const phaseLibrary = {
  environment: {
    sourceIds: ['git-docs', 'github-docs', 'node-learn', 'npm-docs'],
    use: 'Git, GitHub, and Node Learn. You are setting up a runtime and a history, not studying Express.',
    skip: 'Skip React, PostgreSQL, TypeScript, testing libraries, and Docker.',
  },
  'web-fundamentals': {
    sourceIds: ['mdn-web-apis'],
    use: 'MDN for HTML, CSS, and document structure. The browser is the environment JavaScript will live in.',
    skip: 'No React docs. No Tailwind. No component libraries.',
  },
  'javascript-core': {
    sourceIds: ['javascript-info', 'mdn-guide', 'mdn-reference'],
    use: 'JavaScript.info to learn the concept. MDN Guide and Reference to verify what the language actually does.',
    skip: 'Do not open React, TypeScript, or PostgreSQL as a substitute for this phase.',
  },
  'runtime-async': {
    sourceIds: ['javascript-info', 'mdn-guide', 'node-learn'],
    use: 'Promises and the event loop: JavaScript.info for the story, MDN for the precise queue behavior, Node Learn for the host runtime.',
    skip: 'Express can wait. You need a mental model of the stack and queues first.',
  },
  'browser-dom': {
    sourceIds: ['mdn-web-apis', 'javascript-info', 'mdn-guide'],
    use: 'MDN Web APIs for DOM, events, fetch, and storage. This is the vanilla JavaScript phase.',
    skip: 'React documentation is not the DOM. Stay on MDN until the task manager exists.',
  },
  'http-api': {
    sourceIds: ['mdn-http', 'mdn-web-apis'],
    use: 'MDN HTTP for methods, status codes, and the request/response contract. Fetch lives in Web APIs.',
    skip: 'Do not skip this for Express routing cheatsheets.',
  },
  node: {
    sourceIds: ['node-learn', 'node-docs', 'npm-docs'],
    use: 'Node Learn for the runtime. Node API docs for fs, path, process, http. npm docs for package.json and the lockfile.',
    skip: 'Express comes after you can write a small Node program without a framework.',
  },
  'databases-sql': {
    sourceIds: ['postgres-docs'],
    use: 'Now open PostgreSQL. Tables, SQL, joins, constraints, transactions.',
    skip: 'Do not hide this behind an ORM or skip it for Mongo “because JSON”.',
  },
  'express-api': {
    sourceIds: ['express-docs', 'mdn-http', 'node-docs', 'postgres-docs'],
    use: 'Express for the pipeline. MDN HTTP for the contract. Node and PostgreSQL for the work behind the route.',
    skip: 'Do not treat a route handler as a place to dump SQL and HTML together.',
  },
  'auth-security': {
    sourceIds: ['express-docs', 'mdn-http', 'mdn-web-apis'],
    use: 'HTTP cookies/headers and Express middleware. Authorization is a server decision documented in your own routes.',
    skip: 'A JWT tutorial is not a substitute for knowing why authentication exists.',
  },
  react: {
    sourceIds: ['react-docs', 'react-api', 'mdn-web-apis'],
    use: 'React docs for the mental model. React API when you already know you need a hook. MDN still owns fetch and the DOM.',
    skip: 'Next.js and Redux wait. TanStack Query waits until a boring fetch() works.',
  },
  'full-stack': {
    sourceIds: ['react-docs', 'express-docs', 'mdn-http', 'postgres-docs'],
    use: 'The same four sources you already earned: React, Express, HTTP, PostgreSQL. Trace one click through all of them.',
    skip: 'Do not add a new library to avoid understanding the contract.',
  },
  typescript: {
    sourceIds: ['typescript-handbook', 'javascript-info', 'mdn-guide'],
    use: 'TypeScript Handbook on code you already understand in JavaScript. MDN/JS.info if a type error is actually a language confusion.',
    skip: 'Do not start a greenfield TypeScript demo to avoid migrating real code.',
  },
  testing: {
    sourceIds: ['vitest', 'testing-library', 'playwright', 'supertest'],
    use: 'Now the testing shelf is in play. Pick the doc that matches the boundary you are testing.',
    skip: 'Do not mock everything. Test behavior.',
  },
  production: {
    sourceIds: ['docker-docs', 'github-docs', 'node-docs'],
    use: 'Docker and GitHub (Actions) when you need repeatable deploys. Node docs for process and environment.',
    skip: 'Kubernetes is not this phase.',
  },
  nextjs: {
    sourceIds: ['react-docs', 'react-api'],
    use: 'React docs remain primary. Next.js is conventions on top of React; do not let it replace the mental model.',
    skip: 'If you cannot build the UI in React without Next, you opened this too early.',
  },
  'advanced-engineering': {
    sourceIds: ['postgres-docs', 'node-docs', 'mdn-http', 'docker-docs'],
    use: 'Measure first. Official docs for the layer you actually bottlenecked — SQL, Node, HTTP, or the host.',
    skip: 'Do not collect tools. Open a doc because a named problem needs it.',
  },
};

function relatedPhaseIds(sourceId) {
  return Object.entries(phaseLibrary)
    .filter(([, entry]) => entry.sourceIds.includes(sourceId))
    .map(([phaseId]) => phaseId);
}

export function getLibrarySource(id) {
  const source = librarySources.find((item) => item.id === id);
  if (!source) return null;
  return { ...source, phaseIds: relatedPhaseIds(source.id) };
}

export function libraryForPhase(phaseId) {
  const entry = phaseLibrary[phaseId];
  if (!entry) return { sources: [], use: '', skip: '' };
  return {
    use: entry.use,
    skip: entry.skip,
    sources: entry.sourceIds.map(getLibrarySource).filter(Boolean),
  };
}

export function listLibrary() {
  const sources = librarySources.map((source) => getLibrarySource(source.id));
  return {
    principle: 'Understand JavaScript well enough that you know what to look up when you need it. That is closer to how you will work as a professional than memorizing the language.',
    categories: libraryCategories.map((category) => ({
      ...category,
      sources: sources.filter((source) => source.category === category.id),
    })),
    whenToRead,
    sources,
  };
}
