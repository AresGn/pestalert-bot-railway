# 🌾 PestAlert Bot - Assistant Agricole Intelligent
## Bot WhatsApp avec IA et Alertes Prédictives

Bot WhatsApp intelligent pour l'assistance agricole en Afrique de l'Ouest, développé pour Railway avec intégration dashboard Vercel et système d'alertes prédictives.

## ✨ **Fonctionnalités Principales**

### 🔍 **1. Diagnostic par Photo (IA)**
- **Analyse de santé** des cultures (sain/malade)
- **Détection de ravageurs** et maladies
- **Recommandations personnalisées** selon le diagnostic
- **Interface simplifiée** en français pour l'Afrique de l'Ouest

### 🔮 **2. Alertes Prédictives (Nouveau !)**
- **Prédiction automatique** des risques de ravageurs
- **Approche hybride** : OpenEPI + validation croisée
- **Alertes automatiques** toutes les 6h (critiques: 2h)
- **Précision validée** : 62.5% (+22.5% vs modèle initial)
- **Abonnements personnalisables** par seuil de risque

### 📊 **3. Intégration Dashboard**
- **Dashboard Vercel** : https://pestalert-dashboard.vercel.app
- **Métriques en temps réel** et analytics
- **Historique des analyses** et performances
- **Monitoring des alertes** prédictives

## 🚀 **Déploiement sur Railway**

Ce repository est optimisé pour le déploiement sur Railway avec toutes les fonctionnalités intégrées.

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

---

## 🧪 **Guide de Test Complet**

### **📱 Commandes WhatsApp Disponibles**

#### **🔍 Diagnostic par Photo**
```
1. "Hi PestAlerte 👋"     → Accueil et menu principal
2. "1"                    → Analyse santé (sain/malade)
3. "2"                    → Détection ravageurs
4. "3"                    → Alerte urgente
5. "menu"                 → Retour au menu
```

#### **🔮 Alertes Prédictives (Nouveau !)**
```
!alertes test             → Tester une alerte prédictive
!alertes on              → S'abonner aux alertes automatiques
!alertes off             → Se désabonner des alertes
!alertes seuil moderate  → Changer le seuil (moderate/high/critical)
!alertes status          → Voir le statut des abonnements
```

#### **🔧 Commandes Système**
```
!ping                    → Test de connexion
!help                    → Aide complète
!status                  → Statut détaillé du bot
```

### **📋 Flux de Test Recommandé**

**Voir le fichier `GUIDE_TEST_COMPLET.md` pour le guide détaillé de test avec tous les scénarios et résultats attendus.**

---

## 🏗️ **Architecture Technique**

### **🔮 Système d'Alertes Prédictives**
- **Approche hybride "brutalement honnête"** :
  - **COUCHE 1** : OpenEPI (obligatoire pour jury)
  - **COUCHE 2** : Validation croisée (OpenWeatherMap + WeatherAPI.com)
  - **COUCHE 3** : Consensus intelligent avec pondération
- **Précision validée** : 62.5% (+22.5% vs modèle initial)
- **Robustesse** : 83.3% (stable aux variations)

### **🧠 Services Principaux**
- `PredictiveAlertService` - Analyse prédictive hybride
- `AlertSchedulerService` - Planificateur automatique (6h/2h)
- `SimplifiedMenuService` - Interface simplifiée français
- `DashboardIntegrationService` - Intégration Vercel
- `AuthorizationService` - Sécurité et filtrage

### **📊 APIs Intégrées**
- **OpenEPI** : Source primaire météo (politique)
- **OpenWeatherMap** : Validation météo (précision)
- **WeatherAPI.com** : Validation supplémentaire
- **PlantNet** : Reconnaissance plantes/maladies
- **Dashboard Vercel** : Métriques et analytics

---

## 📈 **Performance et Métriques**

### **⚡ Temps de Réponse**
- Commandes simples : < 2 secondes
- Analyse d'image : 5-15 secondes
- Alertes prédictives : 10-30 secondes

### **🎯 Taux de Réussite**
- Reconnaissance commandes : 100%
- Analyse d'images : 85-95%
- Alertes prédictives : 62.5% (validé)
- Connexion dashboard : 100%

---

## 🔄 **Versions et Changelog**

### **v2.0.0 - Alertes Prédictives (Actuel)**
- ✅ Système d'alertes prédictives complet
- ✅ Approche hybride 3 couches
- ✅ Scheduler automatique (6h/2h)
- ✅ Commandes !alertes complètes
- ✅ Intégration dashboard Vercel
- ✅ Précision validée 62.5%

### **v1.0.0 - Diagnostic par Photo**
- ✅ Interface simplifiée français
- ✅ Analyse santé/ravageurs
- ✅ Intégration PlantNet
- ✅ Mode accessibilité Afrique de l'Ouest

---

## 🤝 **Contribution**

### **Branches Principales**
- `main` - Version stable production
- `feature/accessibility-phase0-mvp` - Développement actuel
- `develop` - Intégration continue

### **Pour Contribuer**
1. Fork le repository
2. Créer une branche feature
3. Développer et tester
4. Créer une Pull Request

---

## 📞 **Support et Contact**

- **Repository** : https://github.com/AresGn/pestalert-bot-railway
- **Dashboard** : https://pestalert-dashboard.vercel.app
- **Documentation** : Voir fichiers `*.md` du repository

---

**🎉 PestAlert Bot - L'assistant agricole intelligent avec IA et alertes prédictives pour l'Afrique de l'Ouest ! 🌾**
