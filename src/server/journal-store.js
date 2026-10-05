import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import {
  getJournalPhase,
  journalPhases,
  journalTypes,
  renderIndex,
  rootDebuggingTemplate,
  rootDecisionsTemplate,
  templateFor,
} from '../data/journal.js';

const MAX_BYTES = 100_000;

function invalid(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function toPosix(value) {
  return value.split(sep).join('/');
}

export function createJournalStore(rootDir, { getContext = async () => ({ currentPhaseId: 'environment', completed: [] }) } = {}) {
  let writeQueue = Promise.resolve();

  function resolveSafe(relativePath) {
    if (typeof relativePath !== 'string') throw invalid('INVALID_PATH', 'path is required');
    const posix = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!posix || posix.includes('..') || posix.startsWith('/') || posix.includes('\0')) {
      throw invalid('INVALID_PATH', 'Invalid journal path');
    }
    if (!posix.endsWith('.md') && !posix.endsWith('.gitkeep')) {
      throw invalid('INVALID_PATH', 'Only markdown files can be stored in the journal');
    }
    const full = join(rootDir, posix);
    const rel = toPosix(relative(rootDir, full));
    if (rel.startsWith('..')) throw invalid('INVALID_PATH', 'Invalid journal path');
    return { relative: posix, full };
  }

  function enqueue(work) {
    const operation = writeQueue.then(work);
    writeQueue = operation.catch(() => {});
    return operation;
  }

  async function ensureRoot() {
    await mkdir(rootDir, { recursive: true });
    const indexPath = join(rootDir, 'README.md');
    try {
      await stat(indexPath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const context = await getContext();
      await writeFile(indexPath, `${renderIndex({
        currentPhase: getJournalPhase(context.currentPhaseId),
        completed: context.completed,
        opened: [],
        percent: 0,
      })}\n`, 'utf8');
      await writeFile(join(rootDir, 'DECISIONS.md'), rootDecisionsTemplate(), 'utf8');
      await writeFile(join(rootDir, 'debugging.md'), rootDebuggingTemplate(), 'utf8');
    }
  }

  async function listMarkdown(dir = rootDir, prefix = '') {
    let entries = [];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
    const files = [];
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        files.push(...await listMarkdown(join(dir, entry.name), rel));
      } else if (entry.name.endsWith('.md')) {
        files.push(rel);
      }
    }
    return files.sort();
  }

  async function openedPhaseIds() {
    const files = await listMarkdown();
    return journalPhases.filter((phase) => files.some((file) => file.startsWith(`${phase.folder}/`))).map((phase) => phase.id);
  }

  async function rebuildIndex() {
    const context = await getContext();
    const opened = await openedPhaseIds();
    const current = getJournalPhase(context.currentPhaseId)
      ?? journalPhases.find((phase) => !context.completed.includes(phase.id))
      ?? journalPhases[0];
    const percent = Math.round((context.completed.length / journalPhases.length) * 100);
    const content = `${renderIndex({ currentPhase: current, completed: context.completed, opened, percent })}\n`;
    const temp = join(rootDir, 'README.md.tmp');
    await writeFile(temp, content, 'utf8');
    await rename(temp, join(rootDir, 'README.md'));
  }

  async function writeFileSafe(relativePath, content, { scaffold = false } = {}) {
    if (typeof content !== 'string') throw invalid('INVALID_CONTENT', 'content must be a string');
    if (Buffer.byteLength(content, 'utf8') > MAX_BYTES) throw invalid('INVALID_CONTENT', 'File is too large');
    const { full, relative: posix } = resolveSafe(relativePath);
    await mkdir(dirname(full), { recursive: true });
    if (scaffold) {
      try {
        await stat(full);
        return posix;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    const temp = `${full}.tmp`;
    await writeFile(temp, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
    await rename(temp, full);
    return posix;
  }

  async function get() {
    await writeQueue;
    await ensureRoot();
    return snapshot();
  }

  async function snapshot() {
    const files = await listMarkdown();
    const opened = await openedPhaseIds();
    return {
      rule: '80–90% learning, coding, and debugging. 10–20% documentation. Capture what matters.',
      types: journalTypes,
      phases: journalPhases.map((phase) => ({
        id: phase.id,
        folder: phase.folder,
        title: phase.title,
        opened: opened.includes(phase.id),
        files: phase.files.filter((file) => file.type !== 'folder').map((file) => ({
          path: `${phase.folder}/${file.name}`,
          type: file.type,
          name: file.name,
        })),
      })),
      files,
      opened,
    };
  }

  async function read(relativePath) {
    await writeQueue;
    await ensureRoot();
    return readNow(relativePath);
  }

  async function readNow(relativePath) {
    const { full, relative: posix } = resolveSafe(relativePath);
    try {
      return { path: posix, content: await readFile(full, 'utf8') };
    } catch (error) {
      if (error.code === 'ENOENT') throw invalid('NOT_FOUND', `Unknown journal file: ${posix}`);
      throw error;
    }
  }

  async function write(relativePath, content) {
    return enqueue(async () => {
      await ensureRoot();
      const path = await writeFileSafe(relativePath, content);
      await rebuildIndex();
      return readNow(path);
    });
  }

  async function openPhase(phaseId) {
    const phase = getJournalPhase(phaseId);
    if (!phase) throw invalid('INVALID_PHASE', `Unknown phase: ${phaseId}`);
    return enqueue(async () => {
      await ensureRoot();
      for (const file of phase.files) {
        const relativePath = `${phase.folder}/${file.name}`;
        if (file.type === 'folder') {
          await mkdir(join(rootDir, phase.folder, dirname(file.name)), { recursive: true });
          if (file.name.endsWith('.gitkeep')) {
            await writeFileSafe(relativePath, '', { scaffold: true });
          }
          continue;
        }
        const content = templateFor(file.type, {
          title: phase.title,
          topic: file.topic ?? file.name.replace(/\.md$/, ''),
          knowledge: phase.knowledge,
          practical: phase.practical,
        });
        await writeFileSafe(relativePath, content, { scaffold: true });
      }
      await rebuildIndex();
      return snapshot();
    });
  }

  async function create({ phaseId, type, title }) {
    if (!journalTypes.some((item) => item.id === type)) throw invalid('INVALID_TYPE', `Unknown document type: ${type}`);
    const slug = String(title ?? type).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || type;
    return enqueue(async () => {
      await ensureRoot();
      let relativePath;
      const phase = phaseId ? getJournalPhase(phaseId) : null;
      if (type === 'decision') {
        const existing = await readFile(join(rootDir, 'DECISIONS.md'), 'utf8');
        const addition = `\n## ADR — ${title || 'Untitled'}\n\n### Decision\n\n### Reason\n\n### Alternatives considered\n\n- \n\n### Decision date\n\n${today()}\n`;
        await writeFileSafe('DECISIONS.md', `${existing.trim()}\n${addition}`);
        await rebuildIndex();
        return readNow('DECISIONS.md');
      }
      if (type === 'debugging' && !phaseId) relativePath = `bugs/${today()}-${slug}.md`;
      else {
        if (!phase) throw invalid('INVALID_PHASE', 'phaseId is required for this document type');
        for (const file of phase.files) {
          const path = `${phase.folder}/${file.name}`;
          if (file.type === 'folder') {
            await mkdir(join(rootDir, phase.folder, dirname(file.name)), { recursive: true });
            if (file.name.endsWith('.gitkeep')) await writeFileSafe(path, '', { scaffold: true });
            continue;
          }
          await writeFileSafe(path, templateFor(file.type, {
            title: phase.title,
            topic: file.topic ?? file.name.replace(/\.md$/, ''),
            knowledge: phase.knowledge,
            practical: phase.practical,
          }), { scaffold: true });
        }
        if (type === 'weekly-review') relativePath = `${phase.folder}/weekly-reviews/${today()}.md`;
        else if (type === 'debugging') relativePath = `${phase.folder}/bugs/${today()}-${slug}.md`;
        else if (type === 'project') relativePath = `${phase.folder}/project-readme.md`;
        else relativePath = `${phase.folder}/${slug}.md`;
      }
      await writeFileSafe(relativePath, templateFor(type, {
        title: title || phase?.title || slug,
        topic: title,
        knowledge: phase?.knowledge,
        practical: phase?.practical,
      }));
      await rebuildIndex();
      return readNow(relativePath);
    });
  }

  return { get, read, write, openPhase, create };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
