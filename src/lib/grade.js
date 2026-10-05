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
  if (exercise.type === 'code') {
    const { solution, ...rest } = exercise;
    return rest;
  }
  if (exercise.type === 'build') {
    const { solution, ...rest } = exercise;
    return rest;
  }
  const { answer, explanation, solution, ...rest } = exercise;
  return rest;
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
