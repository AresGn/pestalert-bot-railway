/**
 * Configuration des seuils de confiance pour les réponses du bot
 */

export interface ConfidenceThresholds {
  high: number;      // Seuil pour alerte critique
  medium: number;    // Seuil pour réponse normale
  low: number;       // En dessous = réponse incertaine
}

export const CONFIDENCE_THRESHOLDS: ConfidenceThresholds = {
  high: 0.70,    // 70% - Alerte critique
  medium: 0.30,  // 30% - Réponse normale
  low: 0.30      // <30% - Réponse incertaine
};

export interface AlertDecisionWithConfidence {
  critical: boolean;
  preventive: boolean;
  uncertain: boolean;
  message: string;
  actions: string[];
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  binaryConfidence: number;
  topPredictionConfidence: number;
  reasoning: string;
}

/**
 * Déterminer le niveau de confiance basé sur les seuils
 */
export function determineConfidenceLevel(
  binaryConfidence: number, 
  topPredictionConfidence: number
): 'HIGH' | 'MEDIUM' | 'LOW' {
  // Prendre la confiance la plus élevée entre binaire et prédiction principale
  const maxConfidence = Math.max(binaryConfidence, topPredictionConfidence);
  
  if (maxConfidence >= CONFIDENCE_THRESHOLDS.high) {
    return 'HIGH';
  } else if (maxConfidence >= CONFIDENCE_THRESHOLDS.medium) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

/**
 * Générer le raisonnement pour la décision
 */
export function generateReasoningText(
  binaryConfidence: number,
  topPredictionConfidence: number,
  topPredictionDisease: string,
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW'
): string {
  const maxConfidence = Math.max(binaryConfidence, topPredictionConfidence);
  
  switch (confidenceLevel) {
    case 'HIGH':
      return `High confidence detection (${(maxConfidence * 100).toFixed(1)}%) of ${topPredictionDisease}. Immediate action recommended.`;
    
    case 'MEDIUM':
      return `Moderate confidence detection (${(maxConfidence * 100).toFixed(1)}%) of ${topPredictionDisease}. Monitoring and preventive measures advised.`;
    
    case 'LOW':
      return `Low confidence detection (${(maxConfidence * 100).toFixed(1)}%). Image quality or lighting may be insufficient for accurate diagnosis.`;
    
    default:
      return 'Unknown confidence level';
  }
}
