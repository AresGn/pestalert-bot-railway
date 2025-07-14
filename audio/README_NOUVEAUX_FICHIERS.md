# Fichiers Audio Nécessaires pour le Nouveau Flux d'Accueil

## 📋 Fichiers Audio Existants
- ✅ `Reponse.mp3` - Réponse normale pour détection de ravageurs
- ✅ `Alerte.mp3` - Alerte critique pour détection de ravageurs  
- ✅ `Incertaine.mp3` - Réponse incertaine (voir README_Incertaine.md)

## 🆕 Nouveaux Fichiers Audio Requis

### 1. `Welcome.mp3` - Message de Bienvenue
**Déclencheur:** Quand l'utilisateur tape "Hi PestAlerte 👋"
**Contenu suggéré:**
```
Bonjour et bienvenue sur PestAlert !
Je suis votre assistant agricole intelligent.
Je peux vous aider à analyser la santé de vos cultures,
détecter la présence de ravageurs, et envoyer des alertes urgentes.
Choisissez une option dans le menu qui suit.
```

### 2. `CropSains.mp3` - Culture Saine (Confiance Élevée)
**Déclencheur:** Analyse de santé avec confiance élevée (75-100%) et résultat sain
**Contenu suggéré:**
```
Excellente nouvelle ! Votre culture est en bonne santé avec un niveau de confiance élevé.
Les analyses montrent des signes très positifs.
Continuez vos bonnes pratiques agricoles et maintenez votre surveillance régulière.
Consultez le message texte pour les détails complets et les métriques d'analyse.
```

### 3. `CropMalade.mp3` - Culture Malade (Confiance Élevée)
**Déclencheur:** Analyse de santé avec confiance élevée (75-100%) et résultat malade
**Contenu suggéré:**
```
Attention ! Votre culture présente des signes de maladie avec un niveau de confiance élevé.
Nos analyses détectent des problèmes qui nécessitent une action rapide.
Consultez immédiatement un expert agricole et suivez les recommandations détaillées
dans le message texte qui accompagne cette analyse.
```

## 🆕 Nouveaux Fichiers Audio pour Niveaux de Confiance

### 4. `CropMoyenne.mp3` - Confiance Moyenne (50-75%)
**Déclencheur:** Analyse avec confiance moyenne
**Contenu suggéré:**
```
Analyse terminée avec un niveau de confiance moyen.
Les résultats sont probablement fiables mais nécessitent une surveillance attentive.
Je recommande de prendre des photos supplémentaires sous différents angles
et de surveiller l'évolution sur les prochains jours.
Consultez le message texte pour les recommandations spécifiques.
```

### 5. `CropIncertaine_Faible.mp3` - Confiance Faible (25-50%)
**Déclencheur:** Analyse avec confiance faible
**Contenu suggéré:**
```
Analyse terminée mais avec un niveau de confiance faible.
Les résultats sont incertains et nécessitent une vérification.
Je recommande fortement de reprendre des photos avec un meilleur éclairage,
de photographier différentes zones de votre culture,
et de consulter un expert agricole pour confirmation.
```

### 6. `CropIncertaine_TresFaible.mp3` - Confiance Très Faible (0-25%)
**Déclencheur:** Analyse avec confiance très faible
**Contenu suggéré:**
```
Analyse terminée mais les résultats sont très incertains.
La qualité de l'image ou les conditions d'analyse ne permettent pas
un diagnostic fiable. Veuillez reprendre une photo avec un meilleur éclairage,
plus proche de la zone concernée, et dans de meilleures conditions.
Une consultation avec un expert agricole est fortement recommandée.
```

## 🎯 Spécifications Techniques

### Format Audio Recommandé
- **Format:** MP3
- **Qualité:** 128 kbps minimum
- **Durée:** 15-30 secondes maximum
- **Langue:** Français
- **Ton:** Professionnel mais accessible

### Considérations pour l'Enregistrement
1. **Clarté:** Voix claire et bien articulée
2. **Débit:** Parler à un rythme modéré
3. **Contexte:** Adapté aux agriculteurs francophones
4. **Professionnalisme:** Ton rassurant et expert

## 🔧 Intégration Technique

### Utilisation dans le Code
```typescript
// Welcome.mp3
const welcomeAudio = await audioService.getWelcomeAudio();

// CropSains.mp3  
const healthyAudio = await audioService.getHealthyCropAudio();

// CropMalade.mp3
const diseasedAudio = await audioService.getDiseasedCropAudio();
```

### Vérification des Fichiers
```bash
npm run test:services
```
Cette commande vérifiera la présence de tous les fichiers audio requis.

## 📝 Notes d'Implémentation

### Flux d'Utilisation
1. **Accueil:** `Welcome.mp3` + Menu texte
2. **Option 1 - Santé:** 
   - Image reçue → Analyse → `CropSains.mp3` OU `CropMalade.mp3` + Message texte détaillé
3. **Option 2 - Ravageurs:** 
   - Utilise les fichiers existants (`Reponse.mp3`, `Alerte.mp3`, `Incertaine.mp3`)
4. **Option 3 - Alerte:** 
   - Système d'alerte (pas d'audio spécifique pour l'instant)

### Gestion des Erreurs
- Si un fichier audio est manquant, le bot envoie un message texte de remplacement
- Les analyses continuent de fonctionner même sans les fichiers audio
- Le système log les fichiers manquants pour faciliter le debug

## 🚀 Prochaines Étapes

1. **Enregistrer les 3 nouveaux fichiers audio**
2. **Les placer dans le dossier `packages/bot/audio/`**
3. **Tester avec `npm run test:services`**
4. **Démarrer le bot et tester le flux complet**

## 📞 Support

Si vous avez des questions sur l'implémentation ou besoin d'aide pour l'enregistrement des fichiers audio, consultez la documentation du projet ou contactez l'équipe de développement.
