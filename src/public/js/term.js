function normalizePath(path) {
  const parts = [];
  for (const part of String(path || '').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return `/${parts.join('/')}`;
}

function resolvePath(cwd, target = '.') {
  if (!target || target === '.') return cwd;
  return normalizePath(target.startsWith('/') ? target : `${cwd}/${target}`);
}

function parentDir(path) {
  const parts = normalizePath(path).split('/').filter(Boolean);
  parts.pop();
  return `/${parts.join('/')}`;
}

function tokenize(line) {
  const tokens = [];
  const value = String(line ?? '').trim();
  let current = '';
  let quote = '';
  for (const char of value) {
    if (quote) {
      if (char === quote) quote = '';
      else current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current) tokens.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current) tokens.push(current);
  return tokens;
}

function listNames(state, dir) {
  const prefix = dir === '/' ? '/' : `${dir}/`;
  const names = new Set();
  for (const item of state.dirs) {
    if (item !== dir && item.startsWith(prefix)) {
      const rest = item.slice(prefix.length);
      if (rest && !rest.includes('/')) names.add(`${rest}/`);
    }
  }
  for (const file of Object.keys(state.files)) {
    if (file.startsWith(prefix)) {
      const rest = file.slice(prefix.length);
      if (rest && !rest.includes('/')) names.add(rest);
    }
  }
  return [...names].sort();
}

export function createSandbox(spec = {}) {
  const cwd = spec.cwd || '/home/learner';
  const dirs = new Set(['/', '/home', '/home/learner', cwd]);
  return {
    user: spec.user || 'learner',
    hostname: spec.hostname || 'fieldnotes',
    cwd,
    dirs,
    files: { ...(spec.files ?? {}) },
    git: null,
    history: [],
    spawned: false,
  };
}

export function runSandboxCommand(state, raw) {
  const input = String(raw ?? '').trim();
  const result = dispatch(state, input);
  state.history.push({ input, output: result.output, ok: result.ok });
  return result;
}

function dispatch(state, input) {
  if (!input) return { ok: true, output: '' };
  const tokens = tokenize(input);
  const cmd = tokens[0];
  if (cmd === 'pwd') return { ok: true, output: state.cwd };
  if (cmd === 'help') {
    return { ok: true, output: 'pwd ls cd mkdir touch cat echo git node help clear' };
  }
  if (cmd === 'clear') return { ok: true, output: '', clear: true };
  if (cmd === 'ls') {
    const dir = resolvePath(state.cwd, tokens[1]);
    if (!state.dirs.has(dir)) return { ok: false, output: `ls: ${dir}: no such directory` };
    return { ok: true, output: listNames(state, dir).join('\n') };
  }
  if (cmd === 'cd') {
    const dir = resolvePath(state.cwd, tokens[1] || '/home/learner');
    if (!state.dirs.has(dir)) return { ok: false, output: `cd: ${dir}: no such directory` };
    state.cwd = dir;
    return { ok: true, output: '' };
  }
  if (cmd === 'mkdir') {
    const dir = resolvePath(state.cwd, tokens[1]);
    if (!tokens[1]) return { ok: false, output: 'mkdir: missing operand' };
    if (!state.dirs.has(parentDir(dir))) return { ok: false, output: `mkdir: ${dir}: no such directory` };
    state.dirs.add(dir);
    return { ok: true, output: '' };
  }
  if (cmd === 'touch') {
    const paths = tokens.slice(1);
    if (!paths.length) return { ok: false, output: 'touch: missing file operand' };
    for (const name of paths) {
      const file = resolvePath(state.cwd, name);
      if (!state.dirs.has(parentDir(file))) return { ok: false, output: `touch: ${file}: no such directory` };
      state.files[file] ??= { content: '' };
    }
    return { ok: true, output: '' };
  }
  if (cmd === 'cat') {
    const file = resolvePath(state.cwd, tokens[1]);
    if (!state.files[file]) return { ok: false, output: `cat: ${file}: no such file` };
    return { ok: true, output: state.files[file].content || '' };
  }
  if (cmd === 'echo') return { ok: true, output: tokens.slice(1).join(' ') };
  if (cmd === 'node') {
    const file = resolvePath(state.cwd, tokens[1] || '');
    if (!state.files[file]) return { ok: false, output: `node: ${tokens[1] ?? ''}: no such file` };
    return { ok: true, output: '(sandbox) File exists. Node is not executed on the API server.' };
  }
  if (cmd === 'git') return gitCommand(state, tokens.slice(1));
  return { ok: false, output: `${cmd}: command not found` };
}

function gitCommand(state, args) {
  const action = args[0];
  if (action === 'init') {
    state.git = { staged: new Set(), commits: [] };
    return { ok: true, output: `Initialized empty Git repository in ${state.cwd}/.git/` };
  }
  if (!state.git) return { ok: false, output: 'fatal: not a git repository' };
  if (action === 'status') {
    const staged = [...state.git.staged].map((file) => file.slice(state.cwd.length + 1) || file);
    return { ok: true, output: staged.length ? `Changes to be committed:\n${staged.join('\n')}` : 'nothing to commit' };
  }
  if (action === 'add') {
    const names = args.slice(1);
    if (!names.length) return { ok: false, output: 'git add: missing pathspec' };
    for (const name of names) {
      const file = resolvePath(state.cwd, name);
      if (!state.files[file]) return { ok: false, output: `fatal: pathspec '${name}' did not match any files` };
      state.git.staged.add(file);
    }
    return { ok: true, output: '' };
  }
  if (action === 'commit') {
    const messageIndex = args.indexOf('-m');
    const message = messageIndex >= 0 ? args.slice(messageIndex + 1).join(' ') : '';
    if (!message) return { ok: false, output: 'git commit: missing message' };
    if (!state.git.staged.size) return { ok: false, output: 'nothing to commit' };
    state.git.commits.push({ message, files: [...state.git.staged] });
    state.git.staged.clear();
    return { ok: true, output: `[main (root-commit) ${message}]` };
  }
  if (action === 'log') {
    if (!state.git.commits.length) return { ok: true, output: '' };
    return { ok: true, output: state.git.commits.map((commit) => commit.message).join('\n') };
  }
  return { ok: false, output: `git: '${action}' is not supported in this sandbox` };
}
