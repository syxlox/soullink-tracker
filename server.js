import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const dataDir = process.env.DATA_DIR || __dirname;
const DATA_FILE = join(dataDir, 'data.json');
const HISTORY_FILE = join(dataDir, 'history.json');
const MAX_HISTORY = 50;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Serve built React app in production
const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
}

// --- Data helpers ---
function readData() {
  if (!existsSync(DATA_FILE)) {
    const initial = { encounters: {}, p1N: 'Spieler 1', p2N: 'Spieler 2', badges: {}, graveyard: [], version: 0 };
    writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
}

function writeData(data) {
  data.version = (data.version || 0) + 1;
  data.lastModified = new Date().toISOString();
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  return data;
}

function readHistory() {
  if (!existsSync(HISTORY_FILE)) return [];
  try { return JSON.parse(readFileSync(HISTORY_FILE, 'utf-8')); } catch { return []; }
}

function pushHistory(data) {
  const history = readHistory();
  history.push({ data: JSON.parse(JSON.stringify(data)), ts: new Date().toISOString() });
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  writeFileSync(HISTORY_FILE, JSON.stringify(history));
}

// --- API Routes ---

// Disable ETag caching on API routes
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('ETag', '');
  app.set('etag', false);
  next();
});

// GET data (always returns full data, client does version comparison)
app.get('/api/data', (req, res) => {
  const data = readData();
  res.json(data);
});

// PUT data (full replace)
app.put('/api/data', (req, res) => {
  const current = readData();
  pushHistory(current);
  const updated = writeData(req.body);
  res.json(updated);
});

// PATCH data (partial update - merges top-level keys)
app.patch('/api/data', (req, res) => {
  const current = readData();
  pushHistory(current);
  const merged = { ...current, ...req.body };
  // Deep merge encounters
  if (req.body.encounters) {
    merged.encounters = { ...current.encounters, ...req.body.encounters };
    // Handle deletions (null values)
    for (const [k, v] of Object.entries(merged.encounters)) {
      if (v === null) delete merged.encounters[k];
    }
  }
  const updated = writeData(merged);
  res.json(updated);
});

// POST undo (restore previous state)
app.post('/api/undo', (req, res) => {
  const history = readHistory();
  if (history.length === 0) return res.status(404).json({ error: 'Keine Undo-History' });
  const prev = history.pop();
  writeFileSync(HISTORY_FILE, JSON.stringify(history));
  const restored = writeData(prev.data);
  res.json(restored);
});

// GET undo info
app.get('/api/undo', (req, res) => {
  const history = readHistory();
  res.json({ available: history.length, lastAction: history.length > 0 ? history[history.length - 1].ts : null });
});

// DELETE specific encounter
app.delete('/api/encounter/:key', (req, res) => {
  const current = readData();
  pushHistory(current);
  delete current.encounters[req.params.key];
  const updated = writeData(current);
  res.json(updated);
});

// Catch-all: serve React app (production)
if (existsSync(distPath)) {
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🔴⚪ Soul Link Server läuft auf:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  
  // Show LAN IP
  import('os').then(os => {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          console.log(`   LAN:     http://${net.address}:${PORT}`);
        }
      }
    }
    console.log(`\n📁 Daten: ${DATA_FILE}`);
    console.log(`⏪ History: ${HISTORY_FILE} (max ${MAX_HISTORY} Einträge)\n`);
  });
});
