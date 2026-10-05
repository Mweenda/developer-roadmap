export const REVIEW_CRITERIA = [
  { id: 'functionality', label: 'Functionality' },
  { id: 'quality', label: 'Code quality' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'errors', label: 'Error handling' },
  { id: 'a11y', label: 'Accessibility' },
  { id: 'security', label: 'Security' },
  { id: 'testing', label: 'Testing' },
  { id: 'git', label: 'Git usage' },
  { id: 'docs', label: 'Documentation' },
];

export function scoreProject(ratings = {}) {
  const scores = {};
  for (const criterion of REVIEW_CRITERIA) {
    const value = Number(ratings[criterion.id]);
    if (!Number.isFinite(value) || value < 0 || value > 10) {
      const error = new Error(`${criterion.label} must be a number from 0 to 10`);
      error.code = 'INVALID_REVIEW';
      throw error;
    }
    scores[criterion.id] = Math.round(value * 10) / 10;
  }
  const values = Object.values(scores);
  const overall = Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  const weakest = REVIEW_CRITERIA.slice().sort((a, b) => scores[a.id] - scores[b.id])[0];
  return {
    scores,
    overall,
    nextImprovement: `Your next improvement should be ${weakest.label.toLowerCase()} because it is the weakest dimension (${scores[weakest.id]}/10).`,
  };
}
