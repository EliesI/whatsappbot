// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../lib/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { authenticateToken } = require('../lib/auth');

const jwtSecret = process.env.JWT_SECRET || 'secret';

// Public: Inscription
router.post('/users/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });
  try {
    const userCheck = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (userCheck.rows.length > 0)
      return res.status(400).json({ error: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at",
      [username, hashedPassword]
    );
    res.status(201).json({ message: "User registered", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Public: Login
router.post('/users/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, username: user.username }, jwtSecret, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: Get all users
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username, created_at FROM users");
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: Get user by id
router.get('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT id, username, created_at FROM users WHERE id = $1", [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: Update user
router.put('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;
  if (!username && !password)
    return res.status(400).json({ error: "At least one field (username or password) is required" });
  try {
    let updateQuery = "UPDATE users SET ";
    const updateValues = [];
    let idx = 1;
    if (username) {
      updateQuery += `username = $${idx}`;
      updateValues.push(username);
      idx++;
    }
    if (password) {
      if (updateValues.length > 0) updateQuery += ", ";
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += `password = $${idx}`;
      updateValues.push(hashedPassword);
      idx++;
    }
    updateQuery += ` WHERE id = $${idx} RETURNING id, username, created_at`;
    updateValues.push(id);
    const result = await pool.query(updateQuery, updateValues);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    res.json({ message: "User updated", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected: Delete user
router.delete('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id, username", [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
