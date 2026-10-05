import { tutor } from './tutor.js';

export const habits = [
  { title: 'Foundations before frameworks', body: 'JavaScript → browser → HTTP → Node → database → React. Do not use a framework to skip a fundamental.' },
  { title: 'Every phase has a project', body: 'You do not “finish JavaScript.” You demonstrate it by building something and explaining it.' },
  { title: 'No tutorial hell', body: 'Learn, try an example, close the tutorial, build from memory, get stuck, debug, research, finish, explain.' },
  { title: 'AI is a teacher', body: 'Bring a theory, what you tried, and the error. Do not outsource the thinking. Hints before solutions.' },
  { title: 'Git from day one', body: 'init, status, add, commit, log — then branch, pull request, merge.' },
  { title: 'Look it up like a professional', body: 'Do not memorize JavaScript. Understand it well enough that you know whether to open JavaScript.info, MDN, Node docs, or React docs.' },
];

export const projectMilestones = [
  '01 · Syntax',
  '02 · Problem solving',
  '03 · Browser',
  '04 · Async',
  '05 · Backend',
  '06 · Database',
  '07 · API engineering',
  '08 · React',
  '09 · Full stack',
  '10 · Production',
];

export const landing = {
  eyebrow: 'Personal software-engineering apprenticeship',
  title: 'Learn, practice, prove it, then move on.',
  lede: 'This is not a course catalog. Fieldnotes turns the full-stack JavaScript roadmap into a gated apprenticeship: fundamentals before frameworks, evidence before mastery.',
  bullets: [
    'What should I learn next?',
    'Do I actually understand this?',
    'Where am I weak?',
    'Am I ready to move forward?',
  ],
  primary: { href: '#/register', label: 'Create your learner account' },
  secondary: { href: '#/login', label: 'Sign in' },
};

export function listShell() {
  return { habits, projectMilestones, landing, tutor };
}
