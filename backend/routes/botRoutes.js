// routes/botRoutes.js
const express = require('express');
const router = express.Router();
const { startBot } = require('../lib/bot');
const logger = require('../lib/logger');

router.post('/start', async (req, res) => {
  const { chosenType } = req.body;
  if (!chosenType) {
    return res.status(400).json({ error: "Le type de message est requis." });
  }
  try {
    await startBot(chosenType);
    res.json({ message: "Processus terminé." });
  } catch (err) {
    logger.log("Erreur dans le processus : " + err.message);
    res.status(500).json({ error: "Erreur lors du processus." });
  }
});

module.exports = router;
