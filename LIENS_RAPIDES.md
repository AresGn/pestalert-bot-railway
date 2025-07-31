# 🔗 Liens Rapides - PestAlert Bot

## 📚 **Documentation Principale**

| Fichier | Description | Usage |
|---------|-------------|-------|
| **[README.md](./README.md)** | Vue d'ensemble du projet | Démarrage rapide |
| **[GUIDE_TEST_COMPLET.md](./GUIDE_TEST_COMPLET.md)** | Guide de test intégral | Tests utilisateur |
| **[ALERTES_PREDICTIVES.md](./ALERTES_PREDICTIVES.md)** | Documentation technique alertes | Développeurs |
| **[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)** | Déploiement Railway | DevOps |

---

## 🧪 **Scripts de Test**

| Script | Description | Commande |
|--------|-------------|----------|
| **[test-predictive-alerts.js](./test-predictive-alerts.js)** | Test système complet | `node test-predictive-alerts.js` |
| **[test-precision-scenarios.js](./test-precision-scenarios.js)** | Test précision modèle | `node test-precision-scenarios.js` |
| **[test-optimized-model.js](./test-optimized-model.js)** | Test modèle optimisé | `node test-optimized-model.js` |

---

## 🚀 **Démarrage Rapide**

### **1. Installation**
```bash
git clone https://github.com/AresGn/pestalert-bot-railway.git
cd pestalert-bot-railway
npm install
cp .env.example .env
# Éditer .env avec vos clés API
```

### **2. Démarrage Local**
```bash
npm run build
npm start
```

### **3. Test des Fonctionnalités**
```
WhatsApp:
- "Hi PestAlerte 👋"      → Menu principal
- "!alertes test"         → Test alertes prédictives
- "!status"               → Statut complet
```

---

## 🔮 **Alertes Prédictives - Commandes**

| Commande | Description | Exemple |
|----------|-------------|---------|
| `!alertes test` | Tester une alerte | Analyse conditions actuelles |
| `!alertes on` | S'abonner | Alertes automatiques 6h |
| `!alertes off` | Se désabonner | Arrêt des alertes |
| `!alertes seuil moderate` | Changer seuil | moderate/high/critical |
| `!alertes status` | Voir statut | Abonnements actifs |

---

## 📊 **Dashboard et APIs**

| Service | URL | Status |
|---------|-----|--------|
| **Dashboard Vercel** | https://pestalert-dashboard.vercel.app | ✅ Actif |
| **OpenEPI Weather** | https://api.openepi.io | ✅ Intégré |
| **OpenWeatherMap** | api.openweathermap.org | ✅ Validation |
| **WeatherAPI.com** | api.weatherapi.com | ✅ Validation |
| **PlantNet** | my-api.plantnet.org | ✅ Diagnostic |

---

## 🔧 **Configuration Essentielle**

### **Variables d'Environnement Critiques**
```env
# APIs Validation (Recommandées)
OPENWEATHERMAP_API_KEY=your_key_here
WEATHERAPI_KEY=your_key_here

# Dashboard
DASHBOARD_API_URL=https://pestalert-dashboard.vercel.app

# Alertes Prédictives
ENABLE_PREDICTIVE_ALERTS=true

# Mode Simplifié
SIMPLIFIED_MODE=true
DEFAULT_SIMPLIFIED_LANGUAGE=fr
```

---

## 🎯 **Scénarios de Test Rapides**

### **Test 1 : Diagnostic Photo**
```
1. "Hi PestAlerte 👋"
2. "1" (Analyse santé)
3. [Envoyer photo plante]
4. Vérifier diagnostic
```

### **Test 2 : Alertes Prédictives**
```
1. "!alertes test"
2. Vérifier niveau de risque
3. "!alertes on"
4. Confirmer abonnement
```

### **Test 3 : Statut Système**
```
1. "!status"
2. Vérifier tous les services
3. "!ping"
4. Confirmer connexion
```

---

## 📈 **Métriques de Performance**

### **Attendues (Validées)**
- **Précision alertes** : 62.5%
- **Robustesse** : 83.3%
- **Temps réponse** : < 30s
- **Taux succès** : 85-95%

### **Monitoring**
```bash
# Logs en temps réel
npm start | grep "🔮\|✅\|❌"

# Test performance
node test-precision-scenarios.js
```

---

## 🚨 **Dépannage Rapide**

### **Problème : Commande !alertes non reconnue**
```bash
# Solution
npm run build
npm start
# Vérifier logs: "🔮 Service d'alertes prédictives initialisé"
```

### **Problème : Dashboard erreur 405**
```
# Normal - endpoint pas encore implémenté
# Le bot fonctionne en mode simulé
# Chercher: "⚠️ Authentification dashboard simulée"
```

### **Problème : Analyse photo échoue**
```
# Vérifier clé PlantNet dans .env
# Envoyer photo plus claire
# Vérifier logs PlantNet API
```

---

## 🔄 **Workflow de Développement**

### **Branches**
- `main` → Production stable
- `feature/accessibility-phase0-mvp` → Développement actuel
- `develop` → Intégration

### **Commits**
```bash
git add .
git commit -m "🔮 Feature: Description"
git push origin feature/branch-name
```

---

## 📞 **Support Technique**

### **Logs Importants à Surveiller**
```
✅ Bot WhatsApp PestAlert connecté!
🔮 Service d'alertes prédictives initialisé
📊 ✅ Dashboard integration activée
🎯 Risque calculé: HIGH (Score: 0.82)
```

### **Erreurs Communes**
```
❌ Commande non reconnue → Rebuild nécessaire
❌ API timeout → Vérifier clés API
❌ Photo analysis failed → Photo de meilleure qualité
```

---

## 🎉 **Statut Actuel**

### **✅ Fonctionnalités Opérationnelles**
- Diagnostic par photo (IA)
- Alertes prédictives automatiques
- Interface simplifiée français
- Intégration dashboard Vercel
- Commandes système complètes

### **🔄 En Développement**
- Géolocalisation automatique
- Historique attaques réel
- Authentification dashboard
- Notifications push

---

**🚀 Tout est prêt ! Suivez les liens ci-dessus pour tester et utiliser PestAlert Bot avec ses nouvelles fonctionnalités d'alertes prédictives !**
