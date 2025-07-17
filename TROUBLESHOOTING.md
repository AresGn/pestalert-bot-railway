# Guide de Dépannage - PestAlert Bot

## Problèmes de Connexion WhatsApp

### 🚫 Problème : QR Code avec "undefined"

**Symptômes :**
- Le lien QR code contient "undefined" dans l'URL
- Impossible de scanner le QR code

**Solution :**
1. Arrêtez le bot (Ctrl+C)
2. Nettoyez les sessions : `npm run cleanup`
3. Redémarrez : `npm run restart`

### 🔒 Problème : Erreur EBUSY (fichiers verrouillés)

**Symptômes :**
```
Error: EBUSY: resource busy or locked, unlink 'sessions/session/Default/Cookies-journal'
```

**Solutions :**

#### Solution 1 - Nettoyage DOUX (RECOMMANDÉ)
```bash
# Préserve votre authentification (pas de nouveau QR code)
npm run cleanup:soft
npm run restart
```

#### Solution 2 - Nettoyage COMPLET (si problème persistant)
```bash
# ⚠️ Supprime l'authentification (nouveau QR code requis)
npm run cleanup:hard
npm run restart:fresh
```

#### Solution 3 - Nettoyage manuel
```bash
# Arrêter le bot
Ctrl+C

# Supprimer manuellement le dossier sessions
rm -rf sessions/
# ou sur Windows
rmdir /s sessions

# Redémarrer
npm run start:prod
```

#### Solution 3 - Redémarrage système
Si les solutions précédentes ne fonctionnent pas :
1. Fermez tous les processus Chrome/Chromium
2. Redémarrez votre ordinateur
3. Relancez le bot

### 📱 Problème : Bot ne répond pas aux messages

**Vérifications :**
1. Le bot est-il connecté ? Vérifiez les logs
2. Envoyez-vous des messages APRÈS le démarrage du bot ?
3. Utilisez-vous un chat privé (pas un groupe) ?

**Test de connexion :**
```
Hi PestAlerte 👋
```

### 🔄 Problème : Déconnexions fréquentes

**Solutions :**
1. Utilisez le démarrage sécurisé : `npm run start:safe`
2. Vérifiez votre connexion internet
3. Assurez-vous qu'aucune autre instance WhatsApp Web n'est ouverte

## Commandes Utiles

### Démarrage
```bash
# Démarrage normal
npm run start:prod

# Démarrage avec nettoyage automatique
npm run start:safe

# Démarrage avec redémarrage automatique
npm run restart
```

### Maintenance
```bash
# Nettoyage doux (préserve l'authentification) - RECOMMANDÉ
npm run cleanup:soft

# Nettoyage complet (supprime tout, nouveau QR code requis)
npm run cleanup:hard

# Nettoyage par défaut (= doux)
npm run cleanup

# Vérifier le statut (dans WhatsApp)
!status

# Aide (dans WhatsApp)
!help
```

### Développement
```bash
# Mode développement
npm run dev

# Tests
npm run test:services
```

## Logs Importants

### ✅ Connexion réussie
```
✅ Bot WhatsApp PestAlert connecté!
📱 Numéro du bot: +33XXXXXXXXX
👤 Nom du bot: PestAlert
🔗 État de connexion: READY
```

### ❌ Problèmes de connexion
```
❌ Échec de l'authentification
📵 Client déconnecté: LOGOUT
❌ Unhandled Rejection: EBUSY
```

## Support

Si les problèmes persistent :
1. Vérifiez les logs complets
2. Assurez-vous que votre version de Node.js est compatible (>= 16)
3. Vérifiez que tous les packages sont installés : `npm install`

## Variables d'Environnement

Créez un fichier `.env` avec :
```env
# Chemin des sessions (optionnel)
WHATSAPP_SESSION_PATH=./sessions

# Port du serveur (optionnel)
PORT=3000

# Chemin Puppeteer (pour Railway)
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```
