export const MENTOR_LEVELS = [
  { level: 0, name: 'No help' },
  { level: 1, name: 'Concept hint' },
  { level: 2, name: 'Directional hint' },
  { level: 3, name: 'Detailed explanation' },
  { level: 4, name: 'Example' },
  { level: 5, name: 'Solution' },
];

const FALLBACK = {
  1: 'Name the inputs and the output before you touch the keyboard.',
  2: 'Which language feature is this exercise actually testing? Stay there.',
  3: 'Write the happy path in one sentence, then translate that sentence into code.',
  4: 'Start from a tiny example you can evaluate by hand, then generalise.',
  5: 'Open the worked solution only after you have a failing attempt. Then close it and rewrite from memory.',
};

const BY_EXERCISE = {
  'javascript-core__add': {
    1: 'A function returns a value. What should add do with a and b?',
    2: 'You need one expression that combines the two parameters.',
    3: 'Use the + operator and return the result. Do not console.log instead of return.',
    4: 'add(2, 3) should yield 5.',
    5: 'return a + b;',
  },
  'javascript-core__map-bug': {
    1: 'What is the type of each element in users?',
    2: 'map’s callback must return the next array element.',
    3: 'These are strings, not objects. user.name is not a field you set.',
    4: 'users.map((user) => user) would copy the strings through.',
    5: 'Either map strings directly, or model users as { name } objects and return user.name.',
  },
};

export function mentorHelp(exerciseId, level) {
  const n = Number(level);
  if (!Number.isInteger(n) || n < 0 || n > 5) {
    const error = new Error('level must be an integer from 0 to 5');
    error.code = 'INVALID_LEVEL';
    throw error;
  }
  if (n === 0) return { level: 0, name: MENTOR_LEVELS[0].name, text: 'Try the problem first. The mentor stays quiet.' };
  const text = BY_EXERCISE[exerciseId]?.[n] ?? FALLBACK[n];
  return { level: n, name: MENTOR_LEVELS[n].name, text, exerciseId: exerciseId ?? null };
}
