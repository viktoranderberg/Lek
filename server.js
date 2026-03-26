require('dotenv').config();
const express = require('express');
const path    = require('path');

const app = express();
app.use(express.json());

// ── Säkerhetsheaders ──────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});

// Blockera direkt åtkomst till källkoden
app.get('/app.js',     (_req, res) => res.status(404).end());
app.get('/app.min.js', (req,  res, next) => {
  if (!req.get('Referer')) return res.status(404).end();
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Exponerar icke-hemliga Supabase-värden till frontend
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl:     process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    adminEmail:      process.env.ADMIN_EMAIL
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Tjänstebil Bokningssystem kör på http://localhost:${process.env.PORT || 3000}`);
});
