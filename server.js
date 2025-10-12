const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const { OpenAI } = require('openai'); // 🔹 Dodano OpenAI SDK
require('dotenv').config(); // 🔹 Umożliwia korzystanie z .env lokalnie

const app = express();
const port = process.env.PORT || 3000;

// 🔹 Inicjalizacja OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Połączenie z bazą PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Tworzenie tabeli przy starcie serwera
pool.query(`
  CREATE TABLE IF NOT EXISTS wyniki (
    id SERIAL PRIMARY KEY,
    imie TEXT,
    wynik TEXT,
    bledy TEXT,
    czas TEXT,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => {
  console.log("✅ Tabela 'wyniki' gotowa");
}).catch(err => {
  console.error("❌ Błąd tworzenia tabeli:", err);
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Endpoint do zapisu wyniku
app.post('/zapisz-wynik', async (req, res) => {
  const { imie, wynik, bledy, czas } = req.body;
  console.log("📥 Odebrano dane:", req.body);
  try {
    await pool.query(
      'INSERT INTO wyniki (imie, wynik, bledy, czas) VALUES ($1, $2, $3, $4)',
      [imie, wynik, bledy, czas]
    );
    res.send("✅ Wynik zapisany!");
  } catch (err) {
    console.error("❌ Błąd zapisu:", err);
    res.status(500).send("❌ Błąd zapisu");
  }
});

// Endpoint do pobierania wyników
app.get('/wyniki', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM wyniki ORDER BY data DESC');
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Błąd pobierania wyników:", err);
    res.status(500).send("❌ Błąd pobierania wyników");
  }
});

// Endpoint do usuwania wpisu po ID
app.delete('/usun-wynik/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM wyniki WHERE id = $1', [id]);
    res.send(`✅ Wpis ID ${id} został usunięty`);
  } catch (err) {
    console.error("❌ Błąd usuwania wpisu:", err);
    res.status(500).send("❌ Błąd usuwania wpisu");
  }
});

// 🔹 Endpoint do generowania quizu przez OpenAI
app.post('/generuj-quiz-ai', async (req, res) => {
  const { kategoria } = req.body;

  const prompt = `
Wygeneruj 5 pytań quizowych z kategorii "${kategoria}" w formacie JSON.
Każde pytanie powinno mieć:
- unikalne "id"
- pole "question" (może zawierać LaTeX w \\( ... \\))
- obiekt "options" z kluczami A, B, C, D
- pole "correct" z literą poprawnej odpowiedzi
- pole "explanation" z krótkim uzasadnieniem poprawnej odpowiedzi

Zwróć tylko tablicę JSON z 5 pytaniami.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Jesteś generatorem quizów matematycznych." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });

    const raw = response.choices[0].message.content;
    const questions = JSON.parse(raw);
    res.json(questions);
  } catch (err) {
    console.error("❌ Błąd generowania quizu:", err);
    res.status(500).json({ error: "❌ Nie udało się wygenerować quizu." });
  }
});

// Uruchomienie serwera
app.listen(port, () => {
  console.log(`🚀 Serwer działa na porcie ${port}`);
});
