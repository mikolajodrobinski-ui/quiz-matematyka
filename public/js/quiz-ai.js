let aiQuestions = [];
let quizStartTime = null;

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
      quizStartTime = Date.now();
      startTimer(aiQuestions.length * 2 * 60); // 2 minuty na pytanie
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

  // Dodaj przycisk "Wyślij wynik"
  const btnRow = document.createElement("div");
  btnRow.className = "button-row";
  btnRow.innerHTML = `<button id="send-button" onclick="sendResult()">Wyślij wynik</button>`;
  container.appendChild(btnRow);
}

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

function ocenaZaWynik(score, total) {
  const procent = (score / total) * 100;
  if (procent === 100) return "6";
  if (procent >= 95) return "5";
  if (procent >= 85) return "4";
  if (procent >= 70) return "3";
  if (procent >= 50) return "2";
  return "1";
}

function collectWrongAnswers(questions) {
  return questions
    .filter(q => {
      const selected = document.querySelector(`input[name="${q.id}"]:checked`);
      return !selected || selected.value !== q.correct;
    })
    .map(q => `❌ ${q.id}: ${q.question}`)
    .join('; ');
}

function sendResult(auto = false) {
  let name;
  if (auto) {
    name = "Anonim (auto)";
  } else {
    name = prompt("Podaj swoje imię:");
    if (!name) {
      alert("Imię jest wymagane.");
      return;
    }
  }

  const score = calculateScore(aiQuestions);
  const ocena = ocenaZaWynik(score, aiQuestions.length);
  const wrongAnswersText = collectWrongAnswers(aiQuestions);

  const durationMs = Date.now() - quizStartTime;
  const totalSec = Math.floor(durationMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const durationText = `${min}:${sec.toString().padStart(2, '0')}`;
  const data = new Date().toISOString();

  fetch('/zapisz-wynik', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imie: name,
      wynik: score,
      bledy: wrongAnswersText,
      czas: durationText,
      data: data
    })
  })
  .then(res => res.json())
  .then(msg => {
    console.log("✅ Zapis CSV:", msg);
    if (!auto) {
      alert(`✅ Wynik zapisany!\n\nTwój wynik: ${score} / ${aiQuestions.length}\nOcena: ${ocena}`);
    }
    document.getElementById('result').textContent =
      `Twój wynik: ${score} / ${aiQuestions.length} 🧠 Ocena: ${ocena}`;
  })
  .catch(err => {
    console.error("❌ Błąd zapisu:", err);
    alert("❌ Nie udało się wysłać wyników.");
  });
}

function toggleExplanation(id) {
  const exp = document.getElementById(`exp-${id}`);
  exp.style.display = exp.style.display === "none" ? "block" : "none";
}

function startTimer(seconds) {
  const timeDisplay = document.getElementById("time-left");
  let remaining = seconds;

  const interval = setInterval(() => {
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    timeDisplay.textContent = `Czas: ${min}:${sec.toString().padStart(2, '0')}`;
    remaining--;

    if (remaining < 0) {
      clearInterval(interval);
      alert("⏰ Czas minął! Quiz został zakończony.");
      sendResult(true);
    }
  }, 1000);
}
