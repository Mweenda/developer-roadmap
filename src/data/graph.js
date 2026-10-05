import { PHASE_SEQUENCE } from './learning-model.js';
import { phases } from './phases.js';

const CONCEPT_EDGES = [
  ['javascript-core__variables', 'javascript-core__types'],
  ['javascript-core__types', 'javascript-core__operators'],
  ['javascript-core__operators', 'javascript-core__conditionals'],
  ['javascript-core__conditionals', 'javascript-core__loops'],
  ['javascript-core__functions', 'javascript-core__scope'],
  ['javascript-core__scope', 'javascript-core__arrays'],
  ['javascript-core__functions', 'javascript-core__values'],
  ['http-api__protocol', 'http-api__rest'],
  ['express-api__pipeline', 'express-api__crud'],
  ['react__model', 'react__app'],
];

export function knowledgeGraph() {
  const nodes = [];
  for (const phase of phases) {
    nodes.push({ id: phase.id, title: phase.title, kind: 'phase' });
    for (const topic of phase.topics) {
      nodes.push({ id: topic.id, title: topic.title, kind: 'concept', phaseId: phase.id });
    }
  }
  const edges = [];
  for (let index = 1; index < PHASE_SEQUENCE.length; index += 1) {
    edges.push({ from: PHASE_SEQUENCE[index - 1], to: PHASE_SEQUENCE[index], kind: 'phase-requires' });
  }
  for (const [from, to] of CONCEPT_EDGES) {
    edges.push({ from, to, kind: 'concept-requires' });
  }
  return { nodes, edges };
}
