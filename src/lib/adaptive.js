export function buildAdaptive(phaseReports, weak = []) {
  const strong = phaseReports
    .filter((phase) => phase.unlocked && phase.mastery >= 80)
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 5)
    .map((phase) => ({ id: phase.id, title: phase.title, mastery: phase.mastery }));

  const forgotten = phaseReports
    .filter((phase) => phase.reviewDue)
    .map((phase) => ({ id: phase.id, title: phase.title, reason: 'Review is due', href: `#/phase/${encodeURIComponent(phase.id)}/quiz` }));

  const recommended = [];
  for (const item of weak.slice(0, 3)) {
    recommended.push({
      id: item.id,
      title: item.title,
      why: item.reason,
      href: item.href,
    });
  }
  for (const item of forgotten) {
    if (!recommended.some((entry) => entry.id === item.id)) {
      recommended.push({ id: item.id, title: `Review: ${item.title}`, why: item.reason, href: item.href });
    }
  }
  return {
    strong,
    weak: weak.slice(0, 8),
    forgotten,
    recommended: recommended.slice(0, 6),
  };
}
