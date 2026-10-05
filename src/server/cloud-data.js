import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createFirestoreJsonIo, createFirestoreJournalMap } from './json-io.js';

export function isCloudRuntime(env = process.env) {
  return Boolean(env.K_SERVICE || env.FUNCTION_TARGET || env.VERCEL || env.FIELDNOTES_DATA === 'firestore');
}

function initAdmin(env = process.env) {
  if (getApps().length) return;
  const raw = env.FIREBASE_SERVICE_ACCOUNT || env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (raw) {
    const serviceAccount = typeof raw === 'string' ? JSON.parse(raw) : raw;
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || env.FIREBASE_PROJECT_ID || 'fieldnotes-apprenticeship',
    });
    return;
  }
  initializeApp();
}

export async function createRuntimeData({ firestore, env = process.env } = {}) {
  if (!isCloudRuntime(env)) {
    return { storage: 'disk', options: {} };
  }
  if (!firestore) initAdmin(env);
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
