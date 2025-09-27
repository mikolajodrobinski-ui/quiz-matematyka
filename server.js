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
  const { imie, wynik, bledy } = req.body;
  try {
    await pool.query(
      'INSERT INTO wyniki (imie, wynik, bledy) VALUES ($1, $2, $3)',
      [imie, wynik, bledy]
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

// Uruchomienie serwera
app.listen(port, () => {
  console.log(`✅ Serwer działa na porcie ${port}`);
});