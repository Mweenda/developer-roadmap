import { resolveGeminiApiKey } from './firebase-config.js';

export async function startFieldnotesAi({
  apiKey = resolveGeminiApiKey(),
  model = process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  generateImpl,
  telemetryImpl,
  enableTelemetry = process.env.ENABLE_FIREBASE_MONITORING === 'true' || process.env.ENABLE_FIREBASE_MONITORING === '1',
} = {}) {
  if (enableTelemetry) {
    try {
      const enable = telemetryImpl ?? (await import('@genkit-ai/firebase')).enableFirebaseTelemetry;
      enable();
    } catch {
      // Firebase monitoring is optional in local development.
    }
  }

  if (generateImpl) {
    const tutorFlow = async ({ system, prompt } = {}) => generateImpl({ system, prompt });
    return { source: 'injected', tutorFlow, generate: tutorFlow };
  }

  if (!apiKey) return null;

  try {
    const { genkit } = await import('genkit');
    const { googleAI } = await import('@genkit-ai/google-genai');
    const ai = genkit({
      plugins: [googleAI({ apiKey })],
      model: googleAI.model(model),
    });
    const tutorFlow = ai.defineFlow('tutorFlow', async ({ system, prompt } = {}) => {
      const { text } = await ai.generate({
        system,
        prompt,
        config: { temperature: 0.3, maxOutputTokens: 1024 },
      });
      return text;
    });
    return { source: 'genkit', tutorFlow, generate: (input) => tutorFlow(input) };
  } catch {
    return null;
  }
}
