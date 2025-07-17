# 📱 Guide de Connexion WhatsApp - PestAlert Bot

## 🎯 Processus Normal de Connexion

### 1️⃣ **Première Connexion** (Nouveau QR Code Requis)
```bash
# Démarrer le bot
npm run start

# OU avec le moniteur (redémarrage automatique)
npm run start:monitor
```

1. 📱 **Scannez le QR code** affiché dans le terminal avec WhatsApp
2. ✅ **Connexion établie** - Le bot affiche "Bot WhatsApp PestAlert connecté!"
3. 🔐 **Session sauvegardée** - Votre authentification est maintenant stockée

### 2️⃣ **Connexions Suivantes** (Pas de QR Code)
```bash
# Redémarrage normal - AUCUN QR code requis
npm run start
```

✅ Le bot se connecte automatiquement sans QR code !

---

## 🛠️ Résolution des Problèmes

### ❌ **Problème : Erreurs EBUSY / Session fermée**

**Symptômes :**
- `Error: EBUSY: resource busy or locked`
- `Session closed. Most likely the page has been closed`
- Le bot ne répond plus aux messages

**Solution RECOMMANDÉE :**
```bash
# 1. Arrêter le bot (Ctrl+C)
# 2. Nettoyage DOUX (préserve l'authentification)
npm run cleanup:soft

# 3. Redémarrer
npm run start
```

✅ **Résultat :** Bot redémarre SANS nouveau QR code !

### 🚨 **Si le problème persiste :**
```bash
# Nettoyage COMPLET (supprime l'authentification)
npm run cleanup:hard

# Redémarrer
npm run start
```

⚠️ **Attention :** Vous devrez rescanner le QR code

---

## 📋 **Commandes Disponibles**

### Démarrage
```bash
npm run start              # Démarrage normal
npm run start:monitor      # Avec surveillance et redémarrage auto
```

### Nettoyage
```bash
npm run cleanup:soft       # Préserve l'authentification (RECOMMANDÉ)
npm run cleanup:hard       # Supprime tout (nouveau QR code requis)
npm run cleanup            # = cleanup:soft par défaut
```

### Redémarrage Complet
```bash
npm run restart            # Nettoyage doux + redémarrage
npm run restart:fresh      # Nettoyage complet + redémarrage
```

---

## 💡 **Conseils d'Utilisation**

### ✅ **À FAIRE :**
- Utilisez `npm run cleanup:soft` pour résoudre les erreurs
- Utilisez `npm run start:monitor` pour un fonctionnement stable
- Testez la connexion avec : `Hi PestAlerte 👋`

### ❌ **À ÉVITER :**
- Ne pas utiliser `cleanup:hard` sauf en dernier recours
- Ne pas supprimer manuellement le dossier `sessions/`
- Ne pas fermer brutalement le terminal (utilisez Ctrl+C)

---

## 🔍 **Vérification de l'État**

### Dans WhatsApp, envoyez :
```
!status    # Vérifier l'état des services
!help      # Aide complète
!ping      # Test de connexion
```

### Dans le terminal :
- ✅ `Bot WhatsApp PestAlert connecté!` = Connexion réussie
- ❌ `📱 Scannez ce QR code` = Authentification requise
- ⚠️ `Session closed` = Problème de session (utilisez cleanup:soft)

---

## 🆘 **Support Rapide**

**Problème le plus courant :** Bot demande le QR code à chaque redémarrage
**Solution :** Utilisez `npm run cleanup:soft` au lieu de `npm run cleanup:hard`

**Problème :** Erreurs EBUSY répétées
**Solution :** `npm run cleanup:soft` puis `npm run start:monitor`
