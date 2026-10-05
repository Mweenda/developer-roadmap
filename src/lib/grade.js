import { exerciseGuideline } from '../data/exercise-brief.js';

export function gradeQuiz(quiz, answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    const error = new Error('answers must be an object of questionId to choice index');
    error.code = 'INVALID_ANSWERS';
    throw error;
  }

  const results = quiz.questions.map((question) => {
    const selected = answers[question.id];
    const isCorrect = selected === question.answer;
    return {
      id: question.id,
      selected: typeof selected === 'number' ? selected : null,
      correct: question.answer,
      isCorrect,
      explanation: question.explanation,
    };
  });
  const correct = results.filter((result) => result.isCorrect).length;
  const score = Math.round((correct / quiz.questions.length) * 100);
  return {
    score,
    passed: score >= quiz.passingScore,
    correct,
    total: quiz.questions.length,
    results,
  };
}

function invalid(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeCommand(line) {
  return String(line ?? '').trim().replace(/\s+/g, ' ');
}

function commandTokens(line) {
  const tokens = [];
  let current = '';
  let quote = '';
  for (const char of normalizeCommand(line)) {
    if (quote) {
      if (char === quote) quote = '';
      else current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === ' ') {
      if (current) tokens.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current) tokens.push(current);
  return tokens;
}

function sameSet(left, right) {
  if (left.length !== right.length) return false;
  const extra = [...left];
  for (const item of right) {
    const index = extra.indexOf(item);
    if (index < 0) return false;
    extra.splice(index, 1);
  }
  return extra.length === 0;
}

export function commandsMatch(actual, expected) {
  const left = normalizeCommand(actual);
  const right = normalizeCommand(expected);
  if (left === right) return true;
  const a = commandTokens(left);
  const b = commandTokens(right);
  if (!a.length || a[0] !== b[0]) return false;
  if (a[0] === 'touch') return sameSet(a.slice(1), b.slice(1));
  if (a[0] === 'git' && a[1] === 'add') return a[1] === b[1] && sameSet(a.slice(2), b.slice(2));
  if (a[0] === 'git' && a[1] === 'commit') {
    const messageA = a.slice(a.indexOf('-m') + 1).join(' ').toLowerCase();
    const messageB = b.slice(b.indexOf('-m') + 1).join(' ').toLowerCase();
    return a[1] === b[1] && messageA === messageB;
  }
  return false;
}

export function gradeTerminalExercise(exercise, commands) {
  if (!Array.isArray(commands) || commands.some((line) => typeof line !== 'string')) {
    throw invalid('INVALID_COMMANDS', 'commands must be an array of command strings');
  }
  const need = (exercise.expectedCommands ?? []).map(normalizeCommand).filter(Boolean);
  let matched = 0;
  for (const line of commands) {
    if (matched < need.length && commandsMatch(line, need[matched])) matched += 1;
  }
  const passed = matched === need.length && need.length > 0;
  return {
    passed,
    matched,
    total: need.length,
    executed: false,
    evaluatedOnServer: true,
    explanation: passed
      ? 'Command sequence marked from your sandbox transcript. Nothing was executed on the API server.'
      : 'The command sequence is incomplete. Inspect with pwd, ls, and git status, then continue. The server does not run your commands.',
  };
}

export function gradeChoiceExercise(exercise, selected) {
  if (!Number.isInteger(selected)) {
    const error = new Error('selected must be an integer choice index');
    error.code = 'INVALID_SELECTED';
    throw error;
  }
  const passed = selected === exercise.answer;
  return {
    passed,
    selected,
    answer: exercise.answer,
    explanation: exercise.explanation,
    solution: exercise.solution ?? null,
  };
}

export function publicExercise(exercise) {
  const guideline = exerciseGuideline(exercise);
  if (exercise.type === 'terminal') {
    const { expectedCommands, solution, answer, explanation, guideline: _ignored, ...rest } = exercise;
    return { ...rest, guideline };
  }
  if (exercise.type === 'code' || exercise.type === 'build') {
    const { solution, expectedCommands, guideline: _ignored, ...rest } = exercise;
    return { ...rest, guideline };
  }
  const { answer, explanation, solution, expectedCommands, guideline: _ignored, ...rest } = exercise;
  return { ...rest, guideline };
}

export function publicPhase(phase) {
  return {
    ...phase,
    exercises: phase.exercises.map(publicExercise),
    quiz: {
      id: phase.quiz.id,
      passingScore: phase.quiz.passingScore,
      questions: phase.quiz.questions.map(({ answer, explanation, ...question }) => question),
    },
  };
}

export function publicTopic(topic, phase) {
  return {
    id: topic.id,
    phaseId: phase.id,
    phaseTitle: phase.title,
    title: topic.title,
    minutes: topic.minutes,
    summary: topic.summary,
    content: topic.content,
  };
}
