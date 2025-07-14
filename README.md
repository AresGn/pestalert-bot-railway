# PestAlert WhatsApp Bot

Bot WhatsApp pour l'analyse de santé des cultures et la détection de ravageurs.

## 🚀 Déploiement sur Railway

Ce repository est optimisé pour le déploiement sur Railway.

### Déploiement rapide

1. Forkez ce repository
2. Connectez-vous à [Railway](https://railway.app)
3. Créez un nouveau projet depuis GitHub
4. Ajoutez les variables d'environnement (voir RAILWAY_DEPLOYMENT.md)
5. Déployez !

### Variables d'environnement requises

```env
OPENEPI_BASE_URL=https://api.openepi.io
OPENEPI_AUTH_URL=https://auth.openepi.io/realms/openepi/protocol/openid-connect/token
OPENEPI_CLIENT_ID=your_client_id_here
OPENEPI_CLIENT_SECRET=your_client_secret_here
WHATSAPP_SESSION_PATH=/app/sessions
NODE_ENV=production
```

⚠️ **Important** : Remplacez `your_client_id_here` et `your_client_secret_here` par vos vraies clés OpenEPI.

## 📱 Première connexion

Après le déploiement, consultez les logs Railway pour voir le QR code WhatsApp à scanner.

## 🔍 Health Check

```
GET https://votre-app.railway.app/health
```

## 📚 Documentation complète

Voir `RAILWAY_DEPLOYMENT.md` pour les instructions détaillées.
