# 🚀 Guide d'Intégration Phase 0 - MVP Test
## Implémentation du Mode Simplifié Français

---

## 🎯 **OBJECTIF PHASE 0**

Valider l'approche "audio-first" avec un prototype minimal en français simplifié avant d'investir dans le multilinguisme complet.

---

## 📋 **ÉTAPES D'INTÉGRATION**

### **1. Préparation de l'Environnement**

```bash
# Créer une branche dédiée
git checkout -b feature/accessibility-mvp
git push origin feature/accessibility-mvp

# Installer dépendances si nécessaire
npm install --save-dev @types/node-cron
npm install node-cron

# Créer les dossiers audio
mkdir -p audio/fr_simple
```

### **2. Modification du Handler Principal**

Modifier votre `src/index.ts` existant :

```typescript
// Ajouter l'import du nouveau service
import { SimplifiedMenuService } from './services/simplifiedMenuService';

// Initialiser le service simplifié
const simplifiedMenuService = new SimplifiedMenuService(audioService, userSessionService);

// Modifier le handler de messages pour la phase 0
client.on('message', async (message) => {
  try {
    const contact = await message.getContact();
    console.log(`📩 Message de ${contact.name || contact.number}: ${message.body}`);

    // PHASE 0: Mode simplifié français uniquement
    
    // 1. Vérifier le déclencheur d'accueil
    if (message.body.trim().toLowerCase() === 'salut' || 
        message.body.trim() === 'Hi PestAlerte 👋') {
      await handleSimplifiedWelcome(message);
      return;
    }

    // 2. Vérifier les commandes de retour au menu
    if (simplifiedMenuService.isReturnToMenuCommand(message.body)) {
      const menuMessage = simplifiedMenuService.returnToMainMenu(contact.number);
      await message.reply(menuMessage);
      return;
    }

    // 3. Vérifier les sélections de menu (1, 2, 3)
    if (['1', '2', '3'].includes(message.body.trim())) {
      await handleSimplifiedMenuSelection(message);
      return;
    }

    // 4. Gérer les médias (photos) avec réponses simplifiées
    if (message.hasMedia) {
      await handleSimplifiedMediaMessages(message);
      return;
    }

    // 5. Gérer les commandes traditionnelles (!ping, !help, etc.)
    if (message.body.startsWith('!')) {
      await handleCommands(message);
      return;
    }

    // 6. Réponses contextuelles simplifiées
    await handleSimplifiedContextualResponses(message);

  } catch (error: any) {
    console.error('Erreur lors du traitement du message:', error);
    await message.reply(simplifiedMenuService.getErrorMessage());
  }
});

// Nouvelle fonction pour gérer l'accueil simplifié
async function handleSimplifiedWelcome(message: any) {
  const contact = await message.getContact();
  console.log(`👋 Accueil simplifié pour ${contact.name || contact.number}`);

  try {
    const welcomeResponse = await simplifiedMenuService.getWelcomeMessage();

    // Envoyer d'abord l'audio de bienvenue
    if (welcomeResponse.audioMessage) {
      await message.reply(welcomeResponse.audioMessage);
      // Attendre un peu avant d'envoyer le menu texte
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Puis envoyer le menu texte simplifié
    await message.reply(welcomeResponse.textMessage);

    // Mettre à jour l'état de l'utilisateur
    userSessionService.updateSessionState(contact.number, UserState.MAIN_MENU);

  } catch (error: any) {
    console.error('Erreur accueil simplifié:', error);
    await message.reply(simplifiedMenuService.getErrorMessage());
  }
}

// Nouvelle fonction pour gérer les sélections de menu simplifiées
async function handleSimplifiedMenuSelection(message: any) {
  const contact = await message.getContact();
  const option = message.body.trim();

  try {
    const result = await simplifiedMenuService.handleMenuSelection(contact.number, option);
    await message.reply(result.message);
  } catch (error: any) {
    console.error('Erreur sélection menu:', error);
    await message.reply(simplifiedMenuService.getErrorMessage());
  }
}

// Nouvelle fonction pour gérer les médias avec réponses simplifiées
async function handleSimplifiedMediaMessages(message: any) {
  const contact = await message.getContact();

  try {
    // Envoyer message d'analyse en cours
    const analyzingResponse = await simplifiedMenuService.getAnalyzingMessage();
    if (analyzingResponse.audioMessage) {
      await message.reply(analyzingResponse.audioMessage);
    }
    await message.reply(analyzingResponse.textMessage);

    // Télécharger et analyser l'image
    const media = await message.downloadMedia();
    const imageBuffer = Buffer.from(media.data, 'base64');

    // Utiliser votre système d'analyse existant
    const analysisResult = await healthAnalysisService.analyzeCropHealth(imageBuffer, contact.number);

    // Générer réponse simplifiée selon le résultat
    const responseKey = analysisResult.isHealthy ? 'healthy' : 'diseased';
    const severity = analysisResult.confidence > 0.8 ? 'high' : 'medium';
    
    const simplifiedResponse = await simplifiedMenuService.generateAnalysisResponse(
      analysisResult.isHealthy,
      analysisResult.confidence,
      severity
    );

    // Envoyer audio puis texte
    if (simplifiedResponse.audioMessage) {
      await client.sendMessage(contact.number + '@c.us', simplifiedResponse.audioMessage);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    await message.reply(simplifiedResponse.textMessage);

    // Réinitialiser l'état
    userSessionService.resetSession(contact.number);

  } catch (error: any) {
    console.error('Erreur analyse simplifiée:', error);
    const unclearResponse = await simplifiedMenuService.getUnclearPhotoMessage();
    
    if (unclearResponse.audioMessage) {
      await message.reply(unclearResponse.audioMessage);
    }
    await message.reply(unclearResponse.textMessage);
  }
}

// Nouvelle fonction pour les réponses contextuelles simplifiées
async function handleSimplifiedContextualResponses(message: any) {
  const contact = await message.getContact();

  // Vérifier si c'est une commande simple
  if (simplifiedMenuService.isSimpleCommand(message.body)) {
    const helpMessage = simplifiedMenuService.getContextualHelp(contact.number);
    await message.reply(helpMessage);
  } else {
    // Message non reconnu
    await message.reply("🤔 Je comprends pas\nTape 'aide' ou 'menu'");
  }
}
```

### **3. Création des Fichiers Audio**

Créer les fichiers audio suivants dans `audio/fr_simple/` :

#### **Scripts à Enregistrer**

**welcome_simple.mp3 (15 secondes)**
```
"Bonjour ami agriculteur !
Je suis PestAlert, ton assistant.
Envoie photo de ton plant.
Je te dis s'il va bien."
```

**healthy_simple.mp3 (10 secondes)**
```
"Très bien !
Ton plant va bien.
Continue comme ça !"
```

**diseased_simple.mp3 (12 secondes)**
```
"Attention !
Petites bêtes sur ton plant.
Traite rapidement !"
```

**critical_simple.mp3 (15 secondes)**
```
"Urgent ! Urgent !
Ton plant très malade !
Appelle expert maintenant !"
```

**unclear_simple.mp3 (10 secondes)**
```
"Photo pas claire.
Reprends avec lumière.
Merci !"
```

**analyzing_simple.mp3 (8 secondes)**
```
"Analyse en cours.
Patiente un moment.
Merci !"
```

### **4. Configuration Audio Service**

Modifier votre `src/services/audioService.ts` pour supporter les nouveaux fichiers :

```typescript
// Ajouter ces méthodes à votre AudioService existant

/**
 * Obtenir audio simplifié français
 */
async getSimplifiedAudio(filename: string): Promise<MessageMedia | null> {
  const simplifiedPath = path.join(this.audioPath, 'fr_simple', filename);
  
  if (fs.existsSync(simplifiedPath)) {
    return await this.createAudioMessage(`fr_simple/${filename}`);
  }
  
  // Fallback vers audio normal si simplifié pas disponible
  console.log(`⚠️ Audio simplifié ${filename} non trouvé, utilisation version normale`);
  return await this.createAudioMessage(filename);
}
```

### **5. Tests de Validation**

#### **Test 1 : Workflow Complet**
```
1. Utilisateur: "salut"
   → Bot: 🎵 Audio bienvenue + Menu simplifié

2. Utilisateur: "1"
   → Bot: "📷 Envoie photo de ton plant"

3. Utilisateur: [Envoie photo]
   → Bot: 🎵 "Analyse..." → 🎵 Résultat + Texte

4. Utilisateur: "menu"
   → Bot: Retour menu principal
```

#### **Test 2 : Gestion d'Erreurs**
```
1. Utilisateur: "blabla"
   → Bot: "🤔 Je comprends pas\nTape 'aide' ou 'menu'"

2. Utilisateur: [Photo floue]
   → Bot: 🎵 "Photo pas claire" + Instructions
```

#### **Test 3 : Commandes Simples**
```
1. Utilisateur: "aide"
   → Bot: Instructions d'aide

2. Utilisateur: "3"
   → Bot: Menu d'aide détaillé
```

### **6. Métriques à Surveiller**

```typescript
// Ajouter logging pour Phase 0
const phase0Metrics = {
  welcomeMessages: 0,
  photoAnalyses: 0,
  audioPlayed: 0,
  userErrors: 0,
  averageResponseTime: 0
};

// Logger chaque interaction
console.log(`📊 Phase 0 - ${action}: ${JSON.stringify(metrics)}`);
```

---

## ✅ **CHECKLIST PHASE 0**

### **Préparation**
- [ ] Branche `feature/accessibility-mvp` créée
- [ ] Service `SimplifiedMenuService` intégré
- [ ] Dossier `audio/fr_simple/` créé
- [ ] Handler principal modifié

### **Audio**
- [ ] 6 fichiers audio enregistrés
- [ ] Qualité audio validée (64kbps, <200KB)
- [ ] Tests de lecture sur différents appareils
- [ ] Fallback vers audio normal configuré

### **Tests**
- [ ] Workflow complet testé
- [ ] Gestion d'erreurs validée
- [ ] Commandes simples fonctionnelles
- [ ] Performance acceptable (<2s)

### **Validation Utilisateur**
- [ ] 5-10 utilisateurs pilotes recrutés
- [ ] Tests d'usage réalisés
- [ ] Feedback collecté et analysé
- [ ] Taux de satisfaction >70%

### **Documentation**
- [ ] Guide d'utilisation simple créé
- [ ] Métriques de base configurées
- [ ] Plan Phase 1 validé
- [ ] Retours d'expérience documentés

---

## 🎯 **CRITÈRES DE SUCCÈS PHASE 0**

### **Techniques**
- ✅ Interface simplifiée fonctionnelle
- ✅ Audio français de qualité
- ✅ Workflow complet opérationnel
- ✅ Temps de réponse <2 secondes

### **Utilisateur**
- ✅ Compréhension immédiate de l'interface
- ✅ Audio clair et compréhensible
- ✅ Satisfaction utilisateur >70%
- ✅ Volonté d'utiliser régulièrement

### **Business**
- ✅ Validation du concept audio-first
- ✅ Retours positifs des utilisateurs
- ✅ Faisabilité technique confirmée
- ✅ ROI potentiel identifié

**🚀 Une fois la Phase 0 validée, vous pourrez passer en confiance à la Phase 1 avec l'architecture complète et le support Bambara !**
