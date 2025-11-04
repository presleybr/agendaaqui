require('dotenv').config();

// Detecta se está usando PostgreSQL (produção) ou SQLite (desenvolvimento)
const usePostgres = !!process.env.DATABASE_URL;

let db;

if (usePostgres) {
  // PostgreSQL (Produção - Render.com)
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  db = {
    pool,
    // Wrapper para manter compatibilidade com código SQLite
    query: (sql, params) => {
      return pool.query(sql, params);
    },
    get: async (sql, params) => {
      const result = await pool.query(sql, params);
      return result.rows[0];
    },
    all: async (sql, params) => {
      const result = await pool.query(sql, params);
      return result.rows;
    },
    run: async (sql, params) => {
      const result = await pool.query(sql, params);
      return result;
    }
  };
} else {
  // SQLite (Desenvolvimento Local)
  const Database = require('better-sqlite3');
  const path = require('path');

  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database/agendamentos.db');

  // Create database connection
  const sqlite = new Database(dbPath, {
    verbose: console.log
  });

  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  // Enable WAL mode for better concurrent access
  sqlite.pragma('journal_mode = WAL');

  db = sqlite;
}

module.exports = db;
