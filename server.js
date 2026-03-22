require('dotenv').config();
const express = require('express');
const path    = require('path');

const app = express();
app.use(express.json());
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
