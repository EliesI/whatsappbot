// routes/trackingRoutes.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const router = express.Router();

// Le dossier de tracking est défini par la variable d'environnement ou par défaut "tracking"
const trackingDir = process.env.TRACKING_DIR || 'tracking';

// Fonction d'aide pour lire un fichier CSV et renvoyer un tableau d'objets
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// GET /tracking : Liste tous les fichiers CSV de tracking
router.get('/tracking', (req, res) => {
  fs.readdir(trackingDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Erreur lors de la lecture du dossier de tracking." });
    }
    // Filtrer les fichiers CSV uniquement
    const csvFiles = files.filter(file => file.endsWith('.csv'));
    res.json({ files: csvFiles });
  });
});

// GET /tracking/:filename : Récupère le contenu d'un fichier de tracking et le retourne en JSON
router.get('/tracking/:filename', async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(trackingDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fichier de tracking non trouvé." });
  }
  try {
    const contacts = await readCSV(filePath);
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la lecture du fichier CSV." });
  }
});

// POST /tracking : Crée un nouveau fichier de tracking à partir d'un JSON de contacts
router.post('/tracking', (req, res) => {
  const { filename, contacts } = req.body;
  if (!filename || !contacts || !Array.isArray(contacts)) {
    return res.status(400).json({ error: "Les champs 'filename' et 'contacts' (tableau) sont requis." });
  }
  // Vérification de chaque contact
  for (const contact of contacts) {
    if (!contact.name || !contact.number) {
      return res.status(400).json({ error: "Chaque contact doit avoir les propriétés 'name' et 'number'." });
    }
  }
  let csvContent = "name,number\n";
  contacts.forEach(contact => {
    csvContent += `${contact.name},${contact.number}\n`;
  });
  const filePath = path.join(trackingDir, filename);
  fs.writeFile(filePath, csvContent, (err) => {
    if (err) {
      console.error("Erreur lors de l'écriture du fichier CSV :", err);
      return res.status(500).json({ error: "Échec de la création du fichier de tracking." });
    }
    res.json({ message: "Fichier de tracking créé avec succès." });
  });
});

// PUT /tracking/:filename : Met à jour (remplace) un fichier de tracking existant avec un nouveau JSON de contacts
router.put('/tracking/:filename', (req, res) => {
  const filename = req.params.filename;
  const { contacts } = req.body;
  if (!contacts || !Array.isArray(contacts)) {
    return res.status(400).json({ error: "Le champ 'contacts' doit être un tableau." });
  }
  // Vérification de chaque contact
  for (const contact of contacts) {
    if (!contact.name || !contact.number) {
      return res.status(400).json({ error: "Chaque contact doit avoir les propriétés 'name' et 'number'." });
    }
  }
  let csvContent = "name,number\n";
  contacts.forEach(contact => {
    csvContent += `${contact.name},${contact.number}\n`;
  });
  const filePath = path.join(trackingDir, filename);
  fs.writeFile(filePath, csvContent, (err) => {
    if (err) {
      console.error("Erreur lors de la mise à jour du fichier CSV :", err);
      return res.status(500).json({ error: "Échec de la mise à jour du fichier de tracking." });
    }
    res.json({ message: "Fichier de tracking mis à jour avec succès." });
  });
});

// DELETE /tracking/:filename : Supprime un fichier de tracking
router.delete('/tracking/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(trackingDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fichier de tracking non trouvé." });
  }
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Erreur lors de la suppression du fichier de tracking :", err);
      return res.status(500).json({ error: "Erreur lors de la suppression du fichier de tracking." });
    }
    res.json({ message: "Fichier de tracking supprimé avec succès." });
  });
});

module.exports = router;