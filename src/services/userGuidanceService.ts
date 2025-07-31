/**
 * Service pour fournir des conseils et guidance aux utilisateurs
 * Spécialement conçu pour aider à prendre de meilleures photos agricoles
 */
export class UserGuidanceService {

  /**
   * Obtenir des conseils pour prendre de bonnes photos agricoles
   */
  getPhotoGuidance(): string {
    return `📸 **Guide pour de meilleures photos**\n\n` +
           `🎯 **Positionnement :**\n` +
           `• Tenez votre téléphone à 30-50 cm de la plante\n` +
           `• Centrez sur les feuilles et tiges\n` +
           `• Incluez les zones suspectes ou endommagées\n\n` +
           
           `☀️ **Éclairage :**\n` +
           `• Utilisez la lumière naturelle du jour\n` +
           `• Évitez les ombres fortes\n` +
           `• Pas de flash direct\n\n` +
           
           `🌱 **Contenu :**\n` +
           `• Montrez clairement les feuilles\n` +
           `• Incluez un peu de tige ou sol\n` +
           `• Évitez les photos trop éloignées\n\n` +
           
           `📱 **Qualité technique :**\n` +
           `• Tenez fermement le téléphone\n` +
           `• Attendez la mise au point\n` +
           `• Évitez les photos floues`;
  }

  /**
   * Obtenir des conseils spécifiques selon le type de culture
   */
  getCropSpecificGuidance(cropType?: string): string {
    const baseGuidance = this.getPhotoGuidance();
    
    if (!cropType) {
      return baseGuidance + '\n\n' + this.getSupportedCropsInfo();
    }

    const specificTips = this.getSpecificTips(cropType.toLowerCase());
    return baseGuidance + '\n\n' + specificTips;
  }

  /**
   * Obtenir des conseils spécifiques par culture
   */
  private getSpecificTips(cropType: string): string {
    const tips: { [key: string]: string } = {
      'maïs': `🌽 **Conseils pour le maïs :**\n` +
              `• Photographiez les feuilles du milieu\n` +
              `• Montrez les épis si présents\n` +
              `• Attention aux chenilles sur les feuilles`,
              
      'manioc': `🍠 **Conseils pour le manioc :**\n` +
                `• Concentrez-vous sur les feuilles palmées\n` +
                `• Montrez les tiges si elles semblent malades\n` +
                `• Vérifiez le dessous des feuilles`,
                
      'haricots': `🫘 **Conseils pour les haricots :**\n` +
                  `• Photographiez les feuilles trifoliées\n` +
                  `• Montrez les gousses si présentes\n` +
                  `• Attention aux taches sur les feuilles`,
                  
      'cacao': `🍫 **Conseils pour le cacao :**\n` +
               `• Photographiez les grandes feuilles\n` +
               `• Montrez les cabosses si malades\n` +
               `• Vérifiez les taches brunes`,
               
      'banane': `🍌 **Conseils pour la banane :**\n` +
                `• Photographiez les feuilles larges\n` +
                `• Montrez les régimes si présents\n` +
                `• Attention aux stries sur les feuilles`
    };

    return tips[cropType] || this.getSupportedCropsInfo();
  }

  /**
   * Information sur les cultures supportées
   */
  private getSupportedCropsInfo(): string {
    return `🌾 **Cultures supportées :**\n` +
           `• 🌽 Maïs (Zea mays)\n` +
           `• 🍠 Manioc (Manihot esculenta)\n` +
           `• 🫘 Haricots (Phaseolus vulgaris)\n` +
           `• 🍫 Cacao (Theobroma cacao)\n` +
           `• 🍌 Banane (Musa spp.)\n\n` +
           `💡 Pour d'autres cultures, contactez un expert local.`;
  }

  /**
   * Conseils pour les erreurs communes
   */
  getCommonErrorGuidance(): string {
    return `❌ **Erreurs à éviter :**\n\n` +
           `🚫 **Photos non-agricoles :**\n` +
           `• Pas de photos de maisons, voitures, personnes\n` +
           `• Pas de photos de nourriture préparée\n` +
           `• Pas de photos d'objets manufacturés\n\n` +
           
           `🚫 **Mauvaise qualité :**\n` +
           `• Évitez les photos trop sombres\n` +
           `• Pas de photos floues ou bougées\n` +
           `• Évitez les photos trop éloignées\n\n` +
           
           `🚫 **Mauvais cadrage :**\n` +
           `• Ne photographiez pas que le sol\n` +
           `• Évitez les photos avec trop de ciel\n` +
           `• Ne coupez pas les parties importantes`;
  }

  /**
   * Message d'encouragement après une erreur
   */
  getEncouragementMessage(): string {
    return `💪 **Pas de souci !**\n\n` +
           `🎯 Avec un peu de pratique, vous prendrez d'excellentes photos.\n\n` +
           `📚 **Rappel :** L'objectif est d'aider vos cultures à rester en bonne santé.\n\n` +
           `🤝 **Nous sommes là pour vous aider !**`;
  }

  /**
   * Obtenir un message d'aide contextuel selon l'erreur
   */
  getContextualHelp(errorType: string, confidence?: number): string {
    switch (errorType) {
      case 'NOT_AGRICULTURAL':
        return `🌾 **Image non-agricole détectée**\n\n` +
               this.getSupportedCropsInfo() + '\n\n' +
               this.getPhotoGuidance();
               
      case 'POOR_QUALITY':
        return `📷 **Qualité d'image insuffisante**\n\n` +
               this.getPhotoGuidance() + '\n\n' +
               this.getCommonErrorGuidance();
               
      case 'LOW_CONFIDENCE':
        const confidencePercent = confidence ? (confidence * 100).toFixed(1) : 'faible';
        return `📊 **Confiance d'analyse faible (${confidencePercent}%)**\n\n` +
               `💡 Pour améliorer la précision :\n\n` +
               this.getPhotoGuidance();
               
      default:
        return this.getCropSpecificGuidance();
    }
  }

  /**
   * Obtenir des exemples de bonnes vs mauvaises photos
   */
  getPhotoExamples(): string {
    return `✅ **Bonnes photos :**\n` +
           `• Feuilles vertes bien visibles\n` +
           `• Éclairage naturel uniforme\n` +
           `• Distance appropriée (30-50 cm)\n` +
           `• Mise au point nette\n` +
           `• Zones suspectes incluses\n\n` +
           
           `❌ **Photos à éviter :**\n` +
           `• Trop sombres ou surexposées\n` +
           `• Floues ou bougées\n` +
           `• Trop éloignées (plante minuscule)\n` +
           `• Que du sol ou du ciel\n` +
           `• Objets non-agricoles`;
  }

  /**
   * Message de félicitations pour une bonne photo
   */
  getSuccessMessage(confidence: number): string {
    const confidencePercent = (confidence * 100).toFixed(1);
    
    if (confidence > 0.9) {
      return `🎉 **Excellente photo !** (${confidencePercent}%)\n\n` +
             `✨ Qualité parfaite pour l'analyse.\n` +
             `🔍 Analyse en cours...`;
    } else if (confidence > 0.7) {
      return `👍 **Bonne photo !** (${confidencePercent}%)\n\n` +
             `✅ Qualité suffisante pour l'analyse.\n` +
             `🔍 Analyse en cours...`;
    } else {
      return `📷 **Photo acceptable** (${confidencePercent}%)\n\n` +
             `⚠️ Qualité correcte mais pourrait être améliorée.\n` +
             `🔍 Analyse en cours...`;
    }
  }

  /**
   * Obtenir des statistiques d'aide pour le monitoring
   */
  getGuidanceStats(): any {
    return {
      supportedCrops: ['maïs', 'manioc', 'haricots', 'cacao', 'banane'],
      errorTypes: ['NOT_AGRICULTURAL', 'POOR_QUALITY', 'LOW_CONFIDENCE'],
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    };
  }
}
