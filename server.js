/**
 * server.js — Servidor local (desenvolvimento) para Lucas Coins Adventure
 *
 * PRODUÇÃO: use Vercel (deploy via GitHub) com api/state.js + Upstash Redis
 * LOCAL:    npm start → http://localhost:3000 (usa SQLite local)
 */

import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

// Compatibilidade __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// better-sqlite3 é CommonJS — carregamos via createRequire
const require = createRequire(import.meta.url);
const { getState, setState } = require('./database.cjs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// ─── API de Estado ──────────────────────────────────────────────────────────
app.get('/api/state', (req, res) => {
  const { key } = req.query;
  if (!key) return res.status(400).json({ error: 'Parâmetro "key" é obrigatório.' });
  try {
    const value = getState(key);
    if (value === null) return res.json({ exists: false, value: null });
    return res.json({ exists: true, value });
  } catch (err) {
    console.error('[GET /api/state]', err.message);
    return res.status(500).json({ error: 'Erro ao ler estado.' });
  }
});

app.post('/api/state', (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ error: 'Campos "key" e "value" são obrigatórios.' });
  }
  try {
    setState(key, value);
    return res.json({ success: true });
  } catch (err) {
    console.error('[POST /api/state]', err.message);
    return res.status(500).json({ error: 'Erro ao salvar estado.' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: 'local-sqlite', timestamp: new Date().toISOString() });
});

app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'lucas-gomes-app.html'));
});

// ─── Inicialização ──────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) { localIP = net.address; break; }
    }
  }
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║     🪙  LUCAS COINS ADVENTURE — Servidor local        ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  💻 Local:       http://localhost:${PORT}               ║`);
  console.log(`║  📱 Rede Wi-Fi:  http://${localIP}:${PORT}       ║`);
  console.log('║  ☁️  Produção:   via Vercel (npm run deploy)          ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
});
