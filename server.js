const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Plik CSV z wynikami
const logFile = path.join(__dirname, "wyniki.csv");

// Pomocnicza funkcja do tworzenia linii CSV
function toCsvLine(values) {
  return values
    .map(v => {
      const s = v === undefined || v === null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(",") + "\n";
}

// Parser CSV
function parseCsv(content) {
  const lines = content.trim().split("\n");
  if (lines.length <= 1) return [];
  const rows = lines.slice(1);
  const splitter = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/;

  return rows.map(line => {
    const cols = line.split(splitter).map(cell => {
      let c = cell.trim();
      if (c.startsWith('"') && c.endsWith('"')) {
        c = c.slice(1, -1).replace(/""/g, '"');
      }
      return c;
    });
    const [id, imie, wynik, bledy, czas, data] = cols;
    return { id, imie, wynik, bledy, czas, data };
  });
}

// Inicjalizacja pliku CSV
function ensureCsvFile() {
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, "id,imie,wynik,bledy,czas,data\n");
  }
}

// Zapis wyniku
app.post("/zapisz-wynik", (req, res) => {
  try {
    const { id, imie, wynik, bledy, czas, data } = req.body;
    ensureCsvFile();
    const line = toCsvLine([id, imie, wynik, bledy || "", czas || "", data || new Date().toISOString()]);
    fs.appendFileSync(logFile, line);
    res.json({ success: true });
  } catch (err) {
    console.error("Błąd zapisu CSV:", err);
    res.status(500).json({ success: false, error: "Błąd zapisu wyniku." });
  }
});

// Odczyt wyników
app.get("/wyniki", (req, res) => {
  try {
    if (!fs.existsSync(logFile)) return res.json([]);
    const content = fs.readFileSync(logFile, "utf8");
    const results = parseCsv(content);
    res.json(results);
  } catch (err) {
    console.error("Błąd odczytu CSV:", err);
    res.status(500).json({ success: false, error: "Błąd odczytu wyników." });
  }
});

// Usuwanie wpisu
app.delete("/usun-wynik/:id", (req, res) => {
  try {
    const idToDelete = String(req.params.id);
    if (!fs.existsSync(logFile)) return res.status(404).send("Brak pliku wyników");

    const content = fs.readFileSync(logFile, "utf8").trim();
    if (!content) return res.send("Plik wyników jest pusty");

    const lines = content.split("\n");
    const headers = lines[0];
    const rows = lines.slice(1);

    const keep = rows.filter(line => {
      const splitter = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/;
      const cols = line.split(splitter).map(cell => {
        let c = cell.trim();
        if (c.startsWith('"') && c.endsWith('"')) {
          c = c.slice(1, -1).replace(/""/g, '"');
        }
        return c;
      });
      return cols[0] !== idToDelete;
    });

    const newContent = [headers, ...keep].join("\n") + (keep.length ? "\n" : "");
    fs.writeFileSync(logFile, newContent);

    res.send(`✅ Wpis ID ${idToDelete} usunięty`);
  } catch (err) {
    console.error("Błąd usuwania z CSV:", err);
    res.status(500).send("❌ Nie udało się usunąć wpisu.");
  }
});

// Endpoint AI (pozostaje, jeśli korzystasz z OpenAI)
app.post("/generuj-quiz-ai", async (req, res) => {
  const { kategoria } = req.body;
  // Tutaj możesz podpiąć OpenAI lub zwrócić przykładowe pytania
  const quiz = [
    {
      id: "ai1",
      question: `Przykładowe pytanie z kategorii ${kategoria}`,
      options: { A: "Odp A", B: "Odp B", C: "Odp C", D: "Odp D" },
      correct: "A",
      explanation: "To jest przykładowe wyjaśnienie."
    }
  ];
  res.json(quiz);
});

app.listen(PORT, () => {
  console.log(`🚀 Serwer działa na porcie ${PORT}`);
});
