export function buildHealth(startedAt = Date.now()) {
  return {
    ok: true,
    service: 'developer-roadmap',
    uptimeMs: Date.now() - startedAt,
  };
}
