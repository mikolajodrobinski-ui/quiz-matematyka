function calculateScore(questions) {
  let score = 0;
  questions.forEach(q => {
    const selected = document.querySelector(`input[name="${q.id}"]:checked`);
    if (selected && selected.value === q.correct) {
      score++;
    }
  });
  return score;
}

function collectWrongAnswers(questions) {
  return questions
    .map((q, i) => {
      const selected = document.querySelector(`input[name="${q.id}"]:checked`);
      const value = selected ? selected.value : "brak";
      return value !== q.correct ? `Pytanie ${i + 1}: ${value}` : null;
    })
    .filter(Boolean)
    .join(", ") || "Brak błędnych odpowiedzi";
}

