# CLAUDE.md

This file provides guidance to AI assistants (Claude and others) working in this repository.

## Project Overview

**Name:** Lek — Tjänstebilsbokning (shared company car booking system)
**Stack:** React (Vite) + Node.js (Express) + SQLite (`better-sqlite3`)
**Users:** 10 named users, no authentication — name selected from dropdown

## Repository Structure

```
Lek/
├── server/
│   ├── index.js              # Express entry point (port 3001)
│   ├── db.js                 # SQLite setup + prepared statements
│   └── routes/
│       └── bookings.js       # REST API routes + hardcoded user list
├── client/                   # Vite + React frontend
│   ├── vite.config.js        # Proxies /api → localhost:3001
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx            # Main app, week navigation, modal state
│       ├── api.js             # fetch wrappers (fetchUsers, fetchBookings, etc.)
│       └── components/
│           ├── WeekView.jsx   # Week calendar grid (07:00–20:00)
│           ├── BookingModal.jsx # Create / view / delete booking popup
│           └── UserSelect.jsx # Name dropdown
├── package.json              # Root scripts (dev, server, client, install:all)
├── .gitignore
├── bookings.db               # SQLite database (auto-created, gitignored)
└── CLAUDE.md                 # This file
```

## Development Setup

```bash
# First time setup (installs and builds native SQLite addon)
npm run install:all

# Start both server and client in parallel
npm run dev
```

- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:5173

## API

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/users` | Returns list of 10 user names |
| GET | `/api/bookings?start=&end=` | Bookings in ISO date range |
| POST | `/api/bookings` | Create booking, 409 on conflict |
| DELETE | `/api/bookings/:id` | Delete booking by ID |

## Database Schema

```sql
CREATE TABLE bookings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name  TEXT NOT NULL,
  start_time TEXT NOT NULL,   -- ISO 8601: "2026-03-16T08:00"
  end_time   TEXT NOT NULL,
  note       TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

## Changing the 10 Users

Edit the `USERS` array in `server/routes/bookings.js`. The frontend fetches this list dynamically from `/api/users`.

## Code Conventions

- **No TypeScript** — plain JavaScript (ESM in client, CJS in server)
- **No CSS framework** — inline styles throughout the React components
- **No test framework configured** — add one if needed
- Inline styles use plain JS objects; keep styling co-located with components
- All date/times stored and compared as ISO 8601 strings

## Notes for AI Assistants

- `better-sqlite3` requires native bindings; always run `npm rebuild better-sqlite3` after `npm install` if bindings are missing
- The Vite dev server proxies `/api` to port 3001 — no CORS issues in development
- Conflict detection uses an exclusive interval check: `NOT (end_time <= :start_time OR start_time >= :end_time)`
- Adding new users: update `USERS` in `server/routes/bookings.js` only — frontend is dynamic
- Prefer editing existing files over creating new ones

## Git Workflow

### Branches
| Branch | Purpose |
|--------|---------|
| `main` | Primary integration branch |
| `master` | Legacy default branch |
| `claude/*` | AI-generated feature/task branches |

### Commit Conventions
- Imperative mood: "Add X", "Fix Y", not "Added X"
- Keep commits atomic and focused

### Pushing Changes
```bash
git push -u origin <branch-name>
```
