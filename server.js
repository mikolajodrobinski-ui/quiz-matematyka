const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/zapisz-wynik', async (req, res) => {
  const { imie, wynik, bledy } = req.body;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wyniki (
        id SERIAL PRIMARY KEY,
        imie TEXT,
        wynik TEXT,
        bledy TEXT,
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(
      'INSERT INTO wyniki (imie, wynik, bledy) VALUES ($1, $2, $3)',
      [imie, wynik, bledy]
    );
    res.send("✅ Wynik zapisany!");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Błąd zapisu");
  }
});

app.listen(port, () => {
  console.log(`Serwer działa na porcie ${port}`);
});