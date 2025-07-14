import { ConfidenceLevel, ConfidenceInterval, AnalysisQuality } from '../types';

/**
 * Service pour analyser les niveaux de confiance et déterminer les réponses appropriées
 */
export class ConfidenceAnalysisService {
  
  // Configuration des intervalles de confiance
  private confidenceIntervals: ConfidenceInterval[] = [
    {
      level: 'very_low',
      min: 0,
      max: 0.25,
      description: 'Confiance très faible - Résultats incertains',
      audio_file: 'CropIncertaine_TresFaible.mp3',
      recommendations: [
        'Reprendre une photo avec un meilleur éclairage',
        'Photographier une zone différente de la culture',
        'Consulter un expert agricole pour confirmation',
        'Surveiller attentivement l\'évolution'
      ]
    },
    {
      level: 'low',
      min: 0.25,
      max: 0.50,
      description: 'Confiance faible - Analyse préliminaire',
      audio_file: 'CropIncertaine_Faible.mp3',
      recommendations: [
        'Prendre des photos supplémentaires sous différents angles',
        'Documenter les symptômes observés',
        'Surveiller quotidiennement l\'évolution',
        'Préparer une consultation avec un expert'
      ]
    },
    {
      level: 'medium',
      min: 0.50,
      max: 0.75,
      description: 'Confiance moyenne - Résultats probables',
      audio_file: 'CropMoyenne.mp3',
      recommendations: [
        'Résultats probablement fiables',
        'Surveiller l\'évolution sur 2-3 jours',
        'Appliquer les mesures préventives recommandées',
        'Documenter les changements observés'
      ]
    },
    {
      level: 'high',
      min: 0.75,
      max: 0.90,
      description: 'Confiance élevée - Résultats fiables',
      audio_file: 'CropSains.mp3', // ou CropMalade.mp3 selon le cas
      recommendations: [
        'Résultats fiables',
        'Suivre les recommandations spécifiques',
        'Surveillance régulière recommandée',
        'Partager les résultats avec votre conseiller agricole'
      ]
    },
    {
      level: 'very_high',
      min: 0.90,
      max: 1.0,
      description: 'Confiance très élevée - Résultats très fiables',
      audio_file: 'CropSains.mp3', // ou CropMalade.mp3 selon le cas
      recommendations: [
        'Résultats très fiables',
        'Agir selon les recommandations spécifiques',
        'Surveillance standard suffisante',
        'Excellent exemple pour documentation'
      ]
    }
  ];

  /**
   * Déterminer le niveau de confiance basé sur le score
   */
  getConfidenceLevel(confidence: number): ConfidenceLevel {
    for (const interval of this.confidenceIntervals) {
      if (confidence >= interval.min && confidence < interval.max) {
        return interval.level;
      }
    }
    // Cas limite pour 1.0
    if (confidence === 1.0) {
      return 'very_high';
    }
    return 'very_low';
  }

  /**
   * Obtenir l'intervalle de confiance complet
   */
  getConfidenceInterval(confidence: number): ConfidenceInterval {
    const level = this.getConfidenceLevel(confidence);
    return this.confidenceIntervals.find(interval => interval.level === level)!;
  }

  /**
   * Déterminer la qualité de l'analyse basée sur plusieurs facteurs
   */
  determineAnalysisQuality(
    binaryConfidence: number,
    topDiseaseConfidence: number,
    imageQuality?: string,
    processingTime?: number
  ): AnalysisQuality {
    let qualityScore = 0;

    // Score basé sur la confiance binaire (40% du score)
    qualityScore += binaryConfidence * 0.4;

    // Score basé sur la confiance de la top prédiction (30% du score)
    qualityScore += topDiseaseConfidence * 0.3;

    // Score basé sur la qualité de l'image (20% du score)
    if (imageQuality) {
      const imageQualityScore = {
        'poor': 0.2,
        'fair': 0.5,
        'good': 0.8,
        'excellent': 1.0
      }[imageQuality] || 0.5;
      qualityScore += imageQualityScore * 0.2;
    } else {
      qualityScore += 0.5 * 0.2; // Score neutre si pas d'info
    }

    // Score basé sur le temps de traitement (10% du score)
    if (processingTime) {
      // Temps optimal entre 1-3 secondes
      const timeScore = processingTime <= 3 ? 1.0 : Math.max(0.3, 3 / processingTime);
      qualityScore += timeScore * 0.1;
    } else {
      qualityScore += 0.5 * 0.1; // Score neutre si pas d'info
    }

    // Convertir le score en qualité
    if (qualityScore >= 0.85) return 'excellent';
    if (qualityScore >= 0.70) return 'good';
    if (qualityScore >= 0.50) return 'fair';
    return 'poor';
  }

  /**
   * Calculer l'écart de confiance entre les prédictions
   */
  calculateConfidenceSpread(predictions: Array<{ confidence: number }>): number {
    if (predictions.length < 2) return 0;
    
    const confidences = predictions.map(p => p.confidence).sort((a, b) => b - a);
    return confidences[0] - confidences[1]; // Écart entre top 2 prédictions
  }

  /**
   * Évaluer la cohérence entre les prédictions
   */
  calculatePredictionConsistency(
    binaryConfidence: number,
    topDiseaseConfidence: number,
    binaryPrediction: 'healthy' | 'diseased'
  ): number {
    // Si binaire dit "sain" mais maladie détectée avec forte confiance = incohérent
    if (binaryPrediction === 'healthy' && topDiseaseConfidence > 0.7) {
      return Math.max(0, 1 - topDiseaseConfidence);
    }
    
    // Si binaire dit "malade" mais confiance faible sur maladie spécifique = incohérent
    if (binaryPrediction === 'diseased' && topDiseaseConfidence < 0.3) {
      return Math.max(0, topDiseaseConfidence);
    }
    
    // Sinon, cohérence basée sur la moyenne des confiances
    return (binaryConfidence + topDiseaseConfidence) / 2;
  }

  /**
   * Générer des recommandations basées sur le niveau de confiance
   */
  generateRecommendations(
    confidenceLevel: ConfidenceLevel,
    isHealthy: boolean,
    topDisease?: string
  ): { immediate: string[]; short_term: string[]; monitoring: string[] } {
    const interval = this.confidenceIntervals.find(i => i.level === confidenceLevel)!;
    
    const recommendations = {
      immediate: [...interval.recommendations],
      short_term: [] as string[],
      monitoring: [] as string[]
    };

    // Recommandations spécifiques selon le résultat
    if (isHealthy) {
      if (confidenceLevel === 'high' || confidenceLevel === 'very_high') {
        recommendations.short_term.push(
          'Maintenir les pratiques culturales actuelles',
          'Continuer la surveillance préventive'
        );
        recommendations.monitoring.push(
          'Inspection hebdomadaire recommandée',
          'Documenter les bonnes pratiques'
        );
      } else {
        recommendations.short_term.push(
          'Renforcer la surveillance',
          'Vérifier les conditions environnementales'
        );
        recommendations.monitoring.push(
          'Inspection quotidienne pendant 1 semaine',
          'Prendre des photos de suivi'
        );
      }
    } else {
      // Culture malade
      if (confidenceLevel === 'high' || confidenceLevel === 'very_high') {
        recommendations.immediate.push(
          'Isoler la zone affectée si possible',
          'Consulter immédiatement un expert agricole'
        );
        recommendations.short_term.push(
          'Appliquer le traitement recommandé',
          'Surveiller la propagation'
        );
      } else {
        recommendations.immediate.push(
          'Prendre des photos supplémentaires',
          'Documenter tous les symptômes visibles'
        );
        recommendations.short_term.push(
          'Obtenir une seconde opinion',
          'Préparer un plan d\'intervention'
        );
      }
      
      recommendations.monitoring.push(
        'Surveillance quotidienne obligatoire',
        'Documenter l\'évolution des symptômes',
        'Mesurer l\'étendue de la zone affectée'
      );
    }

    return recommendations;
  }

  /**
   * Évaluer le niveau de risque
   */
  assessRiskLevel(
    isHealthy: boolean,
    confidenceLevel: ConfidenceLevel,
    topDiseaseConfidence: number,
    topDisease?: string
  ): { level: 'minimal' | 'low' | 'moderate' | 'high' | 'critical'; factors: string[]; urgency: 'none' | 'low' | 'medium' | 'high' | 'immediate' } {
    const factors: string[] = [];
    
    if (isHealthy) {
      if (confidenceLevel === 'high' || confidenceLevel === 'very_high') {
        return {
          level: 'minimal',
          factors: ['Culture en bonne santé avec forte confiance'],
          urgency: 'none'
        };
      } else {
        factors.push('Confiance modérée sur l\'état sain');
        return {
          level: 'low',
          factors,
          urgency: 'low'
        };
      }
    } else {
      // Culture malade
      factors.push(`Maladie détectée: ${topDisease || 'Non spécifiée'}`);
      factors.push(`Confiance: ${(topDiseaseConfidence * 100).toFixed(1)}%`);
      
      if (confidenceLevel === 'very_high' && topDiseaseConfidence > 0.9) {
        factors.push('Diagnostic très fiable');
        return {
          level: 'critical',
          factors,
          urgency: 'immediate'
        };
      } else if (confidenceLevel === 'high') {
        factors.push('Diagnostic fiable');
        return {
          level: 'high',
          factors,
          urgency: 'high'
        };
      } else if (confidenceLevel === 'medium') {
        factors.push('Diagnostic probable');
        return {
          level: 'moderate',
          factors,
          urgency: 'medium'
        };
      } else {
        factors.push('Diagnostic incertain');
        return {
          level: 'low',
          factors,
          urgency: 'low'
        };
      }
    }
  }

  /**
   * Obtenir le fichier audio approprié selon le niveau de confiance et le résultat
   */
  getAudioFile(confidenceLevel: ConfidenceLevel, isHealthy: boolean): string {
    const interval = this.getConfidenceInterval(
      confidenceLevel === 'very_low' ? 0.1 :
      confidenceLevel === 'low' ? 0.35 :
      confidenceLevel === 'medium' ? 0.6 :
      confidenceLevel === 'high' ? 0.8 : 0.95
    );

    // Pour les niveaux élevés, utiliser les fichiers spécifiques sain/malade
    if (confidenceLevel === 'high' || confidenceLevel === 'very_high') {
      return isHealthy ? 'CropSains.mp3' : 'CropMalade.mp3';
    }

    // Pour les autres niveaux, utiliser les fichiers spécifiques au niveau de confiance
    return interval.audio_file;
  }
}
