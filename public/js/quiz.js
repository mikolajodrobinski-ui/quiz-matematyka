let questions = [];
let quizStartTime = null;

async function loadQuiz() {
  const response = await fetch('data/questions2.json');
  questions = await response.json();
  const form = document.getElementById('quiz-form');

  questions.forEach((q, index) => {
    const div = document.createElement('div');
    div.className = 'question';
    div.id = q.id;

    div.innerHTML = `
      <p><strong>Pytanie ${index + 1}:</strong> ${q.question}</p>
      ${Object.entries(q.options).map(([key, value]) => `
        <div class="option-line">
          <input type="radio" name="${q.id}" value="${key}" id="${q.id}_${key}" />
          <label for="${q.id}_${key}">${key}) ${value}</label>
        </div>
      `).join('')}
      <p class="feedback" id="fb_${q.id}"></p>
    `;

    form.appendChild(div);
  });

  quizStartTime = Date.now();
  startTimer(questions.length * 2 * 60); // 2 minuty na pytanie

  // Zablokuj przycisk sprawdzania na starcie
  document.getElementById('check-button').disabled = true;
  document.getElementById('send-button').disabled = false;
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

function collectWrongAnswers(questions) {
  return questions
    .filter(q => {
      const selected = document.querySelector(`input[name="${q.id}"]:checked`);
      return !selected || selected.value !== q.correct;
    })
    .map(q => `❌ ${q.id}: ${q.question}`)
    .join('\n');
}

function submitQuiz() {
  const checkButton = document.getElementById('check-button');
  if (checkButton.disabled) {
    alert("📩 Najpierw wyślij odpowiedzi do nauczyciela.");
    return;
  }

  const score = calculateScore(questions);
  questions.forEach(q => {
    const selected = document.querySelector(`input[name="${q.id}"]:checked`);
    const feedback = document.getElementById(`fb_${q.id}`);
    if (selected && selected.value === q.correct) {
      feedback.textContent = "✅ Dobra odpowiedź!";
      feedback.className = "correct";
    } else {
      feedback.textContent = "❌ Zła odpowiedź.";
      feedback.className = "incorrect";
    }
  });

  const result = document.getElementById('result');
  result.textContent = `Twój wynik: ${score} / ${questions.length}`;
  result.scrollIntoView({ behavior: 'smooth' });
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

  const score = calculateScore(questions);
  const scoreText = `Wynik: ${score} / ${questions.length}`;
  const wrongAnswersText = collectWrongAnswers(questions);

  const durationMs = Date.now() - quizStartTime;
  const totalSec = Math.floor(durationMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const durationText = `${min} min ${sec} sek`;

  fetch('https://quiz-matematyka.onrender.com/zapisz-wynik', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imie: name,
      wynik: scoreText,
      bledy: wrongAnswersText,
      czas: durationText
    })
  })
  .then(res => res.text())
  .then(msg => {
    console.log("✅ Baza danych:", msg);
    if (!auto) alert(msg);
    document.getElementById('check-button').disabled = false;
    document.getElementById('send-button').disabled = true;
  })
  .catch(err => {
    console.error("❌ Błąd zapisu do bazy:", err);
    alert("❌ Nie udało się wysłać wyników.");
  });
}

function startTimer(seconds) {
  const timeDisplay = document.getElementById("time-left");
  let remaining = seconds;

  const interval = setInterval(() => {
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    timeDisplay.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
    remaining--;

    if (remaining < 0) {
      clearInterval(interval);
      alert("⏰ Czas minął! Quiz został zakończony.");
      submitQuiz();
      sendResult(true); // automatyczne wysłanie
      document.getElementById('check-button').disabled = false;
      document.getElementById('send-button').disabled = true;
    }
  }, 1000);
}

loadQuiz();
