// routes/dbTest.js
const express = require('express');
const router = express.Router();
const pool = require('../lib/db');

router.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ now: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Erreur de connexion à la DB" });
  }
});

module.exports = router;
