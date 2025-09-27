let questions = [];

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
}

function submitQuiz() {
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

function sendResult() {
  const name = prompt("Podaj swoje imię:");
  if (!name) {
    alert("Imię jest wymagane.");
    return;
  }

  const score = calculateScore(questions);
  const scoreText = `Wynik: ${score} / ${questions.length}`;
  const wrongAnswersText = collectWrongAnswers(questions);

  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLScSJr1zCKu2lPTC5Tjdcp8V98cXPEQkxYbaL7jMG6qsFuqBBg/formResponse";
  const scoreField = "entry.1830411495";
  const nameField = "entry.534100336";
  const answersField = "entry.1846742322";

  const data = `${scoreField}=${encodeURIComponent(scoreText)}&${nameField}=${encodeURIComponent(name)}&${answersField}=${encodeURIComponent(wrongAnswersText)}`;

  fetch(formURL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: data
  });

  alert("✅ Wynik został wysłany!");
  document.getElementById('check-button').disabled = false;
}

loadQuiz();

