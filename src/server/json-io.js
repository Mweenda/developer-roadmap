import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export function createFileJsonIo(filePath) {
  return {
    async read() {
      try {
        return JSON.parse(await readFile(filePath, 'utf8'));
      } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
      }
    },
    async write(payload) {
      await mkdir(dirname(filePath), { recursive: true });
      const tempPath = `${filePath}.tmp`;
      await writeFile(tempPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
      await rename(tempPath, filePath);
      return payload;
    },
  };
}

export function createMemoryJsonIo(initial = null) {
  let value = initial;
  return {
    async read() {
      return value;
    },
    async write(next) {
      value = next;
      return next;
    },
  };
}

export function createJournalFileMap(initial = {}) {
  const files = { ...initial };

  function missing(path) {
    const error = new Error(`Unknown journal file: ${path}`);
    error.code = 'ENOENT';
    throw error;
  }

  return {
    async list() {
      return Object.keys(files).filter((path) => path.endsWith('.md')).sort();
    },
    async read(path) {
      if (!(path in files)) missing(path);
      return { path, content: files[path] };
    },
    async write(path, content) {
      files[path] = content.endsWith('\n') ? content : `${content}\n`;
      return path;
    },
    async exists(path) {
      return path in files;
    },
    snapshot() {
      return { ...files };
    },
  };
}

export function createFirestoreJsonIo(docRef) {
  return {
    async read() {
      const snap = await docRef.get();
      return snap.exists ? snap.data()?.payload ?? null : null;
    },
    async write(payload) {
      await docRef.set({ payload, updatedAt: new Date().toISOString() });
      return payload;
    },
  };
}

export function createFirestoreJournalMap(docRef) {
  async function load() {
    const snap = await docRef.get();
    return snap.exists && snap.data()?.files ? { ...snap.data().files } : {};
  }

  return {
    async list() {
      return Object.keys(await load()).filter((path) => path.endsWith('.md')).sort();
    },
    async read(path) {
      const files = await load();
      if (!(path in files)) {
        const error = new Error(`Unknown journal file: ${path}`);
        error.code = 'ENOENT';
        throw error;
      }
      return { path, content: files[path] };
    },
    async write(path, content) {
      const files = await load();
      files[path] = content.endsWith('\n') ? content : `${content}\n`;
      await docRef.set({ files, updatedAt: new Date().toISOString() });
      return path;
    },
    async exists(path) {
      const files = await load();
      return path in files;
    },
  };
}
