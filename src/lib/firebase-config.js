import { firebaseWeb } from '../data/firebase.js';

export function resolveGeminiApiKey() {
  return process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

export function firebaseClientConfig(env = process.env) {
  return {
    apiKey: env.FIREBASE_API_KEY || firebaseWeb.apiKey,
    authDomain: env.FIREBASE_AUTH_DOMAIN || firebaseWeb.authDomain,
    projectId: env.FIREBASE_PROJECT_ID || firebaseWeb.projectId,
    storageBucket: env.FIREBASE_STORAGE_BUCKET || firebaseWeb.storageBucket,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || firebaseWeb.messagingSenderId,
    appId: env.FIREBASE_APP_ID || firebaseWeb.appId,
    measurementId: env.FIREBASE_MEASUREMENT_ID || firebaseWeb.measurementId,
  };
}

export function publicRuntimeConfig({ geminiConfigured = Boolean(resolveGeminiApiKey()) } = {}) {
  return {
    firebase: firebaseClientConfig(),
    genkit: { configured: geminiConfigured },
  };
}
