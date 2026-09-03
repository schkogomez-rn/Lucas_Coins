/**
 * api/state.js — Função Serverless Vercel
 * Banco: Upstash Redis (gratuito, persistente na nuvem)
 *
 * GET  /api/state?key=<chave>  → retorna estado salvo
 * POST /api/state              → salva estado { key, value }
 */

import { Redis } from '@upstash/redis';

// Inicializa o Redis com as variáveis de ambiente do Vercel
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  // ─── CORS ─────────────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ─── GET /api/state?key=<chave> ────────────────────────────────────────
  if (req.method === 'GET') {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'Parâmetro "key" é obrigatório.' });

    try {
      const value = await redis.get(key);
      if (value === null || value === undefined) {
        return res.json({ exists: false, value: null });
      }
      // Upstash pode devolver objeto já parseado — re-stringify se necessário
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      return res.json({ exists: true, value: strValue });
    } catch (err) {
      console.error('[GET /api/state]', err.message);
      return res.status(500).json({ error: 'Erro ao ler estado.' });
    }
  }

  // ─── POST /api/state ───────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Campos "key" e "value" são obrigatórios.' });
    }
    try {
      await redis.set(key, value);
      return res.json({ success: true });
    } catch (err) {
      console.error('[POST /api/state]', err.message);
      return res.status(500).json({ error: 'Erro ao salvar estado.' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
