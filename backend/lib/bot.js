// lib/bot.js
const { chromium } = require('playwright');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const logger = require('./logger');

async function startBot(chosenType) {
  logger.log(`Type de message sélectionné : ${chosenType}`);
  let messages;
  if (chosenType === "Prosp") {
    messages = [
      process.env.MESSAGES_PROSP_1,
      process.env.MESSAGES_PROSP_2
    ];
  } else if (chosenType === "Follow up 1") {
    messages = [ process.env.MESSAGES_FOLLOWUP_1 ];
  } else if (chosenType === "Follow up 2") {
    messages = [ process.env.MESSAGES_FOLLOWUP_2 ];
  } else if (chosenType === "Follow up 3") {
    messages = [ process.env.MESSAGES_FOLLOWUP_3 ];
  } else if (chosenType === "Follow up 4") {
    messages = [ process.env.MESSAGES_FOLLOWUP_4 ];
  } else {
    logger.log("Type non reconnu. Fin du processus.");
    return;
  }

  let filePrefixNumber;
  if (chosenType === "Prosp") filePrefixNumber = 1;
  else if (chosenType === "Follow up 1") filePrefixNumber = 2;
  else if (chosenType === "Follow up 2") filePrefixNumber = 3;
  else if (chosenType === "Follow up 3") filePrefixNumber = 4;
  else if (chosenType === "Follow up 4") filePrefixNumber = 5;

  const currentDate = new Date().toISOString().split('T')[0];
  const trackingDir = process.env.TRACKING_DIR || 'tracking';
  const outputFilename = path.join(
    trackingDir,
    `follow-up-${filePrefixNumber}-${currentDate}+2.csv`
  );

  const isHeadless = process.env.HEADLESS === 'true';
  logger.log(`Lancement du navigateur, headless: ${isHeadless}`);
  const browser = await chromium.launch({ headless: isHeadless });
  const userAgent = process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; ...)';
  const context = await browser.newContext({ userAgent });
  const page = await context.newPage();

  await page.goto('https://web.whatsapp.com/');
  logger.log("🔄 Veuillez scanner le QR Code dans la fenêtre qui s'ouvre.");

  // Capture du QR code
  try {
    const qrElement = await page.waitForSelector('canvas[aria-label="Scan this QR code to link a device!"]', { timeout: 30000 });
    const qrBuffer = await qrElement.screenshot();
    global.qrImage = qrBuffer.toString('base64');
    logger.log("✅ QR code capturé et accessible via l'endpoint /qr.");
  } catch (err) {
    logger.log("Aucun QR code trouvé, peut-être déjà scanné ou modifié ? " + err.message);
  }

  const waitSelectorTimeout = parseInt(process.env.WAIT_FOR_SELECTOR_TIMEOUT, 10) || 60000;
  try {
    await page.waitForSelector('.x1qlqyl8.x1pd3egz.xcgk4ki', { timeout: waitSelectorTimeout });
    logger.log("✅ Connexion réussie à WhatsApp !");
  } catch (error) {
    logger.log("❌ Échec de la connexion. Vérifiez le scan du QR Code.");
    await browser.close();
    return;
  }

  const contactsFile = process.env.CSV_FILE || 'contacts.csv';
  const contacts = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(path.join(process.cwd(), contactsFile))
      .pipe(csv())
      .on('data', (row) => contacts.push(row))
      .on('end', resolve)
      .on('error', reject);
  });
  logger.log(`${contacts.length} contacts chargés depuis le CSV.`);

  let messageIndex = 0;
  const failedContacts = [];
  const delayBetweenMessages = parseInt(process.env.DELAY_BETWEEN_MESSAGES, 10) || 60000;

  for (const contact of contacts) {
    const { name, number } = contact;
    const messageTemplate = messages[messageIndex % messages.length];
    if (!messageTemplate) {
      logger.log(`❌ Aucun template de message défini pour l'index ${messageIndex}.`);
      continue;
    }
    const message = messageTemplate.replace("{name}", name);
    logger.log(`📩 Envoi du message à ${name} (${number})`);

    await page.goto(`https://web.whatsapp.com/send?phone=${number}`);
    try {
      await page.waitForSelector('[aria-label="Entrez un message"]', { timeout: 20000 });
    } catch (error) {
      logger.log(`❌ Impossible d'ouvrir la conversation avec ${name} (${number}). Contact ignoré.`);
      failedContacts.push(contact);
      continue;
    }
    for (const line of message.split("\n")) {
      await page.type('[aria-label="Entrez un message"]', line);
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
    }
    await page.keyboard.press('Enter');
    logger.log(`✅ Message envoyé à ${name} (${number})`);
    logger.log(`⏳ Pause de ${delayBetweenMessages / 1000} secondes avant le prochain message...`);
    await page.waitForTimeout(delayBetweenMessages);
    messageIndex++;
  }

  logger.log("🎉 Tous les messages ont été envoyés !");

  const failedNumbers = new Set(failedContacts.map(c => c.number));
  const remainingContacts = contacts.filter(c => !failedNumbers.has(c.number));
  let csvContent = "name,number\n";
  remainingContacts.forEach(c => {
    csvContent += `${c.name},${c.number}\n`;
  });

  if (!fs.existsSync(trackingDir)) {
    fs.mkdirSync(trackingDir);
  }
  fs.writeFileSync(outputFilename, csvContent);
  logger.log(`📋 Le CSV mis à jour a été sauvegardé sous : ${outputFilename}`);
  await browser.close();
}

module.exports = { startBot };
