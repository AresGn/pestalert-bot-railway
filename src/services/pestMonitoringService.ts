import { CropHealthService } from './cropHealthService';
import { ImageProcessingService } from './imageProcessingService';
import { LoggingService } from './loggingService';
import { ErrorHandlingService } from './errorHandlingService';
import { AudioService } from './audioService';
import {
  CONFIDENCE_THRESHOLDS,
  determineConfidenceLevel,
  generateReasoningText,
  AlertDecisionWithConfidence
} from '../config/confidenceThresholds';
import {
  FarmerData,
  AnalysisResponse,
  AlertDecision,
  BinaryAnalysisResult,
  MultiClassAnalysisResult,
  WeatherAnalysis
} from '../types';

/**
 * Service principal d'orchestration pour le monitoring des parasites
 */
export class PestMonitoringService {
  private cropHealth: CropHealthService;
  private imageProcessing: ImageProcessingService;
  private logger: LoggingService;
  private errorHandler: ErrorHandlingService;
  private audioService: AudioService;

  constructor() {
    this.cropHealth = new CropHealthService();
    this.imageProcessing = new ImageProcessingService();
    this.logger = new LoggingService();
    this.errorHandler = new ErrorHandlingService();
    this.audioService = new AudioService();
  }

  /**
   * Gérer l'analyse complète d'une image
   */
  async handleImageAnalysis(imageBuffer: Buffer, farmerData: FarmerData): Promise<AnalysisResponse> {
    const { location, phone, subscription } = farmerData;

    try {
      this.logger.logBotActivity(phone, 'Début de l\'analyse d\'image', { location, subscription });
      console.log(`🔍 Début de l'analyse pour ${phone}`);

      // 1. Validation et prétraitement de l'image
      const imageOptimization = await this.imageProcessing.optimizeForAnalysis(imageBuffer);
      if (!imageOptimization.success) {
        this.logger.logImageValidationError(phone, imageOptimization.error || 'Erreur de validation inconnue');
        throw new Error(`Image invalide: ${imageOptimization.error}`);
      }

      this.logger.logBotActivity(phone, 'Image validée et prétraitée', {
        originalSize: imageOptimization.metadata
      });
      console.log('✅ Image validée et prétraitée');

      // 2. Analyse de l'image avec OpenEPI
      const [binaryResult, multiClassResult] = await Promise.all([
        this.cropHealth.analyzeBinaryHealth(imageOptimization.processedImage!, { location }),
        this.cropHealth.analyzeMultiClass(imageOptimization.processedImage!)
      ]);

      console.log('✅ Analyse OpenEPI terminée');
      console.log(`📊 Résultat binaire: ${binaryResult.prediction} (${(binaryResult.confidence * 100).toFixed(1)}%)`);
      console.log(`📊 Top prédiction: ${multiClassResult.top_prediction.disease} (${(multiClassResult.top_prediction.confidence * 100).toFixed(1)}%)`);

      // 3. Analyse météorologique simulée (à remplacer par vraie API météo)
      const weatherAnalysis = this.simulateWeatherAnalysis(location);

      // 4. Décision d'alerte
      const alertDecision = this.shouldAlert(
        binaryResult, 
        multiClassResult, 
        weatherAnalysis,
        subscription || 'basic'
      );

      console.log(`🚨 Niveau d'alerte: ${alertDecision.critical ? 'CRITIQUE' : alertDecision.preventive ? 'PRÉVENTIVE' : 'NORMALE'}`);

      const analysisResponse = {
        analysis: {
          crop_health: { binaryResult, multiClassResult },
          weather: weatherAnalysis,
          alert: alertDecision
        },
        timestamp: new Date().toISOString()
      };

      // Logger le succès de l'analyse avec informations de confiance
      this.logger.logImageAnalysis(phone, true, analysisResponse);

      // Logger détaillé selon le type d'alerte
      if (alertDecision.critical) {
        this.logger.logCriticalAlert(phone, {
          ...alertDecision,
          confidenceInfo: `Binary: ${(alertDecision.binaryConfidence * 100).toFixed(1)}%, Top: ${(alertDecision.topPredictionConfidence * 100).toFixed(1)}%`
        });
        console.log(`🚨 CRITICAL ALERT: ${alertDecision.reasoning}`);
      } else if (alertDecision.uncertain) {
        this.logger.logBotActivity(phone, 'Uncertain detection - low confidence', {
          confidenceLevel: alertDecision.confidenceLevel,
          binaryConfidence: alertDecision.binaryConfidence,
          topPredictionConfidence: alertDecision.topPredictionConfidence,
          reasoning: alertDecision.reasoning
        });
        console.log(`❓ UNCERTAIN: ${alertDecision.reasoning}`);
      } else {
        console.log(`✅ NORMAL: ${alertDecision.reasoning}`);
      }

      return analysisResponse;

    } catch (error: any) {
      console.error('❌ Erreur lors de l\'analyse:', error.message);

      // Logger l'erreur
      this.logger.logImageAnalysis(phone, false, undefined, error.message);

      // Gérer l'erreur avec le service approprié
      if (error.message.includes('Image invalide')) {
        throw new Error(this.errorHandler.handleValidationError(error, {
          userId: phone,
          action: 'IMAGE_ANALYSIS'
        }));
      } else {
        throw new Error(this.errorHandler.handleImageAnalysisError(error, {
          userId: phone,
          action: 'IMAGE_ANALYSIS',
          service: 'CROP_HEALTH'
        }));
      }
    }
  }

  /**
   * Déterminer si une alerte doit être envoyée avec seuils de confiance
   */
  private shouldAlert(
    binaryResult: BinaryAnalysisResult,
    multiClassResult: MultiClassAnalysisResult,
    weatherAnalysis: WeatherAnalysis,
    subscription: string
  ): AlertDecisionWithConfidence {
    const binaryConfidence = binaryResult.confidence;
    const topPredictionConfidence = multiClassResult.top_prediction.confidence;
    const topPredictionDisease = multiClassResult.top_prediction.disease;

    // Déterminer le niveau de confiance
    const confidenceLevel = determineConfidenceLevel(binaryConfidence, topPredictionConfidence);

    // Générer le raisonnement
    const reasoning = generateReasoningText(
      binaryConfidence,
      topPredictionConfidence,
      topPredictionDisease,
      confidenceLevel
    );

    const decision: AlertDecisionWithConfidence = {
      critical: false,
      preventive: false,
      uncertain: false,
      message: '',
      actions: [],
      confidenceLevel,
      binaryConfidence,
      topPredictionConfidence,
      reasoning
    };

    // Logique basée sur les seuils de confiance
    switch (confidenceLevel) {
      case 'HIGH':
        // Confiance élevée - Alerte critique
        decision.critical = true;
        decision.message = `🚨 *HIGH CONFIDENCE DETECTION*

📊 Confidence Level: ${(Math.max(binaryConfidence, topPredictionConfidence) * 100).toFixed(1)}%
🦠 Detected Issue: ${topPredictionDisease}
🔬 Analysis: ${reasoning}

⚡ *Immediate Actions Required:*
[1] 🆘 Urgent intervention needed
[2] 📞 Contact agricultural expert
[3] 🛒 Prepare treatment immediately`;

        decision.actions = ['urgent_intervention', 'expert_call', 'order_treatment'];
        break;

      case 'MEDIUM':
        // Confiance moyenne - Réponse préventive
        decision.preventive = true;
        decision.message = `⚠️ *MODERATE CONFIDENCE DETECTION*

📊 Confidence Level: ${(Math.max(binaryConfidence, topPredictionConfidence) * 100).toFixed(1)}%
🦠 Possible Issue: ${topPredictionDisease}
🔬 Analysis: ${reasoning}

💡 *Recommended Actions:*
[1] 🔍 Monitor crops daily
[2] 📱 Report any symptom changes
[3] 🛡️ Consider preventive treatment`;

        decision.actions = ['daily_monitoring', 'report_symptoms', 'preventive_treatment'];
        break;

      case 'LOW':
        // Confiance faible - Réponse incertaine
        decision.uncertain = true;
        decision.message = `❓ *UNCERTAIN DETECTION*

📊 Confidence Level: ${(Math.max(binaryConfidence, topPredictionConfidence) * 100).toFixed(1)}%
🔬 Analysis: ${reasoning}

📷 *Please Retake Photo:*
[1] 🌞 Better lighting conditions
[2] 🔍 Clearer, closer image
[3] 📐 Focus on affected area`;

        decision.actions = ['retake_photo', 'improve_lighting', 'monitor_closely'];
        break;
    }

    return decision;
  }

  /**
   * Générer une réponse normale avec recommandations
   */
  private generateNormalResponse(binaryResult: BinaryAnalysisResult, multiClassResult: MultiClassAnalysisResult): string {
    const healthStatus = binaryResult.prediction === 'healthy' ? '✅ SAINE' : '⚠️ ATTENTION REQUISE';
    const confidence = (binaryResult.confidence * 100).toFixed(1);
    const topDisease = multiClassResult.top_prediction.disease;
    const diseaseConfidence = (multiClassResult.top_prediction.confidence * 100).toFixed(1);

    return `🌾 *Résultats d'analyse PestAlert*

📊 **État général:** ${healthStatus}
🔍 **Confiance:** ${confidence}%

🦠 **Analyse détaillée:**
• Problème principal détecté: ${topDisease}
• Niveau de confiance: ${diseaseConfidence}%
• Niveau de risque: ${multiClassResult.top_prediction.risk_level}

💡 **Recommandations:**
${this.generateRecommendations(multiClassResult)}

📞 Contactez un expert si les symptômes persistent.`;
  }

  /**
   * Générer des recommandations basées sur l'analyse
   */
  private generateRecommendations(multiClassResult: MultiClassAnalysisResult): string {
    const riskLevel = multiClassResult.top_prediction.risk_level;
    const disease = multiClassResult.top_prediction.disease.toLowerCase();

    let recommendations = '';

    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      recommendations += '• 🚨 Traitement immédiat recommandé\n';
      recommendations += '• 🔬 Consulter un expert agricole\n';
      recommendations += '• 🚫 Isoler les plants affectés\n';
    } else if (riskLevel === 'MEDIUM') {
      recommendations += '• 👀 Surveillance accrue recommandée\n';
      recommendations += '• 🛡️ Traitement préventif possible\n';
      recommendations += '• 📊 Surveiller l\'évolution\n';
    } else {
      recommendations += '• ✅ Continuer la surveillance régulière\n';
      recommendations += '• 🌱 Maintenir les bonnes pratiques\n';
      recommendations += '• 💧 Optimiser l\'arrosage et la ventilation\n';
    }

    // Recommandations spécifiques par maladie
    if (disease.includes('faw') || disease.includes('armyworm')) {
      recommendations += '• 🦗 Vérifier la présence de chenilles\n';
      recommendations += '• 🌙 Traiter de préférence le soir\n';
    } else if (disease.includes('rust') || disease.includes('rouille')) {
      recommendations += '• 💨 Améliorer la ventilation\n';
      recommendations += '• 💧 Réduire l\'humidité\n';
    } else if (disease.includes('blight') || disease.includes('mildiou')) {
      recommendations += '• 🌡️ Contrôler la température\n';
      recommendations += '• 🍃 Éliminer les feuilles affectées\n';
    }

    return recommendations;
  }

  /**
   * Simulation d'analyse météorologique (à remplacer par vraie API)
   */
  private simulateWeatherAnalysis(location: any): WeatherAnalysis {
    // Simulation basique - à remplacer par l'intégration de l'API météo OpenEPI
    const randomRisk = Math.random();
    
    let alertLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (randomRisk > 0.8) alertLevel = 'CRITICAL';
    else if (randomRisk > 0.6) alertLevel = 'HIGH';
    else if (randomRisk > 0.4) alertLevel = 'MEDIUM';
    else alertLevel = 'LOW';

    return {
      current_risk: randomRisk,
      forecast_risk: Math.random(),
      alert_level: alertLevel,
      recommendations: [
        'Surveiller les conditions d\'humidité',
        'Vérifier les prévisions météorologiques',
        'Adapter les pratiques d\'irrigation'
      ]
    };
  }

  /**
   * Obtenir la réponse audio appropriée selon le type d'alerte et la confiance
   */
  async getAudioResponse(alertDecision: AlertDecisionWithConfidence): Promise<any> {
    if (alertDecision.critical) {
      console.log(`🚨 Sending CRITICAL alert audio (confidence: ${(alertDecision.topPredictionConfidence * 100).toFixed(1)}%)`);
      return await this.audioService.getAlertAudio();
    } else if (alertDecision.uncertain) {
      console.log(`❓ Sending UNCERTAIN response audio (confidence: ${(Math.max(alertDecision.binaryConfidence, alertDecision.topPredictionConfidence) * 100).toFixed(1)}%)`);
      return await this.audioService.getUncertainAudio();
    } else {
      console.log(`✅ Sending NORMAL response audio (confidence: ${(alertDecision.topPredictionConfidence * 100).toFixed(1)}%)`);
      return await this.audioService.getNormalResponseAudio();
    }
  }

  /**
   * Obtenir la note vocale normale (pour les cas de fallback)
   */
  async getNormalAudioResponse(): Promise<any> {
    return await this.audioService.getNormalResponseAudio();
  }

  /**
   * Vérifier le statut des services
   */
  async checkServicesStatus(): Promise<{ cropHealth: any; imageProcessing: boolean; audioFiles: any }> {
    try {
      const cropHealthStatus = await this.cropHealth.checkStatus();
      const audioFilesStatus = this.audioService.checkAudioFiles();

      return {
        cropHealth: cropHealthStatus,
        imageProcessing: true, // Le service d'image processing est toujours disponible localement
        audioFiles: audioFilesStatus
      };
    } catch (error) {
      return {
        cropHealth: { status: 'error', error: (error as Error).message },
        imageProcessing: true,
        audioFiles: { available: false, missing: ['Erreur lors de la vérification'] }
      };
    }
  }
}
