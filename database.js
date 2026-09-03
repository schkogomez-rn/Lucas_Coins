/**
 * database.js — Módulo SQLite para Lucas Coins Adventure
 * Usa better-sqlite3 (síncrono, zero configuração)
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'lucas_coins.db');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    // WAL mode: melhor performance e menos bloqueios
    db.pragma('journal_mode = WAL');
    // Inicializa a tabela de estados se não existir
    db.exec(`
      CREATE TABLE IF NOT EXISTS app_state (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  return db;
}

/**
 * Retorna o estado salvo para uma chave específica.
 * @param {string} key - chave de identificação (ex: 'lucas-coins-state-v3')
 * @returns {string|null} - JSON string ou null se não existir
 */
function getState(key) {
  const row = getDB().prepare('SELECT value FROM app_state WHERE key = ?').get(key);
  return row ? row.value : null;
}

/**
 * Salva o estado para uma chave específica.
 * @param {string} key - chave de identificação
 * @param {string} value - JSON string com o estado
 */
function setState(key, value) {
  getDB().prepare(`
    INSERT INTO app_state (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(key, value);
}

module.exports = { getState, setState };
