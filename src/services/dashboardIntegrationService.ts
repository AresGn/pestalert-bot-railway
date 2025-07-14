import { DashboardDataService } from '@pestalert/core/src/services/dashboardDataService';
import { LogEntry } from './loggingService';

/**
 * Service d'intégration pour envoyer les données du bot vers le dashboard
 */
export class DashboardIntegrationService {
  private dashboardService: DashboardDataService;
  private isEnabled: boolean;

  constructor() {
    this.dashboardService = new DashboardDataService();
    this.isEnabled = process.env.DASHBOARD_INTEGRATION_ENABLED !== 'false';
    
    if (this.isEnabled) {
      console.log('📊 Dashboard Integration Service activé');
    } else {
      console.log('📊 Dashboard Integration Service désactivé');
    }
  }

  /**
   * Enregistrer une nouvelle session utilisateur
   */
  async recordUserSession(userId: string, userPhone: string, userName?: string, location?: any) {
    if (!this.isEnabled) return;

    try {
      await this.dashboardService.recordBotSession(userId, userPhone, userName, location);
      console.log(`📊 Session enregistrée pour ${userPhone}`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de session:', error);
    }
  }

  /**
   * Enregistrer une analyse d'image
   */
  async recordImageAnalysis(data: {
    userId: string;
    userPhone: string;
    analysisType: 'health' | 'pest' | 'alert';
    success: boolean;
    isHealthy?: boolean;
    confidence?: number;
    topDisease?: string;
    processingTime?: number;
    imageQuality?: string;
    errorMessage?: string;
    alertLevel?: 'NORMAL' | 'PREVENTIVE' | 'CRITICAL';
    location?: any;
  }) {
    if (!this.isEnabled) return;

    try {
      await this.dashboardService.recordImageAnalysis(data);
      console.log(`📊 Analyse enregistrée: ${data.analysisType} - ${data.success ? 'Succès' : 'Échec'}`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement d\'analyse:', error);
    }
  }

  /**
   * Enregistrer une métrique système
   */
  async recordSystemMetric(service: string, metric: string, value: number, unit?: string, metadata?: any) {
    if (!this.isEnabled) return;

    try {
      await this.dashboardService.recordSystemMetric(service, metric, value, unit, metadata);
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de métrique:', error);
    }
  }

  /**
   * Enregistrer les métriques de performance du bot
   */
  async recordBotPerformanceMetrics() {
    if (!this.isEnabled) return;

    try {
      // Métriques de mémoire
      const memoryUsage = process.memoryUsage();
      await this.recordSystemMetric('bot', 'memory_usage', memoryUsage.heapUsed / 1024 / 1024, 'MB');
      
      // Uptime
      await this.recordSystemMetric('bot', 'uptime', process.uptime(), 'seconds');
      
      // Disponibilité (toujours 100% si le bot fonctionne)
      await this.recordSystemMetric('bot', 'availability', 100, '%');
      
      console.log('📊 Métriques de performance du bot enregistrées');
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement des métriques de performance:', error);
    }
  }

  /**
   * Traiter un log d'activité du bot
   */
  async processActivityLog(logEntry: LogEntry) {
    if (!this.isEnabled) return;

    try {
      // Enregistrer dans la table des logs d'activité
      // Cette méthode sera implémentée dans le DashboardDataService
      console.log(`📊 Log traité: ${logEntry.category} - ${logEntry.level}`);
    } catch (error) {
      console.error('❌ Erreur lors du traitement du log:', error);
    }
  }

  /**
   * Enregistrer les métriques de service externe (OpenEPI)
   */
  async recordExternalServiceMetrics(service: string, responseTime: number, success: boolean) {
    if (!this.isEnabled) return;

    try {
      await this.recordSystemMetric(service, 'response_time', responseTime, 'ms');
      await this.recordSystemMetric(service, 'availability', success ? 100 : 0, '%');
      await this.recordSystemMetric(service, 'error_rate', success ? 0 : 100, '%');
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement des métriques de service externe:', error);
    }
  }

  /**
   * Démarrer la collecte périodique de métriques
   */
  startPeriodicMetricsCollection() {
    if (!this.isEnabled) return;

    // Collecter les métriques de performance toutes les 5 minutes
    setInterval(() => {
      this.recordBotPerformanceMetrics();
    }, 5 * 60 * 1000);

    console.log('📊 Collecte périodique de métriques démarrée (5 min)');
  }

  /**
   * Créer un wrapper pour les analyses d'image avec collecte automatique
   */
  wrapImageAnalysis<T>(
    analysisFunction: () => Promise<T>,
    metadata: {
      userId: string;
      userPhone: string;
      analysisType: 'health' | 'pest' | 'alert';
      location?: any;
    }
  ): Promise<T> {
    const startTime = Date.now();

    return analysisFunction()
      .then(async (result: any) => {
        const processingTime = (Date.now() - startTime) / 1000;

        // Extraire les informations du résultat pour l'enregistrement
        const analysisData = {
          ...metadata,
          success: true,
          processingTime,
          isHealthy: result.isHealthy,
          confidence: result.confidence || result.detailedAnalysis?.binary?.confidence,
          topDisease: result.detailedAnalysis?.multiClass?.top_prediction?.disease,
          imageQuality: result.detailedAnalysis?.binary?.image_quality,
          alertLevel: this.determineAlertLevel(result)
        };

        await this.recordImageAnalysis(analysisData);
        return result;
      })
      .catch(async (error) => {
        const processingTime = (Date.now() - startTime) / 1000;

        await this.recordImageAnalysis({
          ...metadata,
          success: false,
          processingTime,
          errorMessage: error.message
        });

        throw error;
      });
  }

  /**
   * Créer un wrapper pour les appels API externes avec collecte de métriques
   */
  wrapExternalApiCall<T>(
    apiFunction: () => Promise<T>,
    serviceName: string
  ): Promise<T> {
    const startTime = Date.now();

    return apiFunction()
      .then(async (result) => {
        const responseTime = Date.now() - startTime;
        await this.recordExternalServiceMetrics(serviceName, responseTime, true);
        return result;
      })
      .catch(async (error) => {
        const responseTime = Date.now() - startTime;
        await this.recordExternalServiceMetrics(serviceName, responseTime, false);
        throw error;
      });
  }

  /**
   * Déterminer le niveau d'alerte basé sur le résultat d'analyse
   */
  private determineAlertLevel(result: any): 'NORMAL' | 'PREVENTIVE' | 'CRITICAL' | undefined {
    if (result.detailedAnalysis?.alert) {
      if (result.detailedAnalysis.alert.critical) return 'CRITICAL';
      if (result.detailedAnalysis.alert.preventive) return 'PREVENTIVE';
    }
    return 'NORMAL';
  }

  /**
   * Obtenir les statistiques rapides pour le monitoring
   */
  async getQuickStats() {
    if (!this.isEnabled) return null;

    try {
      return await this.dashboardService.getDashboardMetrics();
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
      return null;
    }
  }

  /**
   * Fermer les connexions
   */
  async shutdown() {
    if (this.isEnabled) {
      await this.dashboardService.disconnect();
      console.log('📊 Dashboard Integration Service fermé');
    }
  }
}

// Instance singleton
export const dashboardIntegration = new DashboardIntegrationService();
