# Utiliser Node.js 18 LTS
FROM node:18-slim

# Installer les dépendances système pour Puppeteer
RUN apt-get update \
    && apt-get install -y wget gnupg ca-certificates \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
      fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
      libxss1 libgconf-2-4 libxrandr2 libasound2 libpangocairo-1.0-0 libatk1.0-0 \
      libcairo-gobject2 libgtk-3-0 libgdk-pixbuf2.0-0 libxcomposite1 libxcursor1 \
      libxdamage1 libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig.json ./

# Installer TOUTES les dépendances (dev incluses pour le build)
RUN npm ci

# Copier le code source
COPY src/ ./src/
COPY audio/ ./audio/

# Construire l'application
RUN npm run build

# Nettoyer les dépendances de développement après le build
RUN npm prune --production

# Créer le répertoire pour les sessions
RUN mkdir -p ./sessions

# Exposer le port (optionnel, Railway détecte automatiquement)
EXPOSE 3000

# Variables d'environnement pour Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV DISPLAY=:99
ENV CHROME_BIN=/usr/bin/google-chrome-stable

# Créer un utilisateur non-root pour la sécurité
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Changer vers l'utilisateur non-root
USER pptruser

# Démarrer l'application
CMD ["npm", "start"]
