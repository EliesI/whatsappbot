// routes/contactsRoutes.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const router = express.Router();
const contactsFile = path.join(process.cwd(), 'contacts.csv');

// Fonction d'aide pour lire les contacts depuis le CSV
function readContacts() {
  return new Promise((resolve, reject) => {
    let contacts = [];
    if (!fs.existsSync(contactsFile)) {
      return resolve(contacts);
    }
    fs.createReadStream(contactsFile)
      .pipe(csv())
      .on('data', (row) => contacts.push(row))
      .on('end', () => resolve(contacts))
      .on('error', (err) => reject(err));
  });
}

// Fonction d'aide pour écrire le tableau de contacts dans le CSV
function writeContacts(contacts) {
  return new Promise((resolve, reject) => {
    let csvContent = "name,number\n";
    contacts.forEach(contact => {
      csvContent += `${contact.name},${contact.number}\n`;
    });
    fs.writeFile(contactsFile, csvContent, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// GET /contacts : Récupère la liste des contacts au format JSON
router.get('/contacts', async (req, res) => {
  try {
    const contacts = await readContacts();
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la lecture des contacts." });
  }
});

// POST /contacts : Crée un nouveau contact et l'ajoute au CSV
router.post('/contacts', async (req, res) => {
  const { name, number } = req.body;
  if (!name || !number) {
    return res.status(400).json({ error: "Les champs 'name' et 'number' sont requis." });
  }
  try {
    let contacts = await readContacts();
    // Vérifier si un contact avec ce numéro existe déjà
    if (contacts.some(contact => contact.number === number)) {
      return res.status(400).json({ error: "Un contact avec ce numéro existe déjà." });
    }
    contacts.push({ name, number });
    await writeContacts(contacts);
    res.json({ message: "Contact ajouté avec succès.", contacts });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'ajout du contact." });
  }
});

// PUT /contacts/:number : Met à jour le contact identifié par le numéro
router.put('/contacts/:number', async (req, res) => {
  const contactNumber = req.params.number;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Le champ 'name' est requis pour la mise à jour." });
  }
  try {
    let contacts = await readContacts();
    let updated = false;
    contacts = contacts.map(contact => {
      if (contact.number === contactNumber) {
        updated = true;
        return { ...contact, name };
      }
      return contact;
    });
    if (!updated) {
      return res.status(404).json({ error: "Contact non trouvé." });
    }
    await writeContacts(contacts);
    res.json({ message: "Contact mis à jour avec succès.", contacts });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la mise à jour du contact." });
  }
});

// DELETE /contacts/:number : Supprime le contact identifié par le numéro
router.delete('/contacts/:number', async (req, res) => {
  const contactNumber = req.params.number;
  try {
    let contacts = await readContacts();
    const initialLength = contacts.length;
    contacts = contacts.filter(contact => contact.number !== contactNumber);
    if (contacts.length === initialLength) {
      return res.status(404).json({ error: "Contact non trouvé." });
    }
    await writeContacts(contacts);
    res.json({ message: "Contact supprimé avec succès.", contacts });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression du contact." });
  }
});

module.exports = router;
