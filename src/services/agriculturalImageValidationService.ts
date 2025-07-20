import { ImageProcessingService } from './imageProcessingService';

/**
 * Interface pour le résultat de validation d'image agricole
 */
export interface AgriculturalValidationResult {
  isValid: boolean;
  confidence: number;
  reasons: string[];
  suggestion?: string;
  errorType?: 'NOT_AGRICULTURAL' | 'POOR_QUALITY' | 'TECHNICAL_ERROR';
}

/**
 * Service spécialisé pour valider que les images contiennent des cultures agricoles
 * Implémente la stratégie de filtrage pré-analyse pour éviter les faux positifs
 */
export class AgriculturalImageValidationService {
  private imageProcessingService: ImageProcessingService;
  
  // Seuils de configuration
  private readonly MIN_AGRICULTURAL_CONFIDENCE = 0.7; // Augmenté pour être plus strict
  private readonly MIN_GREEN_PERCENTAGE = 5;
  private readonly MIN_IMAGE_QUALITY_SCORE = 0.3;
  private readonly MAX_LAWN_CONFIDENCE = 0.8; // Nouveau seuil pour rejeter les pelouses

  // Mots-clés pour cultures supportées par OpenEPI
  private readonly SUPPORTED_CROPS = [
    'maïs', 'manioc', 'haricots', 'cacao', 'banane',
    'corn', 'cassava', 'beans', 'cocoa', 'banana'
  ];

  constructor() {
    this.imageProcessingService = new ImageProcessingService();
  }

  /**
   * Valider qu'une image contient des cultures agricoles appropriées
   * Point d'entrée principal pour le filtrage pré-analyse
   */
  async validateAgriculturalImage(imageBuffer: Buffer): Promise<AgriculturalValidationResult> {
    try {
      console.log('🔍 Début de la validation d\'image agricole...');

      // 1. Validation technique de base
      const basicValidation = await this.imageProcessingService.validateImage(imageBuffer);
      if (!basicValidation.valid) {
        return {
          isValid: false,
          confidence: 0,
          reasons: [basicValidation.error || 'Erreur de validation technique'],
          suggestion: 'Veuillez envoyer une image de meilleure qualité (JPEG, PNG, WebP)',
          errorType: 'POOR_QUALITY'
        };
      }

      // 2. Analyse du contenu agricole
      const agriculturalAnalysis = await this.imageProcessingService.analyzeAgriculturalContent(imageBuffer);
      
      console.log(`📊 Analyse agricole: ${agriculturalAnalysis.confidence.toFixed(2)} (${agriculturalAnalysis.isLikelyAgricultural ? 'VALIDE' : 'REJETÉ'})`);
      console.log(`📋 Raisons: ${agriculturalAnalysis.reasons.join(', ')}`);

      // 3. Décision de validation
      if (!agriculturalAnalysis.isLikelyAgricultural) {
        return {
          isValid: false,
          confidence: agriculturalAnalysis.confidence,
          reasons: agriculturalAnalysis.reasons,
          suggestion: this.generateNonAgriculturalSuggestion(agriculturalAnalysis),
          errorType: 'NOT_AGRICULTURAL'
        };
      }

      // 4. Validation de la qualité pour l'analyse
      const qualityCheck = this.assessImageQualityForAnalysis(agriculturalAnalysis);
      if (!qualityCheck.sufficient) {
        return {
          isValid: false,
          confidence: agriculturalAnalysis.confidence,
          reasons: qualityCheck.reasons,
          suggestion: qualityCheck.suggestion,
          errorType: 'POOR_QUALITY'
        };
      }

      // 5. Image validée
      return {
        isValid: true,
        confidence: agriculturalAnalysis.confidence,
        reasons: [
          'Image agricole détectée',
          ...agriculturalAnalysis.reasons
        ]
      };

    } catch (error: any) {
      console.error('❌ Erreur lors de la validation agricole:', error);
      return {
        isValid: false,
        confidence: 0,
        reasons: ['Erreur technique lors de la validation'],
        suggestion: 'Veuillez réessayer avec une autre image',
        errorType: 'TECHNICAL_ERROR'
      };
    }
  }

  /**
   * Générer un message d'aide pour les images non-agricoles
   */
  private generateNonAgriculturalSuggestion(analysis: any): string {
    const suggestions = [
      '📷 Prenez une photo rapprochée de vos cultures',
      '🌱 Assurez-vous que les feuilles des plantes sont visibles',
      '☀️ Utilisez un bon éclairage naturel',
      '🎯 Centrez sur les parties vertes de la plante'
    ];

    // Suggestions spécifiques selon l'analyse
    if (analysis.colorAnalysis?.greenPercentage < 2) {
      suggestions.unshift('🌿 L\'image doit contenir de la végétation verte');
    }

    return suggestions.slice(0, 3).join('\n');
  }

  /**
   * Évaluer si la qualité de l'image est suffisante pour l'analyse OpenEPI
   */
  private assessImageQualityForAnalysis(analysis: any): {
    sufficient: boolean;
    reasons: string[];
    suggestion?: string;
  } {
    const issues: string[] = [];

    // Vérifier la présence minimale de végétation
    if (analysis.colorAnalysis?.greenPercentage < this.MIN_GREEN_PERCENTAGE) {
      issues.push(`Végétation insuffisante (${analysis.colorAnalysis.greenPercentage.toFixed(1)}% < ${this.MIN_GREEN_PERCENTAGE}%)`);
    }

    // Vérifier la confiance globale
    if (analysis.confidence < this.MIN_AGRICULTURAL_CONFIDENCE) {
      issues.push(`Confiance trop faible (${(analysis.confidence * 100).toFixed(1)}%)`);
    }

    if (issues.length > 0) {
      return {
        sufficient: false,
        reasons: issues,
        suggestion: 'Prenez une photo plus rapprochée avec plus de végétation visible'
      };
    }

    return {
      sufficient: true,
      reasons: ['Qualité suffisante pour l\'analyse']
    };
  }

  /**
   * Obtenir des statistiques de validation pour le monitoring
   */
  getValidationStats(): any {
    return {
      minAgriculturalConfidence: this.MIN_AGRICULTURAL_CONFIDENCE,
      minGreenPercentage: this.MIN_GREEN_PERCENTAGE,
      supportedCrops: this.SUPPORTED_CROPS,
      version: '1.0.0'
    };
  }

  /**
   * Tester la validation avec une image de test
   */
  async testValidation(imageBuffer: Buffer): Promise<{
    validation: AgriculturalValidationResult;
    detailedAnalysis: any;
  }> {
    const validation = await this.validateAgriculturalImage(imageBuffer);
    const detailedAnalysis = await this.imageProcessingService.analyzeAgriculturalContent(imageBuffer);
    
    return {
      validation,
      detailedAnalysis
    };
  }
}
