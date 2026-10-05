import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createFirestoreJsonIo, createFirestoreJournalMap } from './json-io.js';

export function isCloudRuntime(env = process.env) {
  return Boolean(env.K_SERVICE || env.FUNCTION_TARGET || env.FIELDNOTES_DATA === 'firestore');
}

export async function createRuntimeData({ firestore, env = process.env } = {}) {
  if (!isCloudRuntime(env)) {
    return { storage: 'disk', options: {} };
  }
  if (!firestore && !getApps().length) initializeApp();
  const db = firestore ?? getFirestore();
  return {
    storage: 'firestore',
    options: {
      authIo: createFirestoreJsonIo(db.doc('fieldnotes/users')),
      progressIo: createFirestoreJsonIo(db.doc('fieldnotes/progress')),
      journalFileMap: createFirestoreJournalMap(db.doc('fieldnotes/journal')),
    },
  };
}
