# WhatsApp Bot

Ce projet est un bot automatisé qui permet d'envoyer des messages via WhatsApp Web. Il utilise [Playwright](https://playwright.dev/) pour automatiser le navigateur et [Express](https://expressjs.com/) pour fournir une interface web afin de lancer le processus et consulter les logs. Le bot lit une liste de contacts à partir d'un fichier CSV, capture le QR code de connexion de WhatsApp et envoie des messages personnalisés selon le type choisi.

## Fonctionnalités

- **Automatisation WhatsApp Web** : Le bot ouvre WhatsApp Web dans un navigateur (en mode headless ou non-headless selon la configuration) et attend que l'utilisateur scanne le QR code pour se connecter.
- **Capture du QR Code** : Une fois la page chargée, le bot capture l'image du QR code (depuis un `<canvas>` identifié par l'attribut `aria-label="Scan this QR code to link a device!"`) et la rend accessible via l'endpoint `/qr` pour être affichée dans l'interface web.
- **Envoi de messages personnalisés** : En fonction du type de message sélectionné (par exemple "Prosp", "Follow up 1", etc.), le bot lit le ou les templates de message depuis les variables d'environnement, remplace le placeholder `{name}` par le nom du contact et envoie le message à chaque contact du fichier CSV.
- **Interface Web** : Une page web accessible sur [http://localhost:3000](http://localhost:3000) permet de choisir le type de message, de lancer le bot et de suivre en temps réel l'exécution grâce à une diffusion des logs (via Server-Sent Events).
- **Configuration par variables d'environnement** : Toutes les options importantes (templates de messages, mode headless, délais, etc.) sont configurables via un fichier `.env`.

## Prérequis

- **Node.js** (version 14 ou ultérieure recommandée)
- **npm** (inclus avec Node.js)
- **Docker** (optionnel, pour une exécution containerisée)
- Un fichier CSV nommé `contacts.csv` dans le répertoire racine (contenant les colonnes `name` et `number`)

## Installation

1. **Cloner le dépôt :**

   ```bash
   git clone <URL_du_dépôt>
   cd whatsapp-bot
   ```

2. **Installer les dépendances :**

   ```bash
   npm install
   ```

3. **Configurer le fichier `.env` :**

   Créez un fichier `.env` à la racine du projet et ajoutez-y vos variables de configuration. Par exemple :

   ```env
   # Templates pour "Prosp"
   MESSAGES_PROSP_1="Bonjour {name},\n\nMessage pour Prosp n°1..."
   MESSAGES_PROSP_2="Bonjour {name},\n\nMessage pour Prosp n°2..."

   # Templates pour Follow up
   MESSAGES_FOLLOWUP_1="Bonjour {name}, message follow up 1..."
   MESSAGES_FOLLOWUP_2="Bonjour {name}, message follow up 2..."
   MESSAGES_FOLLOWUP_3="Bonjour {name}, message follow up 3..."
   MESSAGES_FOLLOWUP_4="Bonjour {name}, message follow up 4..."

   # Paramètres Playwright
   HEADLESS="true"  # ou "false" si vous souhaitez voir l'interface graphique

   USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."

   # Chemin vers le fichier CSV
   CSV_FILE="contacts.csv"

   # Dossier pour sauvegarder les CSV de suivi
   TRACKING_DIR="tracking"

   # Délai pour l'attente du sélecteur (en millisecondes)
   WAIT_FOR_SELECTOR_TIMEOUT="60000"

   # Délai entre chaque envoi de message (en millisecondes)
   DELAY_BETWEEN_MESSAGES="60000"

   # Port du serveur web
   PORT="3000"
   ```

## Utilisation

### Exécution locale

1. **Lancer le serveur :**

   ```bash
   node server.js
   ```

2. **Accéder à l'interface web :**

   Ouvrez votre navigateur et rendez-vous sur [http://localhost:3000](http://localhost:3000).  
   Vous y trouverez un formulaire pour choisir le type de message, un espace pour visualiser le QR code (via l'endpoint `/qr`), ainsi qu'une zone de logs affichant l'exécution du bot en temps réel.

### Utilisation avec Docker

Le projet est également containerisé pour une utilisation simplifiée et une distribution aisée.

1. **Dockerfile**

   Le Dockerfile est configuré pour copier le fichier `.env`, installer les dépendances et lancer le serveur :

   ```dockerfile
   FROM mcr.microsoft.com/playwright:focal

   WORKDIR /app

   # Copier le fichier .env pour les variables d'environnement
   COPY .env .

   # Copier les fichiers de configuration et installer les dépendances Node
   COPY package*.json ./
   RUN npm install
   RUN npx playwright install

   # Copier le reste du code de l'application
   COPY . .

   # Exposer le port de votre serveur web (3000)
   EXPOSE 3000

   CMD ["node", "server.js"]
   ```

2. **docker-compose.yml**

   Vous pouvez utiliser Docker Compose pour lancer le container :

   ```yaml
   version: "3.9"

   services:
     whatsapp-bot:
       build: .
       ports:
         - "3000:3000"   # Pour l'interface web
       env_file:
         - .env         # Charge les variables d'environnement depuis votre fichier .env
       volumes:
         - .:/app       # Monte le répertoire courant dans le container (optionnel, utile pour le développement)
   ```

3. **Lancer avec Docker Compose**

   ```bash
   docker-compose up --build
   ```

   Ensuite, accédez à [http://localhost:3000](http://localhost:3000).

## Fonctionnement du Bot

1. **Connexion à WhatsApp Web**  
   Le bot lance Playwright pour ouvrir WhatsApp Web.  
   - Si `HEADLESS` est réglé sur `false`, le navigateur s'ouvrira en mode non-headless (ce qui peut être utile pour déboguer).  
   - Le bot attend que l'utilisateur scanne le QR code.

2. **Capture du QR Code**  
   Dès que le canvas du QR code (avec l'attribut `aria-label="Scan this QR code to link a device!"`) est disponible, le bot le capture et le stocke dans `global.qrImage`.  
   L'image est ensuite accessible via l'endpoint `/qr`, ce qui permet de l'afficher dans l'interface web.

3. **Envoi de messages**  
   Une fois connecté, le bot lit le fichier CSV pour récupérer les contacts.  
   Pour chaque contact, il remplace le placeholder `{name}` dans le template de message par le nom du contact, puis envoie le message via WhatsApp Web.  
   Après chaque envoi, il effectue une pause définie par `DELAY_BETWEEN_MESSAGES`.

4. **Logs et suivi**  
   Toutes les étapes et événements importants sont logués et diffusés via un endpoint SSE (`/logs`).  
   Ces logs sont affichés en temps réel dans l'interface web.

## Personnalisation

- **Templates de Messages** :  
  Vous pouvez modifier les templates dans le fichier `.env` pour adapter les messages envoyés aux différents types de campagnes (Prosp, Follow up, etc.).

- **Paramètres Playwright** :  
  Configurez le mode headless, le User-Agent, et les délais via le fichier `.env`.

- **Fichier CSV** :  
  Assurez-vous que le fichier `contacts.csv` est correctement formaté avec des colonnes `name` et `number`.

## Remarques

- **Sélecteur du QR Code** :  
  Le sélecteur utilisé pour capturer le QR code (`canvas[aria-label="Scan this QR code to link a device!"]`) doit être adapté selon la version de WhatsApp Web.  
  Vous pouvez l'ajuster si nécessaire.

- **Logs en temps réel** :  
  Le système SSE permet de suivre l'exécution du bot en temps réel via la zone de logs de l'interface web.

## License

Ce projet est sous licence MIT. (Adaptez cette section selon votre licence)