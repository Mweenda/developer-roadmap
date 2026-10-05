export async function bindFirebase(config) {
  if (!config?.apiKey || typeof document === 'undefined') return null;
  const [{ initializeApp }, { getAnalytics }] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js'),
  ]);
  const app = initializeApp(config);
  return getAnalytics(app);
}
