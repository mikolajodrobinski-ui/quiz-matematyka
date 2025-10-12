let aiQuestions = [];

function generujQuiz() {
  const category = document.getElementById("category-select").value;
  const container = document.getElementById("quiz-content");
  container.innerHTML = `<p>⏳ Generowanie quizu z kategorii: <strong>${category}</strong>...</p>`;

  fetch("https://quiz-matematyka.onrender.com/generuj-quiz-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kategoria: category })
  })
    .then(res => res.json())
    .then(data => {
      aiQuestions = data;
      renderAIQuiz(aiQuestions);
    })
    .catch(err => {
      console.error("❌ Błąd generowania quizu:", err);
      container.innerHTML = `<p style="color:red;">❌ Nie udało się wygenerować quizu. Spróbuj ponownie później.</p>`;
    });
}

function renderAIQuiz(questions) {
  const container = document.getElementById("quiz-content");
  container.innerHTML = "";

  questions.forEach((q, index) => {
    const div = document.createElement("div");
    div.className = "question";
    div.id = q.id;

    div.innerHTML = `
      <p><strong>Pytanie ${index + 1}:</strong> ${q.question}</p>
      ${Object.entries(q.options).map(([key, value]) => `
        <div class="option-line">
          <input type="radio" name="${q.id}" value="${key}" id="${q.id}_${key}" />
          <label for="${q.id}_${key}">${key}) ${value}</label>
        </div>
      `).join("")}
      <button onclick="toggleExplanation('${q.id}')" style="margin-top: 5px;">ℹ️ Pokaż wyjaśnienie</button>
      <p id="exp-${q.id}" class="explanation" style="display:none;"><em>${q.explanation}</em></p>
    `;

    container.appendChild(div);
  });

  if (window.MathJax) {
    MathJax.typesetPromise();
  }
}

function toggleExplanation(id) {
  const exp = document.getElementById(`exp-${id}`);
  exp.style.display = exp.style.display === "none" ? "block" : "none";
}
