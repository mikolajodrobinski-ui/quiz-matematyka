const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

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

// Tymczasowy endpoint do dodania kolumny 'czas'
app.get('/dodaj-czas', async (req, res) => {
  try {
    await pool.query('ALTER TABLE wyniki ADD COLUMN czas TEXT');
    res.send("✅ Kolumna 'czas' została dodana");
  } catch (err) {
    console.error("❌ Błąd ALTER TABLE:", err);
    res.status(500).send("❌ Nie udało się dodać kolumny");
  }
});

// Uruchomienie serwera
app.listen(port, () => {
  console.log(`🚀 Serwer działa na porcie ${port}`);
});
