# 🤖 Guide de Test Complet - PestAlert Bot
## Flux Intégral de Test et Utilisation

---

## 🚀 **Démarrage du Bot**

### **1. Prérequis**
```bash
# Vérifier Node.js
node --version  # >= 18.x

# Vérifier les dépendances
npm install

# Vérifier la configuration
ls .env  # Doit exister
```

### **2. Configuration Minimale (.env)**
```env
# APIs essentielles
OPENWEATHERMAP_API_KEY=f7ccf12fdeeb312df875b79422df6acd
WEATHERAPI_KEY=af0e9899ee894bb28ab220010252807

# Dashboard
DASHBOARD_API_URL=https://pestalert-dashboard.vercel.app
DASHBOARD_INTEGRATION_ENABLED=true

# Mode simplifié
SIMPLIFIED_MODE=true
DEFAULT_SIMPLIFIED_LANGUAGE=fr

# Alertes prédictives
ENABLE_PREDICTIVE_ALERTS=true
```

### **3. Démarrage**
```bash
# Build du projet
npm run build

# Démarrage du bot
npm start
```

### **4. Vérification du Démarrage**
Vous devez voir ces messages :
```
📊 Dashboard Integration Service activé
✅ OpenWeatherMap API configuré pour validation
✅ WeatherAPI.com configuré pour validation
🔮 Service d'alertes prédictives initialisé
📊 Approche hybride: OpenEPI + Validation croisée
⏰ Service de planification des alertes initialisé
✅ Bot WhatsApp PestAlert connecté!
✅ Système d'alertes prédictives opérationnel
📱 Numéro du bot: XXXXXXXXXX
🔗 État de connexion: READY
```

---

## 📱 **Test des Fonctionnalités WhatsApp**

### **PHASE 1 : Connexion et Accueil**

#### **Test 1.1 : Premier Contact**
```
Message à envoyer : "Hi PestAlerte 👋"
```
**Résultat attendu :**
```
🌾 Bienvenue sur PestAlert ! 🌾

Votre assistant agricole intelligent pour :
🔍 Diagnostiquer la santé de vos cultures
🛡️ Détecter les ravageurs et maladies
📊 Recevoir des alertes prédictives

📋 MENU PRINCIPAL :
1️⃣ Analyser la santé (sain/malade)
2️⃣ Vérifier la présence de ravageurs  
3️⃣ Envoyer une alerte urgente

💡 Tapez le numéro de votre choix (1, 2 ou 3)
🔮 Nouvelles alertes prédictives : tapez !alertes
```

#### **Test 1.2 : Commandes d'Aide**
```
Message à envoyer : "!help"
```
**Résultat attendu :**
- Liste complète des commandes
- Section alertes prédictives incluse
- Instructions claires

---

### **PHASE 2 : Diagnostic par Photo (Fonctionnalité Principale)**

#### **Test 2.1 : Analyse Santé (Option 1)**
```
1. Envoyer : "1"
2. Attendre le message de demande de photo
3. Envoyer une photo de plante
```

**Flux attendu :**
```
Étape 1 - Sélection :
"📸 Analyse de santé sélectionnée
Envoyez une photo claire de votre culture pour analyse..."

Étape 2 - Réception photo :
"📸 Photo reçue ! Analyse en cours...
⏳ Veuillez patienter..."

Étape 3 - Résultat :
"🔍 RÉSULTAT D'ANALYSE - SANTÉ

📊 Confiance : XX%
🎯 Diagnostic : [SAIN/MALADE]
📋 Détails : [Description détaillée]

💡 RECOMMANDATIONS :
• [Recommandation 1]
• [Recommandation 2]

⏰ Analysé le : [Date/Heure]
🔄 Tapez 'menu' pour revenir au menu principal"
```

#### **Test 2.2 : Détection Ravageurs (Option 2)**
```
1. Envoyer : "2"
2. Envoyer une photo de plante avec/sans ravageurs
```

**Flux attendu :**
```
"🔍 RÉSULTAT D'ANALYSE - RAVAGEURS

📊 Confiance : XX%
🎯 Détection : [RAVAGEURS DÉTECTÉS/AUCUN RAVAGEUR]
🐛 Types identifiés : [Liste des ravageurs]

🛡️ PLAN D'ACTION :
• [Action 1]
• [Action 2]

⚠️ Niveau d'urgence : [FAIBLE/MODÉRÉ/ÉLEVÉ]"
```

#### **Test 2.3 : Alerte Urgente (Option 3)**
```
1. Envoyer : "3"
2. Suivre les instructions
```

**Flux attendu :**
```
"🚨 ALERTE URGENTE ACTIVÉE

Décrivez votre problème ou envoyez une photo :
• Attaque massive de ravageurs
• Maladie qui se propage
• Problème urgent nécessitant aide

📞 Votre alerte sera transmise aux experts locaux
⏱️ Réponse attendue sous 2-4h"
```

---

### **PHASE 3 : Alertes Prédictives (Nouvelle Fonctionnalité)**

#### **Test 3.1 : Test d'Alerte Prédictive**
```
Message à envoyer : "!alertes test"
```

**Résultat attendu :**
```
🔮 **Test d'alerte prédictive en cours...**

⏳ Analyse des conditions météo...

🧪 **RÉSULTAT DU TEST**

[Emoji selon niveau] **ALERTE PRÉDICTIVE PESTALERT**

📊 **Niveau de risque**: [LOW/MODERATE/HIGH/CRITICAL]
🎯 **Score**: XX% de probabilité d'attaque

🌡️ **Conditions actuelles**:
• Température élevée (risque +XX%)
• Humidité élevée (risque +XX%)
• Saison favorable aux ravageurs (risque +XX%)

⏰ **Prévision**: Conditions favorables aux ravageurs dans les 24-48h

🛡️ **RECOMMANDATIONS**:
1. [Recommandation spécifique]
2. [Action préventive]
3. [Surveillance recommandée]

📊 **Détails techniques**:
• Source: [OpenEPI_Only/Hybrid_Validated/Fallback_Mode]
• Confiance: XX.X%
• Score: XX.X%
```

#### **Test 3.2 : Abonnement aux Alertes**
```
Message à envoyer : "!alertes on"
```

**Résultat attendu :**
```
✅ **Abonnement aux alertes prédictives activé !**

📍 **Position:** Abidjan, Côte d'Ivoire (par défaut)
🎯 **Seuil:** Risque modéré et plus
⏰ **Fréquence:** Toutes les 6h

🔮 Vous recevrez des alertes automatiques quand les conditions météo favorisent l'apparition de ravageurs.

💡 **Changez votre seuil:** !alertes seuil high
📍 **Position personnalisée:** Bientôt disponible !
```

#### **Test 3.3 : Gestion des Seuils**
```
Messages à tester :
- "!alertes seuil moderate"
- "!alertes seuil high" 
- "!alertes seuil critical"
```

#### **Test 3.4 : Statut des Alertes**
```
Message à envoyer : "!alertes status"
```

**Résultat attendu :**
```
📊 **Statut des Alertes Prédictives**

🔮 **Système:** ✅ Actif
👥 **Abonnés actifs:** X
📈 **Total abonnements:** X

📊 **Répartition par seuil:**
• moderate: X utilisateurs
• high: X utilisateurs
• critical: X utilisateurs

⏰ **Prochaine vérification:** Dans quelques heures
💡 **Votre statut:** Abonné
```

#### **Test 3.5 : Désabonnement**
```
Message à envoyer : "!alertes off"
```

---

### **PHASE 4 : Commandes Système**

#### **Test 4.1 : Test de Connexion**
```
Message à envoyer : "!ping"
```
**Résultat attendu :** `🏓 Pong! Bot opérationnel`

#### **Test 4.2 : Statut Complet**
```
Message à envoyer : "!status"
```

**Résultat attendu :**
```
🤖 **STATUS PESTALERT BOT**

⏰ **Uptime:** X heures X minutes
🔗 **Connexion:** ✅ Stable
📊 **Dashboard:** ✅ Connecté

🔮 **Alertes prédictives:**
✅ Actives

🧠 **IA Services:**
✅ PlantNet API: Opérationnel
✅ OpenEPI Weather: Opérationnel
✅ Validation APIs: 2 sources actives

🚨 **Système d'alertes:**
✅ Opérationnel (X alertes traitées)

👥 **Sessions actives:** X

📈 **Métriques:**
• Messages traités: X
• Analyses réussies: X
• Taux de succès: XX%
```

---

### **PHASE 5 : Navigation et Retour**

#### **Test 5.1 : Retour au Menu**
```
Messages à tester :
- "menu"
- "Menu"
- "MENU"
- "retour"
```

#### **Test 5.2 : Messages Contextuels**
```
Messages à tester :
- "aide"
- "help"
- "comment ça marche"
- "problème"
```

---

## 🔍 **Vérifications Techniques**

### **Logs à Surveiller**

#### **Démarrage Réussi :**
```
✅ Bot WhatsApp PestAlert connecté!
✅ Système d'alertes prédictives opérationnel
📊 ✅ Dashboard integration activée
🔗 État de connexion: READY
```

#### **Traitement des Messages :**
```
🎯 ÉVÉNEMENT MESSAGE DÉCLENCHÉ !
✅ ACCÈS AUTORISÉ: XXXXXXXXXX@c.us - Numéro autorisé
✅ MESSAGE ACCEPTÉ - Traitement en cours...
```

#### **Alertes Prédictives :**
```
🔮 Commande d'alertes prédictives détectée
🎭 Analyse politique : OpenEPI Weather en premier
🧠 Activation du système de consensus intelligent
🎯 Risque calculé: HIGH (Score: 0.82)
```

#### **Analyses d'Images :**
```
📸 Image reçue pour analyse
🔍 Analyse PlantNet en cours...
✅ Analyse terminée avec succès
📊 Confiance: XX%
```

### **Erreurs Possibles et Solutions**

#### **Erreur : "Commande non reconnue"**
- **Cause :** Commande mal écrite ou bot non à jour
- **Solution :** Vérifier l'orthographe, rebuild si nécessaire

#### **Erreur : "Analyse échouée"**
- **Cause :** Photo de mauvaise qualité ou API indisponible
- **Solution :** Renvoyer une photo plus claire

#### **Erreur : "Dashboard non disponible"**
- **Cause :** Normal, endpoint d'authentification pas encore implémenté
- **Solution :** Le bot fonctionne quand même en mode simulé

---

## 📊 **Métriques de Performance**

### **Temps de Réponse Attendus :**
- **Commandes simples** : < 2 secondes
- **Analyse d'image** : 5-15 secondes
- **Alertes prédictives** : 10-30 secondes
- **Statut système** : < 5 secondes

### **Taux de Réussite Attendus :**
- **Reconnaissance commandes** : 100%
- **Analyse d'images** : 85-95%
- **Alertes prédictives** : 62.5% (validé)
- **Connexion dashboard** : 100% (simulé)

---

## 🎯 **Scénarios de Test Complets**

### **Scénario 1 : Utilisateur Débutant**
```
1. "Hi PestAlerte 👋"          → Accueil
2. "1"                         → Sélection analyse santé
3. [Envoyer photo]             → Analyse
4. "menu"                      → Retour menu
5. "!alertes test"             → Test prédictif
6. "!alertes on"               → Abonnement
```

### **Scénario 2 : Utilisateur Avancé**
```
1. "!status"                   → Statut complet
2. "2"                         → Détection ravageurs
3. [Envoyer photo]             → Analyse
4. "!alertes seuil critical"   → Seuil critique
5. "!alertes status"           → Vérification
```

### **Scénario 3 : Urgence Agricole**
```
1. "3"                         → Alerte urgente
2. [Décrire problème]          → Transmission
3. "!alertes test"             → Vérification risque
4. [Suivre recommandations]    → Action
```

---

## ✅ **Checklist de Validation**

### **Fonctionnalités de Base :**
- [ ] Accueil et menu principal
- [ ] Analyse santé (option 1)
- [ ] Détection ravageurs (option 2)  
- [ ] Alerte urgente (option 3)
- [ ] Navigation (menu, retour)

### **Alertes Prédictives :**
- [ ] Test d'alerte (!alertes test)
- [ ] Abonnement (!alertes on)
- [ ] Gestion seuils (!alertes seuil)
- [ ] Statut (!alertes status)
- [ ] Désabonnement (!alertes off)

### **Commandes Système :**
- [ ] Ping (!ping)
- [ ] Aide (!help)
- [ ] Statut (!status)

### **Robustesse :**
- [ ] Gestion erreurs
- [ ] Messages invalides
- [ ] Photos de mauvaise qualité
- [ ] Commandes inconnues

---

**🎉 Le bot PestAlert est maintenant prêt avec ses 2 fonctions principales : diagnostic par photo ET alertes prédictives automatiques !**

**Suivez ce guide pour tester toutes les fonctionnalités de manière systématique. 🚀**
