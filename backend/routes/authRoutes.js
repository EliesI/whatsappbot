// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'secret';
const validUsername = process.env.USERNAME || 'admin';
const validPassword = process.env.PASSWORD || 'password';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== validUsername || password !== validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ username }, secret, { expiresIn: '1h' });
  res.json({ token });
});

module.exports = router;
