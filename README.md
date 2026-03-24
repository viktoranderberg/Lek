# Tjänstebil – Bokningssystem

Ett webbaserat bokningssystem för delad tjänstebil. Byggd för små team (~10 personer) med realtidssynk, konfliktdetektering och ruttberäkning.

## Funktioner

- **Kalender- och listvy** – bläddra månadsvis eller se alla bokningar i en lista
- **Realtidssynk** – ändringar syns direkt för alla inloggade användare via Supabase Realtime
- **Konfliktdetektering** – förhindrar dubbelbokningar med tidskänslig kontroll (datum + klockslag)
- **Ruttberäkning** – beräkna körsträcka i mil/km med adresssökning (OpenStreetMap + OSRM)
- **CSV-export** – exportera bokningar per användare eller totalt
- **Adminpanel** – lägg till/ta bort användare, skyddad med Supabase Auth
- **Ångra-funktion** – återställ oavsiktligt borttagna bokningar

## Tech Stack

| Lager | Teknik |
|-------|--------|
| Frontend | Vanilla JavaScript, HTML5, CSS3 |
| Backend | Node.js + Express |
| Databas & Auth | [Supabase](https://supabase.com) (PostgreSQL) |
| Geocoding | [Nominatim](https://nominatim.openstreetmap.org) (OpenStreetMap) |
| Routing | [OSRM](https://project-osrm.org) |

## Kom igång

### Krav

- Node.js 18+
- Ett Supabase-projekt med tabellerna `bookings` och `users`

### Installation

```bash
git clone https://github.com/viktoranderberg/Lek.git
cd Lek
npm install
```

Skapa en `.env`-fil i rotkatalogen:

```env
SUPABASE_URL=din_supabase_url
SUPABASE_ANON_KEY=din_anon_key
ADMIN_EMAIL=din_adminemail@example.com
PORT=3000
```

Starta servern:

```bash
npm start
```

Öppna [http://localhost:3000](http://localhost:3000) i webbläsaren.

## Databasschema

### `bookings`

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| `id` | text | Unikt ID |
| `user_name` | text | Bokad av |
| `start_date` | date | Startdatum (YYYY-MM-DD) |
| `end_date` | date | Slutdatum (YYYY-MM-DD) |
| `start_time` | time | Starttid (HH:MM) |
| `end_time` | time | Sluttid (HH:MM) |
| `dest` | text | Destination |
| `notes` | text | Anteckningar |

### `users`

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| `id` | int | Auto-inkrementerat ID |
| `name` | text | Unikt användarnamn |

## Projektstruktur

```
├── server.js          # Express-server, serverar statiska filer + /api/config
├── public/
│   ├── index.html     # App-struktur och modaler
│   ├── app.js         # All frontend-logik
│   └── style.css      # Styling med CSS-variabler
├── .env               # Miljövariabler (ej versionshanterad)
└── package.json
```
