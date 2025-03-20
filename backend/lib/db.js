// lib/db.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'whatsappdb',
  user: process.env.DB_USER || 'whatsapp',
  password: process.env.DB_PASSWORD || 'secret'
});

module.exports = pool;
