# 🚀 Déploiement du Bot WhatsApp sur Railway

## 📋 Prérequis

1. **Compte Railway** : Créez un compte sur [railway.app](https://railway.app)
2. **Repository GitHub** : Votre code doit être sur GitHub
3. **Variables d'environnement** : Préparez vos variables d'environnement

## 🔧 Étapes de déploiement

### 1. Installation de Railway CLI (optionnel)

```bash
npm install -g @railway/cli
railway login
```

### 2. Déploiement via l'interface web

1. **Connectez-vous à Railway** : [railway.app](https://railway.app)
2. **Nouveau projet** : Cliquez sur "New Project"
3. **Deploy from GitHub repo** : Sélectionnez votre repository
4. **Sélectionnez le dossier** : `packages/bot`

### 3. Configuration des variables d'environnement

Dans l'interface Railway, ajoutez ces variables :

```env
# OpenEPI Configuration
OPENEPI_BASE_URL=https://api.openepi.io
OPENEPI_AUTH_URL=https://auth.openepi.io/realms/openepi/protocol/openid-connect/token
OPENEPI_CLIENT_ID=aresgn-testpestsAPI
OPENEPI_CLIENT_SECRET=gHrAAcKkMkvEDfDijdqqBXULbqjGzlyK
OPENEPI_TIMEOUT=30000

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=/app/sessions
WHATSAPP_SESSION_SECRET=your_secret_key_here

# Application Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Puppeteer Configuration (automatique avec Docker)
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

### 4. Configuration du build

Railway détectera automatiquement le `Dockerfile` et l'utilisera pour le build.

**Build Command** : `docker build -t bot .`
**Start Command** : `npm start`

### 5. Volumes persistants (pour les sessions WhatsApp)

1. Dans Railway, allez dans l'onglet **"Settings"**
2. Ajoutez un **Volume** :
   - **Mount Path** : `/app/sessions`
   - **Size** : 1GB (suffisant pour les sessions)

## 📱 Première connexion WhatsApp

### Méthode 1 : Via les logs Railway

1. **Ouvrez les logs** dans Railway
2. **Cherchez le QR code** dans les logs de démarrage
3. **Scannez avec WhatsApp** sur votre téléphone

### Méthode 2 : Via l'URL du QR code

Les logs afficheront aussi une URL comme :
```
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=...
```

Ouvrez cette URL dans votre navigateur et scannez le QR code.

## 🔍 Vérification du déploiement

### Health Check

Votre bot expose un endpoint de santé :
```
https://votre-app.railway.app/health
```

Réponse attendue :
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

### Logs de fonctionnement

Surveillez les logs pour voir :
```
🚀 Bot démarré à: 15/01/2024 10:30:00
🌐 Health check server running on port 3000
✅ Bot WhatsApp PestAlert connecté!
```

## 🛠️ Dépannage

### Problème : Bot ne se connecte pas

1. **Vérifiez les logs** pour les erreurs Puppeteer
2. **Redémarrez le service** dans Railway
3. **Vérifiez les variables d'environnement**

### Problème : Sessions perdues

1. **Vérifiez le volume persistant** `/app/sessions`
2. **Assurez-vous que le volume est monté** correctement

### Problème : Timeout de build

1. **Augmentez le timeout** dans `railway.json`
2. **Optimisez le Dockerfile** si nécessaire

## 💰 Coûts estimés

- **Plan Hobby** : $5/mois
- **Ressources** : 512MB RAM, 1GB stockage
- **Trafic** : Illimité

## 🔄 Mises à jour automatiques

Railway redéploiera automatiquement à chaque push sur votre branche principale.

## 📞 Support

- **Railway Docs** : [docs.railway.app](https://docs.railway.app)
- **Discord Railway** : [discord.gg/railway](https://discord.gg/railway)
- **GitHub Issues** : Pour les problèmes spécifiques au bot

## ⚠️ Notes importantes

1. **Première connexion** : Vous devrez scanner le QR code une seule fois
2. **Sessions persistantes** : Les sessions WhatsApp sont sauvegardées
3. **Redémarrages** : Le bot se reconnecte automatiquement
4. **Monitoring** : Surveillez les logs pour les erreurs
