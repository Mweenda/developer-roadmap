import { tutor } from './tutor.js';
import { studio } from './studio.js';
import { celebrate } from './celebrate.js';
import { accountMenu, profilePage, settingsPage } from './account.js';
import { exerciseUi } from './exercise-brief.js';

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

export const landingCards = [
  {
    question: 'What should I learn next?',
    evidence: 'Mock snapshot: Phase 0 · Developer environment. Next lesson: the terminal. The queue is the current gate, not a page you opened.',
  },
  {
    question: 'Do I actually understand this?',
    evidence: 'Mock snapshot: 0 lessons evidenced, 0 exercises passed, quiz 0%. Opening a lesson stays LEARNING until you practice.',
  },
  {
    question: 'Where am I weak?',
    evidence: 'Mock snapshot: no weak concepts yet. Missed exercises and quizzes will list the idea here — empty means no failures yet.',
  },
  {
    question: 'Am I ready to move forward?',
    evidence: 'Mock snapshot: Phase 0 stays locked until the lesson, exercises, and quiz pass. Visiting the roadmap does not unlock Phase 1.',
  },
];

export const landing = {
  eyebrow: 'Personal software-engineering apprenticeship',
  title: 'Learn, practice, prove it, then move on.',
  lede: 'This is not a course catalog. Fieldnotes turns the full-stack JavaScript roadmap into a gated apprenticeship: fundamentals before frameworks, evidence before mastery.',
  cards: landingCards,
  bullets: landingCards.map((card) => card.question),
  primary: { href: '#/register', label: 'Create your learner account' },
  secondary: { href: '#/login', label: 'Sign in' },
  continue: { href: '#/overview', label: 'Continue your apprenticeship' },
};

export function listShell() {
  return { habits, projectMilestones, landing, tutor, studio, celebrate, accountMenu, profilePage, settingsPage, exerciseUi };
}
