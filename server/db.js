const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'bookings.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name  TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time   TEXT NOT NULL,
    note       TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

const getBookings = db.prepare(`
  SELECT * FROM bookings
  WHERE (:start IS NULL OR end_time > :start)
    AND (:end IS NULL OR start_time < :end)
  ORDER BY start_time
`);

const checkConflict = db.prepare(`
  SELECT id FROM bookings
  WHERE NOT (end_time <= :start_time OR start_time >= :end_time)
  LIMIT 1
`);

const insertBooking = db.prepare(`
  INSERT INTO bookings (user_name, start_time, end_time, note)
  VALUES (:user_name, :start_time, :end_time, :note)
`);

const deleteBooking = db.prepare(`
  DELETE FROM bookings WHERE id = ?
`);

module.exports = { getBookings, checkConflict, insertBooking, deleteBooking };
