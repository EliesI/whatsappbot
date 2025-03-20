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

# Exposer uniquement le port de votre serveur web (3000)
EXPOSE 3000

# Lancer votre application via le script start.sh (si vous en avez un) ou directement via server.js
CMD ["node", "server.js"]
