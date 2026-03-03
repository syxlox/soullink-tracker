# 🔴⚪ Soul Link Tracker

Pokémon SoulSilver Randomized Soul Link Tracker für 2 Spieler im LAN.

## Quick Start (heute, WSL)

```bash
# 1. Ordner auf einen der PCs kopieren
# 2. In WSL:
cd soullink
npm install
npm run dev
```

Das startet:
- **Vite Dev Server** auf `http://localhost:5173` (Frontend + Hot Reload)
- **Express API** auf `http://localhost:3001` (Daten-Sync)

### Beide PCs verbinden

1. WSL-IP herausfinden: `hostname -I` (erster Wert)
2. Beide PCs öffnen: `http://<WSL-IP>:5173`
3. Daten synchen automatisch alle 3 Sekunden

> **Tipp:** Falls Windows Firewall blockt:
> ```powershell
> # In PowerShell als Admin:
> netsh interface portproxy add v4tov4 listenport=5173 listenaddress=0.0.0.0 connectport=5173 connectaddress=$(wsl hostname -I | cut -d' ' -f1)
> netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=$(wsl hostname -I | cut -d' ' -f1)
> # Firewall-Regel:
> netsh advfirewall firewall add rule name="SoulLink" dir=in action=allow protocol=tcp localport=5173,3001
> ```

## Docker (langfristig)

```bash
docker-compose up -d
# Öffne http://<IP>:3000
```

Daten werden in `./data/` persistiert.

## Features

- ✅ Alle ~85 HGSS-Routen (Johto + Kanto)
- ✅ PokeAPI Autocomplete mit deutschen Namen + Typ-Badges
- ✅ Status: Team ⚔️ / Box 📦 / Tot 💀
- ✅ Team-Übersicht mit Typ-Coverage-Analyse
- ✅ Friedhof-Log (Todesursache + Killer)
- ✅ Gym-Badge-Tracker (alle 16 Badges)
- ✅ Level-Tracker pro Pokémon
- ✅ Undo-Button (50 Schritte History)
- ✅ Statistik-Tab (Überlebensrate, gefährlichste Routen/Phasen)
- ✅ Nationaler Pokédex (493 Pokémon)
- ✅ LAN-Sync via JSON-Polling (3s)
- ✅ Dark Pokémon Theme

## API Endpoints

| Method | Route | Beschreibung |
|--------|-------|-------------|
| GET | `/api/data?v=N` | Daten laden (304 wenn keine Änderung) |
| PATCH | `/api/data` | Partial Update (mergt encounters) |
| PUT | `/api/data` | Full Replace |
| POST | `/api/undo` | Letzte Aktion rückgängig |
| GET | `/api/undo` | Undo-Info (Anzahl verfügbar) |
| DELETE | `/api/encounter/:key` | Einzelnen Encounter löschen |

## Tech Stack

- React 18 + Vite
- Express.js (API + Static Serving)
- PokeAPI v2
- Inline CSS-in-JS
- Fonts: Bebas Neue + DM Sans
