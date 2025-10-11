function generujQuiz() {
  const category = document.getElementById("category-select").value;
  const form = document.getElementById("quiz-form");
  form.innerHTML = `<p>⏳ Generowanie quizu z kategorii: <strong>${category}</strong>...</p>`;

  // Tu w przyszłości dodamy wywołanie API AI
  // Na razie tylko placeholder
  setTimeout(() => {
    form.innerHTML += `<p>✅ Quiz wygenerowany! (Tu pojawią się pytania)</p>`;
  }, 1000);
}
