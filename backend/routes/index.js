// routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');      // /login
const userRoutes = require('./userRoutes');      // /users/register, /users/login, et les routes protégées
const botRoutes = require('./botRoutes');        // /start
const miscRoutes = require('./miscRoutes');      // /logs, /qr
const dbTest = require("./dbTest");              // /db-test
const contactsRoutes = require('./contactsRoutes');  // CRUD contacts
const trackingRoutes = require('./trackingRoutes');  // CRUD tracking

// Routes publiques
router.use('/', authRoutes);
router.use('/', userRoutes);

// Appliquer le middleware d'authentification pour les autres routes
const { authenticateToken } = require('../lib/auth');
router.use(authenticateToken);

router.use('/', dbTest);
router.use('/', botRoutes);
router.use('/', miscRoutes);
router.use('/', contactsRoutes);
router.use('/', trackingRoutes);

module.exports = router;
