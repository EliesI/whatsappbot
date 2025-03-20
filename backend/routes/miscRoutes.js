// routes/miscRoutes.js
const express = require('express');
const router = express.Router();
const logger = require('../lib/logger');

router.get('/logs', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  const onLog = (msg) => {
    res.write(`data: ${msg}\n\n`);
  };
  logger.on('log', onLog);
  req.on('close', () => {
    logger.removeListener('log', onLog);
  });
});

router.get('/qr', (req, res) => {
  if (global.qrImage) {
    res.set('Content-Type', 'image/png');
    res.send(Buffer.from(global.qrImage, 'base64'));
  } else {
    res.status(404).json({ error: "QR code non disponible." });
  }
});

module.exports = router;
