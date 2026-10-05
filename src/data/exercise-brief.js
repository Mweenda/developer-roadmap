export const exerciseUi = {
  briefEyebrow: 'Exercise briefing',
  howLabel: 'How to go about it',
  expectedLabel: 'What is expected',
  startLabel: 'Start the exercise',
  reopenLabel: 'Read the briefing again',
  termSubmitLabel: 'Submit commands for marking',
  termHint: 'This sandbox is not your machine. Commands are recorded here and graded on the server. The API never executes them.',
};

const TEMPLATES = {
  choice: {
    how: 'Read the prompt once. Predict the answer from what this lesson taught, then pick the matching choice. Do not guess from wording tricks.',
    expected: 'One correct choice, and a reason the other options are wrong.',
  },
  predict: {
    how: 'Trace the snippet in order. Write down what each line does to values in memory before you pick.',
    expected: 'The outcome the program actually produces, not the outcome you wish it produced.',
  },
  debug: {
    how: 'Reproduce the failure in your head. Name the symptom, then the line that could cause it, then the fix.',
    expected: 'The diagnosis that matches the bug, with the explanation the lesson already taught.',
  },
  code: {
    how: 'Read the tests in the prompt. Write the function in the editor. Run the in-browser checks. Fix from the failure message, not by pasting.',
    expected: 'A function that passes every in-browser test. Opening a lesson is not mastery.',
  },
  build: {
    how: 'Work through each deliverable step on your machine. Mark complete only when you can show the files and the command output.',
    expected: 'A real artifact (files, repo, or page) that matches the checklist.',
  },
  terminal: {
    how: 'Type real commands in the in-app sandbox, one at a time. Use pwd, ls, and git status to see where you are. The sandbox records your input so the server can mark the sequence.',
    expected: 'The command sequence the exercise names, in order. Extra inspection commands (pwd, ls, git status) are allowed.',
  },
};

export function exerciseGuideline(exercise) {
  const template = TEMPLATES[exercise.type] ?? TEMPLATES.choice;
  const custom = exercise.guideline ?? {};
  return {
    eyebrow: custom.eyebrow ?? exerciseUi.briefEyebrow,
    title: exercise.title,
    prompt: exercise.prompt,
    how: custom.how ?? template.how,
    expected: custom.expected ?? template.expected,
    startLabel: custom.startLabel ?? exerciseUi.startLabel,
    howLabel: exerciseUi.howLabel,
    expectedLabel: exerciseUi.expectedLabel,
  };
}
