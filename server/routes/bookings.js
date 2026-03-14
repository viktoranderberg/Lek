const express = require('express');
const router = express.Router();
const { getBookings, checkConflict, insertBooking, deleteBooking } = require('../db');

const USERS = [
  'Anna Andersson',
  'björn Bergström',
  'Cecilia Carlsson',
  'David Danielsson',
  'Eva Eriksson',
  'Fredrik Fredriksson',
  'Greta Gustafsson',
  'Henrik Hansson',
  'Ingrid Isaksson',
  'Johan Johansson',
];

router.get('/users', (req, res) => {
  res.json(USERS);
});

router.get('/bookings', (req, res) => {
  const { start, end } = req.query;
  const bookings = getBookings.all({ start: start || null, end: end || null });
  res.json(bookings);
});

router.post('/bookings', (req, res) => {
  const { user_name, start_time, end_time, note } = req.body;

  if (!user_name || !start_time || !end_time) {
    return res.status(400).json({ error: 'user_name, start_time och end_time krävs' });
  }
  if (start_time >= end_time) {
    return res.status(400).json({ error: 'Sluttid måste vara efter starttid' });
  }
  if (!USERS.includes(user_name)) {
    return res.status(400).json({ error: 'Okänt användarnamn' });
  }

  const conflict = checkConflict.get({ start_time, end_time });
  if (conflict) {
    return res.status(409).json({ error: 'Bilen är redan bokad under den valda tiden' });
  }

  const result = insertBooking.run({ user_name, start_time, end_time, note: note || null });
  res.status(201).json({ id: result.lastInsertRowid, user_name, start_time, end_time, note });
});

router.delete('/bookings/:id', (req, res) => {
  const result = deleteBooking.run(Number(req.params.id));
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Bokning hittades inte' });
  }
  res.status(204).end();
});

module.exports = router;
