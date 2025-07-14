import { CropHealthService } from './cropHealthService';
import { AudioService } from './audioService';
import { ImageProcessingService } from './imageProcessingService';
import { LoggingService } from './loggingService';
import { ConfidenceAnalysisService } from './confidenceAnalysisService';
import { MessageMedia } from 'whatsapp-web.js';
import { DetailedHealthAnalysis, ConfidenceLevel, AnalysisQuality } from '../types';

export interface HealthAnalysisResult {
  isHealthy: boolean;
  confidence: number;
  audioMessage: MessageMedia | null;
  textMessage: string;
  recommendation?: string;
  detailedAnalysis?: DetailedHealthAnalysis;
  confidenceLevel?: ConfidenceLevel;
  analysisQuality?: AnalysisQuality;
}

/**
 * Service spécialisé pour l'analyse de santé des cultures (Option 1)
 */
export class HealthAnalysisService {
  private cropHealthService: CropHealthService;
  private audioService: AudioService;
  private imageProcessingService: ImageProcessingService;
  private logger: LoggingService;
  private confidenceAnalysisService: ConfidenceAnalysisService;

  constructor() {
    this.cropHealthService = new CropHealthService();
    this.audioService = new AudioService();
    this.imageProcessingService = new ImageProcessingService();
    this.logger = new LoggingService();
    this.confidenceAnalysisService = new ConfidenceAnalysisService();
  }

  /**
   * Analyser la santé d'une culture à partir d'une image avec analyse de confiance détaillée
   */
  async analyzeCropHealth(imageBuffer: Buffer, userId: string): Promise<HealthAnalysisResult> {
    try {
      console.log(`🌾 Début de l'analyse de santé avancée pour ${userId}`);

      // 1. Prétraitement de l'image
      const imageOptimization = await this.imageProcessingService.optimizeForAnalysis(imageBuffer);

      if (!imageOptimization.success) {
        return {
          isHealthy: false,
          confidence: 0,
          audioMessage: null,
          textMessage: `❌ Problème avec l'image: ${imageOptimization.error}\n\n📷 Veuillez envoyer une nouvelle photo plus claire.`,
          recommendation: "Améliorer la qualité de l'image"
        };
      }

      // 2. Analyses parallèles avec OpenEPI
      const [binaryResult, multiClassResult] = await Promise.all([
        this.cropHealthService.analyzeBinaryHealth(imageOptimization.processedImage!),
        this.cropHealthService.analyzeMultiClass(imageOptimization.processedImage!, { model: 'single-HLT' })
      ]);

      console.log(`📊 Résultat binaire: ${binaryResult.prediction} (${(binaryResult.confidence * 100).toFixed(1)}%)`);
      console.log(`📊 Top maladie: ${multiClassResult.top_prediction.disease} (${(multiClassResult.top_prediction.confidence * 100).toFixed(1)}%)`);

      // 3. Analyse de confiance détaillée
      const isHealthy = binaryResult.prediction === 'healthy';
      const confidenceLevel = this.confidenceAnalysisService.getConfidenceLevel(binaryResult.confidence);
      const analysisQuality = this.confidenceAnalysisService.determineAnalysisQuality(
        binaryResult.confidence,
        multiClassResult.top_prediction.confidence,
        binaryResult.image_quality,
        binaryResult.processing_time
      );

      // 4. Calculs de métriques avancées
      const confidenceSpread = this.confidenceAnalysisService.calculateConfidenceSpread(multiClassResult.all_predictions);
      const predictionConsistency = this.confidenceAnalysisService.calculatePredictionConsistency(
        binaryResult.confidence,
        multiClassResult.top_prediction.confidence,
        binaryResult.prediction
      );

      // 5. Générer les recommandations
      const recommendations = this.confidenceAnalysisService.generateRecommendations(
        confidenceLevel,
        isHealthy,
        multiClassResult.top_prediction.disease
      );

      // 6. Évaluation du risque
      const riskAssessment = this.confidenceAnalysisService.assessRiskLevel(
        isHealthy,
        confidenceLevel,
        multiClassResult.top_prediction.confidence,
        multiClassResult.top_prediction.disease
      );

      // 7. Créer l'analyse détaillée
      const detailedAnalysis: DetailedHealthAnalysis = {
        binary: binaryResult,
        multiClass: multiClassResult,
        confidence_level: confidenceLevel,
        analysis_quality: analysisQuality,
        confidence_interval: this.confidenceAnalysisService.getConfidenceInterval(binaryResult.confidence),
        detailed_metrics: {
          binary_confidence: binaryResult.confidence,
          top_disease_confidence: multiClassResult.top_prediction.confidence,
          confidence_spread: confidenceSpread,
          prediction_consistency: predictionConsistency
        },
        recommendations,
        risk_assessment: riskAssessment
      };

      // 8. Obtenir l'audio approprié selon le niveau de confiance
      const audioFile = this.confidenceAnalysisService.getAudioFile(confidenceLevel, isHealthy);
      let audioMessage: MessageMedia | null = null;

      try {
        audioMessage = await this.audioService.createAudioMessage(audioFile);
      } catch (audioError) {
        console.log(`⚠️ Fichier audio ${audioFile} non trouvé, utilisation du fallback`);
        // Fallback vers les fichiers existants
        if (isHealthy) {
          audioMessage = await this.audioService.getHealthyCropAudio();
        } else {
          audioMessage = await this.audioService.getDiseasedCropAudio();
        }
      }

      // 9. Générer le message texte détaillé
      const textMessage = this.generateDetailedHealthMessage(detailedAnalysis);

      // 10. Logger l'analyse complète
      this.logger.logBotActivity(userId, 'Advanced Health Analysis', {
        prediction: binaryResult.prediction,
        confidence: binaryResult.confidence,
        confidence_level: confidenceLevel,
        analysis_quality: analysisQuality,
        top_disease: multiClassResult.top_prediction.disease,
        risk_level: riskAssessment.level,
        timestamp: new Date().toISOString()
      });

      return {
        isHealthy,
        confidence: binaryResult.confidence,
        audioMessage,
        textMessage,
        recommendation: this.generateAdvancedRecommendation(detailedAnalysis),
        detailedAnalysis,
        confidenceLevel,
        analysisQuality
      };

    } catch (error: any) {
      console.error('❌ Erreur lors de l\'analyse de santé avancée:', error.message);

      this.logger.logServiceError('ADVANCED_HEALTH_ANALYSIS', error.message, userId);

      return {
        isHealthy: false,
        confidence: 0,
        audioMessage: null,
        textMessage: "❌ Une erreur s'est produite lors de l'analyse avancée. Veuillez réessayer avec une nouvelle photo.",
        recommendation: "Réessayer l'analyse"
      };
    }
  }

  /**
   * Générer un message texte détaillé avec toutes les métriques
   */
  private generateDetailedHealthMessage(analysis: DetailedHealthAnalysis): string {
    const isHealthy = analysis.binary.prediction === 'healthy';
    const binaryConfidence = (analysis.binary.confidence * 100).toFixed(1);
    const topDiseaseConfidence = (analysis.multiClass.top_prediction.confidence * 100).toFixed(1);
    const consistencyScore = (analysis.detailed_metrics.prediction_consistency * 100).toFixed(1);

    const statusEmoji = isHealthy ? '✅' : '⚠️';
    const statusText = isHealthy ? 'CULTURE SAINE' : 'ATTENTION REQUISE';

    const confidenceLevelText = {
      'very_low': '🔴 Très Faible',
      'low': '🟠 Faible',
      'medium': '🟡 Moyenne',
      'high': '🟢 Élevée',
      'very_high': '💚 Très Élevée'
    }[analysis.confidence_level];

    const qualityText = {
      'poor': '🔴 Faible',
      'fair': '🟡 Correcte',
      'good': '🟢 Bonne',
      'excellent': '💚 Excellente'
    }[analysis.analysis_quality];

    const riskEmoji = {
      'minimal': '🟢',
      'low': '🟡',
      'moderate': '🟠',
      'high': '🔴',
      'critical': '🆘'
    }[analysis.risk_assessment.level];

    let message = `${statusEmoji} **${statusText}**

📊 **ANALYSE DÉTAILLÉE**
• 🎯 Diagnostic: ${isHealthy ? 'Saine' : analysis.multiClass.top_prediction.disease}
• 📈 Confiance binaire: ${binaryConfidence}%
• 🔬 Confiance diagnostic: ${topDiseaseConfidence}%
• 🎚️ Niveau de confiance: ${confidenceLevelText}
• 🖼️ Qualité d'analyse: ${qualityText}
• 🔄 Cohérence: ${consistencyScore}%

📋 **MÉTRIQUES TECHNIQUES**
• ⚡ Temps de traitement: ${analysis.binary.processing_time?.toFixed(2) || 'N/A'}s
• 🖼️ Qualité image: ${analysis.binary.image_quality || 'Inconnue'}
• 🧠 Modèle utilisé: ${analysis.multiClass.model_used || 'Standard'}
• 📊 Classes analysées: ${analysis.multiClass.total_classes || 'N/A'}

${riskEmoji} **ÉVALUATION DU RISQUE: ${analysis.risk_assessment.level.toUpperCase()}**
${analysis.risk_assessment.factors.map(factor => `• ${factor}`).join('\n')}

🎯 **RECOMMANDATIONS IMMÉDIATES**
${analysis.recommendations.immediate.map(rec => `• ${rec}`).join('\n')}`;

    if (analysis.recommendations.short_term.length > 0) {
      message += `\n\n📅 **ACTIONS À COURT TERME**
${analysis.recommendations.short_term.map(rec => `• ${rec}`).join('\n')}`;
    }

    if (analysis.recommendations.monitoring.length > 0) {
      message += `\n\n👁️ **SURVEILLANCE RECOMMANDÉE**
${analysis.recommendations.monitoring.map(rec => `• ${rec}`).join('\n')}`;
    }

    message += `\n\n⏰ **Analysé**: ${new Date().toLocaleString()}
💡 Tapez 'menu' pour revenir au menu principal`;

    return message;
  }

  /**
   * Générer le message texte simple (fallback)
   */
  private generateHealthMessage(isHealthy: boolean, confidence: number): string {
    const confidencePercent = (confidence * 100).toFixed(1);

    if (isHealthy) {
      return `✅ **CULTURE SAINE**

🌾 **Résultat**: Votre culture semble être en bonne santé
📊 **Confiance**: ${confidencePercent}%
⏰ **Analysé**: ${new Date().toLocaleString()}

🎯 **Recommandations**:
• Continuez vos pratiques actuelles
• Surveillez régulièrement l'évolution
• Maintenez les conditions optimales

💡 Tapez 'menu' pour revenir au menu principal`;
    } else {
      return `⚠️ **ATTENTION REQUISE**

🌾 **Résultat**: Votre culture nécessite une attention
📊 **Confiance**: ${confidencePercent}%
⏰ **Analysé**: ${new Date().toLocaleString()}

🚨 **Actions recommandées**:
• Examinez la culture de plus près
• Consultez un expert agricole si nécessaire
• Surveillez l'évolution quotidiennement
• Envisagez un traitement préventif

💡 Tapez 'menu' pour revenir au menu principal`;
    }
  }

  /**
   * Générer des recommandations avancées basées sur l'analyse détaillée
   */
  private generateAdvancedRecommendation(analysis: DetailedHealthAnalysis): string {
    const urgencyText = {
      'none': 'Aucune action urgente',
      'low': 'Surveillance recommandée',
      'medium': 'Action dans les 24-48h',
      'high': 'Action dans les 12h',
      'immediate': 'Action immédiate requise'
    }[analysis.risk_assessment.urgency];

    return `${urgencyText} - Confiance ${analysis.confidence_level} (${(analysis.binary.confidence * 100).toFixed(1)}%)`;
  }

  /**
   * Générer des recommandations selon le résultat (méthode simple pour compatibilité)
   */
  private generateRecommendation(isHealthy: boolean, confidence: number): string {
    if (isHealthy) {
      if (confidence > 0.8) {
        return "Culture en excellente santé - continuez vos pratiques";
      } else {
        return "Culture saine mais surveillez l'évolution";
      }
    } else {
      if (confidence > 0.8) {
        return "Problème détecté avec forte confiance - action immédiate recommandée";
      } else {
        return "Problème potentiel détecté - surveillance renforcée recommandée";
      }
    }
  }

  /**
   * Vérifier le statut du service
   */
  async checkServiceStatus(): Promise<{ status: string; error?: string }> {
    try {
      const cropHealthStatus = await this.cropHealthService.checkStatus();
      const audioStatus = this.audioService.checkAudioFiles();
      
      if (cropHealthStatus.status !== 'healthy') {
        return {
          status: 'error',
          error: 'Service OpenEPI non disponible'
        };
      }
      
      if (!audioStatus.available) {
        return {
          status: 'warning',
          error: `Fichiers audio manquants: ${audioStatus.missing.join(', ')}`
        };
      }
      
      return { status: 'healthy' };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}
