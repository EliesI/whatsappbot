// lib/initDb.js
const pool = require('./db');

async function initDb() {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  try {
    await pool.query(query);
    console.log("Table 'users' créée ou déjà existante.");
  } catch (err) {
    console.error("Erreur lors de la création de la table 'users' :", err);
  } finally {
    pool.end();
  }
}

initDb();
