const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("❌ DB connect error:", err);
  } else {
    console.log("✅ Connected to SQLite");
  }
});

// 🔥 สร้าง table
db.run(`
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  lat REAL,
  lng REAL
)
`);

// 📥 เพิ่มลูกค้า
app.post("/add", (req, res) => {
  const { name, lat, lng } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ error: "lat/lng required" });
  }

  db.run(
    "INSERT INTO customers (name, lat, lng) VALUES (?, ?, ?)",
    [name || "ลูกค้าใหม่", lat, lng],
    function (err) {
      if (err) {
        console.error("❌ Insert error:", err);
        return res.status(500).send(err);
      }

      res.json({ success: true, id: this.lastID });
    }
  );
});

// ❌ ลบลูกค้า
app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;

  db.run(
    "DELETE FROM customers WHERE id = ?",
    [id],
    function (err) {
      if (err) {
        console.error("❌ Delete error:", err);
        return res.status(500).send(err);
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "ไม่พบข้อมูล" });
      }

      res.json({ success: true });
    }
  );
});

// 📤 ดึงข้อมูลทั้งหมด
app.get("/customers", (req, res) => {
  db.all("SELECT * FROM customers", [], (err, rows) => {
    if (err) {
      console.error("❌ Fetch error:", err);
      return res.status(500).send(err);
    }

    res.json(rows);
  });
});

// 🔥 test route (เช็ค server)
app.get("/", (req, res) => {
  res.send("Server OK");
});

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});