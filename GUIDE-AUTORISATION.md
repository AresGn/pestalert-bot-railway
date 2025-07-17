# 🔐 Guide d'Autorisation - PestAlert Bot

## 📋 Vue d'ensemble

Le système d'autorisation permet de contrôler **qui peut utiliser le bot** et **qui peut l'administrer**. Il offre trois modes de filtrage pour s'adapter à différents besoins.

## 🔧 Configuration

### 1. Variables d'environnement (.env)

```env
# Mode de filtrage
FILTER_MODE=disabled          # disabled, whitelist, ou country

# Administrateurs (sans le +, séparés par des virgules)
ADMIN_NUMBERS=22912345678,33123456789

# Utilisateurs autorisés (sans le +, séparés par des virgules)  
ALLOWED_USERS=22911111111,22922222222

# Codes pays autorisés (sans le +, séparés par des virgules)
ALLOWED_COUNTRY_CODES=229,221,33,1

# Alertes pour accès non autorisés
ALERT_ON_UNAUTHORIZED=true
```

### 2. Configuration dans le code

Modifiez `src/config/allowedNumbers.ts` :

```typescript
export const defaultAllowedNumbers: AllowedNumbersConfig = {
  adminNumbers: [
    '22912345678',  // Votre numéro admin
  ],
  allowedUsers: [
    '22911111111',  // Utilisateur autorisé 1
    '22922222222',  // Utilisateur autorisé 2
  ],
  filterMode: 'whitelist', // Changez selon vos besoins
  // ...
};
```

## 🎯 Modes de Filtrage

### 1. 🚫 **Mode `disabled`** (Par défaut)
- **Comportement** : Aucun filtrage, le bot répond à tous
- **Usage** : Tests, développement, usage personnel
- **Configuration** : `FILTER_MODE=disabled`

### 2. 📝 **Mode `whitelist`** (Liste blanche)
- **Comportement** : Seuls les numéros dans `ADMIN_NUMBERS` + `ALLOWED_USERS` peuvent utiliser le bot
- **Usage** : Organisations, usage contrôlé
- **Configuration** : `FILTER_MODE=whitelist`

### 3. 🌍 **Mode `country`** (Par pays)
- **Comportement** : Tous les numéros des pays dans `ALLOWED_COUNTRY_CODES` peuvent utiliser le bot
- **Usage** : Restriction géographique
- **Configuration** : `FILTER_MODE=country`

## 👑 Commandes d'Administration

**⚠️ Réservées aux administrateurs uniquement**

### Gestion des utilisateurs
```
!auth add +22912345678     # Ajouter un numéro autorisé
!auth remove +22912345678  # Supprimer un numéro autorisé
```

### Configuration
```
!auth mode whitelist       # Activer le mode liste blanche
!auth mode country         # Activer le mode pays
!auth mode disabled        # Désactiver le filtrage
```

### Informations
```
!auth stats               # Voir les statistiques
!auth reload              # Recharger la configuration
!auth                     # Aide complète
```

## 📊 Exemples de Configuration

### Configuration 1 : Usage Personnel
```env
FILTER_MODE=disabled
ADMIN_NUMBERS=22912345678
ALLOWED_USERS=
ALLOWED_COUNTRY_CODES=229,221,33,1
ALERT_ON_UNAUTHORIZED=false
```
**Résultat** : Le bot répond à tous, pas d'alertes

### Configuration 2 : Organisation Stricte
```env
FILTER_MODE=whitelist
ADMIN_NUMBERS=22912345678,22987654321
ALLOWED_USERS=22911111111,22922222222,22133333333
ALLOWED_COUNTRY_CODES=229,221,33,1
ALERT_ON_UNAUTHORIZED=true
```
**Résultat** : Seuls 5 numéros spécifiques peuvent utiliser le bot

### Configuration 3 : Restriction Géographique
```env
FILTER_MODE=country
ADMIN_NUMBERS=22912345678
ALLOWED_USERS=
ALLOWED_COUNTRY_CODES=229,221
ALERT_ON_UNAUTHORIZED=true
```
**Résultat** : Seuls les numéros du Bénin (229) et Sénégal (221) peuvent utiliser le bot

## 🚨 Gestion des Accès Non Autorisés

### Comportement par défaut
1. **Message refusé** : L'utilisateur reçoit "🚫 Désolé, vous n'êtes pas autorisé à utiliser ce bot."
2. **Log sécurité** : L'événement est enregistré dans les logs
3. **Alerte admin** : Si `ALERT_ON_UNAUTHORIZED=true`, les admins reçoivent une alerte

### Format de l'alerte admin
```
🚨 Tentative d'accès non autorisée

📱 Numéro: +22999999999
👤 Contact: John Doe
💬 Message: "Hi PestAlerte 👋"
⏰ Heure: 17/07/2025 10:30:15
❌ Raison: Numéro non autorisé
```

## 🔄 Changement de Configuration

### Méthode 1 : Variables d'environnement
1. Modifiez le fichier `.env`
2. Redémarrez le bot : `npm run restart`

### Méthode 2 : Commandes admin (temporaire)
```
!auth mode whitelist       # Change le mode
!auth add +22912345678     # Ajoute un utilisateur
!auth reload               # Recharge depuis .env
```

### Méthode 3 : Code source (permanent)
1. Modifiez `src/config/allowedNumbers.ts`
2. Recompilez : `npm run build`
3. Redémarrez : `npm run start`

## 📱 Format des Numéros

### ✅ Formats acceptés
- **Dans .env** : `22912345678` (sans + ni @c.us)
- **Dans commandes** : `+22912345678` ou `22912345678`
- **Interne** : `22912345678@c.us` (ajouté automatiquement)

### ❌ Formats à éviter
- `+22912345678@c.us` (double format)
- `229 12 34 56 78` (espaces)
- `(229) 12-34-56-78` (caractères spéciaux)

## 🛡️ Sécurité

### Bonnes pratiques
1. **Limitez les admins** : Minimum nécessaire
2. **Utilisez whitelist** : Pour un contrôle strict
3. **Activez les alertes** : Pour surveiller les tentatives
4. **Logs réguliers** : Vérifiez les tentatives d'accès

### Surveillance
- Les tentatives non autorisées sont comptées par numéro
- Les statistiques sont disponibles via `!auth stats`
- Les logs de sécurité sont dans les fichiers de log

## 🆘 Dépannage

### Problème : Admin ne peut pas utiliser les commandes
**Solution** : Vérifiez que votre numéro est dans `ADMIN_NUMBERS`

### Problème : Utilisateur autorisé ne peut pas utiliser le bot
**Solutions** :
1. Vérifiez le mode de filtrage : `!auth stats`
2. Vérifiez la liste : `!auth` (admin seulement)
3. Ajoutez le numéro : `!auth add +22912345678`

### Problème : Trop d'alertes d'accès non autorisé
**Solutions** :
1. Changez le mode : `!auth mode disabled`
2. Désactivez les alertes : `ALERT_ON_UNAUTHORIZED=false`
3. Utilisez le mode country : `!auth mode country`
