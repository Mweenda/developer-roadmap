export function parseRoute(hash = globalThis.location?.hash ?? '#/') {
  const raw = String(hash || '#/').replace(/^#/, '');
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) return { name: 'landing' };
  if (parts[0] === 'login' || parts[0] === 'register') return { name: parts[0] };
  if (parts[0] === 'overview' || parts[0] === 'home') return { name: 'overview' };
  if (parts[0] === 'roadmap' || parts[0] === 'projects' || parts[0] === 'habits' || parts[0] === 'map' || parts[0] === 'profile' || parts[0] === 'settings' || parts[0] === 'git' || parts[0] === 'lab') {
    return { name: parts[0] };
  }
  if (parts[0] === 'journal') {
    if (parts[1] === 'edit' && parts[2]) return { name: 'journal-edit', path: decodeURIComponent(parts[2]) };
    if (parts[1] === 'phase' && parts[2]) return { name: 'journal-phase', phaseId: decodeURIComponent(parts[2]) };
    return { name: 'journal' };
  }
  if (parts[0] === 'docs') return parts[1] ? { name: 'source', id: decodeURIComponent(parts[1]) } : { name: 'docs' };
  if (parts[0] === 'lesson' && parts[1]) return { name: 'doc', id: decodeURIComponent(parts[1]) };
  if (parts[0] === 'phase' && parts[1]) {
    const phaseId = decodeURIComponent(parts[1]);
    if (parts[2] === 'learn' && parts[3]) return { name: 'topic', phaseId, topicId: decodeURIComponent(parts[3]) };
    if (parts[2] === 'exercise' && parts[3]) return { name: 'exercise', phaseId, exerciseId: decodeURIComponent(parts[3]) };
    if (parts[2] === 'quiz') return { name: 'quiz', phaseId };
    return { name: 'phase', phaseId };
  }
  return { name: 'overview' };
}

export function isPublicRoute(route = parseRoute()) {
  return route.name === 'landing' || route.name === 'login' || route.name === 'register';
}
