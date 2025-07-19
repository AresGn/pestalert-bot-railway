# 🎙️ Scripts Audio Phase 0 - Français Simplifié
## Enregistrements pour MVP Test

---

## 🎯 **OBJECTIF**

Enregistrer 6 fichiers audio en français simplifié pour valider l'approche "audio-first" avant d'investir dans le multilinguisme complet.

---

## 📋 **FICHIERS À ENREGISTRER**

### **1. welcome_simple.mp3 (15-20 secondes)**
**Contexte :** Premier contact avec l'utilisateur
**Script :**
```
"Bonjour ami agriculteur ! Bonjour !
Je suis PestAlert, ton assistant pour les cultures.
Envoie-moi une photo de ton plant.
Je vais te dire s'il va bien."
```

### **2. healthy_simple.mp3 (10-12 secondes)**
**Contexte :** Plant en bonne santé détecté
**Script :**
```
"Très bien ! Très bien !
Ton plant va bien.
Continue comme ça, ami agriculteur !"
```

### **3. diseased_simple.mp3 (12-15 secondes)**
**Contexte :** Maladie ou ravageurs détectés
**Script :**
```
"Attention ! Attention !
Petites bêtes détectées sur ton plant.
Traite rapidement avec un produit adapté."
```

### **4. critical_simple.mp3 (15-18 secondes)**
**Contexte :** Situation critique nécessitant intervention urgente
**Script :**
```
"Urgent ! Urgent !
Ton plant est très malade !
Appelle un expert agricole maintenant.
C'est très important !"
```

### **5. unclear_simple.mp3 (10-12 secondes)**
**Contexte :** Photo de mauvaise qualité
**Script :**
```
"Photo pas assez claire.
Reprends la photo avec plus de lumière.
Merci, ami agriculteur !"
```

### **6. analyzing_simple.mp3 (8-10 secondes)**
**Contexte :** Pendant l'analyse de l'image
**Script :**
```
"Analyse de ton plant en cours.
Patiente un petit moment.
Merci !"
```

---

## 🎵 **SPÉCIFICATIONS TECHNIQUES**

### **Format Audio**
- **Format :** MP3
- **Qualité :** 64 kbps (optimisé WhatsApp)
- **Fréquence :** 22 kHz
- **Mono/Stéréo :** Mono (plus petit)
- **Taille cible :** < 200 KB par fichier

### **Caractéristiques Vocales**
- **Débit :** 120 mots/minute (lent et clair)
- **Ton :** Chaleureux, amical, rassurant
- **Volume :** Constant, bien audible
- **Articulation :** Très claire, chaque syllabe distincte
- **Accent :** Français standard, compréhensible

---

## 🎙️ **GUIDE D'ENREGISTREMENT**

### **Préparation**
1. **Environnement calme** sans bruit de fond
2. **Microphone correct** (smartphone récent acceptable)
3. **Distance :** 15-20 cm du micro
4. **Position :** Debout ou assis droit

### **Technique**
1. **Lire le script** plusieurs fois avant d'enregistrer
2. **Respirer** profondément avant de commencer
3. **Parler lentement** - plus lent que d'habitude
4. **Articuler** chaque mot clairement
5. **Faire des pauses** courtes entre les phrases
6. **Sourire** en parlant (s'entend dans la voix)

### **Exemple de Rythme**
```
"Bonjour ami agriculteur ! [pause] Bonjour !
[pause courte]
Je suis PestAlert, [pause] ton assistant pour les cultures.
[pause courte]
Envoie-moi une photo de ton plant.
[pause]
Je vais te dire s'il va bien."
```

---

## 🔧 **OUTILS RECOMMANDÉS**

### **Enregistrement**
- **Audacity** (gratuit) : https://www.audacityteam.org/
- **Smartphone** avec app d'enregistrement de qualité
- **Micro USB** basique si disponible

### **Post-Production**
1. **Supprimer les bruits** de fond
2. **Normaliser le volume** (-3dB max)
3. **Exporter en MP3** 64 kbps
4. **Vérifier la taille** < 200 KB

---

## ✅ **CHECKLIST QUALITÉ**

### **Audio Technique**
- [ ] Pas de bruit de fond
- [ ] Volume constant
- [ ] Pas de saturation
- [ ] Format MP3 64 kbps
- [ ] Taille < 200 KB
- [ ] Durée respectée

### **Qualité Vocale**
- [ ] Débit approprié (120 mots/min)
- [ ] Articulation claire
- [ ] Ton chaleureux
- [ ] Pauses bien placées
- [ ] Message compréhensible

### **Test Utilisateur**
- [ ] Compréhension immédiate
- [ ] Réaction positive
- [ ] Pas de confusion
- [ ] Envie d'écouter jusqu'au bout

---

## 📱 **TEST SUR WHATSAPP**

### **Avant Intégration**
1. **Envoyer les audios** via WhatsApp à quelques personnes
2. **Tester sur différents appareils** (Android/iPhone)
3. **Vérifier la qualité** de lecture
4. **Demander feedback** sur la compréhension

### **Critères de Validation**
- ✅ Audio clair sur smartphone basique
- ✅ Compréhension immédiate du message
- ✅ Ton perçu comme amical et professionnel
- ✅ Durée appropriée (pas trop long)

---

## 🚀 **INTÉGRATION DANS LE BOT**

### **Nommage des Fichiers**
```
audio/fr_simple/
├── welcome_simple.mp3
├── healthy_simple.mp3
├── diseased_simple.mp3
├── critical_simple.mp3
├── unclear_simple.mp3
└── analyzing_simple.mp3
```

### **Test d'Intégration**
1. **Placer les fichiers** dans le dossier `audio/fr_simple/`
2. **Redémarrer le bot** avec `SIMPLIFIED_MODE=true`
3. **Tester le workflow** complet :
   - Dire "salut" → Audio bienvenue
   - Envoyer photo → Audio analyse + résultat
   - Vérifier tous les cas d'usage

---

## 📊 **MÉTRIQUES À SURVEILLER**

### **Phase 0 Test**
- **Taux de compréhension** : >95%
- **Satisfaction utilisateur** : >70%
- **Taux d'abandon** : <30%
- **Feedback positif** : >80%

### **Indicateurs Techniques**
- **Temps de chargement** audio : <2s
- **Qualité de lecture** : Aucun problème
- **Compatibilité** : Tous appareils testés

---

## 🎯 **PROCHAINES ÉTAPES**

1. **Enregistrer les 6 audios** selon ces spécifications
2. **Tester la qualité** sur WhatsApp
3. **Intégrer dans le bot** Phase 0
4. **Valider avec utilisateurs** pilotes (5-10 personnes)
5. **Ajuster selon feedback** avant Phase 1

**🚀 Ces audios sont la base de votre transformation vers un bot accessible ! Prenez le temps de bien les faire.**
