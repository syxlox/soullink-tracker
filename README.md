# Soul Link Tracker

A (vibecoded) real-time Pokemon SoulSilver Soul Link Nuzlocke tracker for two players over LAN. Built for randomized runs with German localization.

## Features

- **100 HGSS routes** across Johto and Kanto with correct encounter methods
- **German Pokemon names** - search works in both German and English (all 493 Gen 1-4)
- **PokeAPI integration** with offline fallback for autocomplete, sprites, and type data
- **Soul Link pairing** - each encounter slot links Player 1 and Player 2 Pokemon
- **Status tracking** - Team, Box, Dead, Missed (fled/uncatchable encounters)
- **Team overview** with type coverage weakness/resistance analysis
- **Graveyard log** with death cause, killer, and date
- **Gym badge tracker** for all 16 badges (8 Johto + 8 Kanto)
- **National Pokedex** progress tracker
- **Statistics** - survival rate, dangerous routes/phases, catch distribution
- **Undo system** - 50-step history with full state rollback
- **LAN sync** - both players see updates within 3 seconds via JSON polling
- **Nuzlocke rules page** hosted alongside the tracker at /regelwerk.html
- **Fully responsive** dark theme, mobile-friendly

## Quick Start

### Docker (recommended)

```bash
docker compose up -d
# Open http://localhost:3000
```

Both players open the same URL on the local network. Data persists in a Docker volume.

### Development

```bash
npm install
npm run dev
# Frontend: http://localhost:5173 (Vite HMR)
# API:      http://localhost:3001
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, inline CSS-in-JS |
| Backend | Express.js, JSON file storage |
| Pokemon Data | PokeAPI v2 + static German name map |
| Fonts | Bebas Neue, DM Sans |
| Container | Node 20 Alpine, multi-stage build |

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/data | Full game state |
| PATCH | /api/data | Partial update (deep-merges encounters) |
| PUT | /api/data | Full state replace |
| POST | /api/undo | Restore previous state |
| GET | /api/undo | Undo availability info |
| DELETE | /api/encounter/:key | Delete single encounter |

Encounter keys follow the pattern {routeId}__{method} (e.g. r29__grass, alph__cave).

## Project Structure

```
soullink/
  src/
    App.jsx          # Entire frontend (single-file React app)
    main.jsx         # React entry point
  public/
    regelwerk.html   # Nuzlocke rules page (German)
  server.js          # Express API + static file server
  Dockerfile         # Multi-stage Node 20 Alpine build
  docker-compose.yml # Local deployment
  index.html         # Vite HTML entry
```


The full German ruleset is available at /regelwerk.html when the tracker is running.

## License

MIT
