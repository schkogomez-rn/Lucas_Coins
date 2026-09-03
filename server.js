/**
 * server.js — Servidor Express para Lucas Coins Adventure
 * 
 * Rotas da API:
 *   GET  /api/state?key=<chave>   → retorna o estado salvo
 *   POST /api/state               → salva o estado (body: { key, value })
 *
 * Acesso:
 *   - Local:       http://localhost:3000
 *   - Rede local:  http://<IP-do-computador>:3000
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const { getState, setState } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve os arquivos estáticos da pasta do projeto
app.use(express.static(path.join(__dirname)));

// ─── API de Estado ──────────────────────────────────────────────────────────

/**
 * GET /api/state?key=<chave>
 * Retorna o estado salvo para a chave informada.
 */
app.get('/api/state', (req, res) => {
  const { key } = req.query;
  if (!key) {
    return res.status(400).json({ error: 'Parâmetro "key" é obrigatório.' });
  }
  try {
    const value = getState(key);
    if (value === null) {
      return res.json({ exists: false, value: null });
    }
    return res.json({ exists: true, value });
  } catch (err) {
    console.error('[GET /api/state]', err.message);
    return res.status(500).json({ error: 'Erro ao ler estado.' });
  }
});

/**
 * POST /api/state
 * Salva o estado. Body esperado: { key: string, value: string }
 */
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

/**
 * GET /api/health
 * Rota de verificação de saúde do servidor.
 */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Catch-all: serve o app HTML para qualquer rota não-API ─────────────────
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'lucas-gomes-app.html'));
});

// ─── Inicialização ──────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  // Descobre o IP local para mostrar o endereço de rede
  const nets = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        localIP = net.address;
        break;
      }
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║     🪙  LUCAS COINS ADVENTURE — Servidor ativo!      ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  💻 Local:       http://localhost:${PORT}               ║`);
  console.log(`║  📱 Rede Wi-Fi:  http://${localIP}:${PORT}       ║`);
  console.log('║                                                      ║');
  console.log('║  Pressione Ctrl+C para parar o servidor.             ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
});
