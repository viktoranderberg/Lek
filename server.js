require('dotenv').config();
const express = require('express');
const jwt     = require('jsonwebtoken');
const fs      = require('fs');
const path    = require('path');

const app        = express();
const PORT       = process.env.PORT || 3000;
const SECRET     = process.env.JWT_SECRET;
const USERS_FILE = path.join(__dirname, 'users.json');
const DEFAULT_USERS = ['Ninos','Viktor A','Viktor S','Tobias','Darko','Martina','Emil','Kevin','Hannes','Anna'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Helpers ───────────────────────────────────────────────────────────────────
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2));
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Ej inloggad' });
  }
  try {
    jwt.verify(auth.slice(7), SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Ogiltig eller utgången token' });
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Admin login
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Fel lösenord' });
  }
  const token = jwt.sign({ role: 'admin' }, SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// Hämta användarlista (publik)
app.get('/api/users', (req, res) => {
  res.json(readUsers());
});

// Lägg till användare (admin)
app.post('/api/users', requireAdmin, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Namn saknas' });
  }
  const clean = name.trim();
  const users = readUsers();
  if (users.includes(clean)) {
    return res.status(409).json({ error: 'Användaren finns redan' });
  }
  users.push(clean);
  writeUsers(users);
  res.json(users);
});

// Ta bort användare (admin)
app.delete('/api/users/:name', requireAdmin, (req, res) => {
  const name  = decodeURIComponent(req.params.name);
  const users = readUsers().filter(u => u !== name);
  writeUsers(users);
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`Tjänstebil Bokningssystem kör på http://localhost:${PORT}`);
});
