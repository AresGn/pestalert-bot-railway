import { LogEntry } from './loggingService';

/**
 * Service d'intégration pour envoyer les données du bot vers le dashboard
 * Version simplifiée pour le déploiement Railway (sans dépendance Prisma)
 */
export class DashboardIntegrationService {
  private isEnabled: boolean;

  constructor() {
    // Désactiver par défaut pour le déploiement Railway
    this.isEnabled = process.env.DASHBOARD_INTEGRATION_ENABLED === 'true';

    if (this.isEnabled) {
      console.log('📊 Dashboard Integration Service activé');
    } else {
      console.log('📊 Dashboard Integration Service désactivé (version Railway)');
    }
  }

  /**
   * Enregistrer une nouvelle session utilisateur
   */
  async recordUserSession(userId: string, userPhone: string, userName?: string, location?: any) {
    if (!this.isEnabled) return;

    // Version simplifiée pour Railway - logging uniquement
    console.log(`📊 [Railway] Session utilisateur: ${userPhone} (${userId})`);
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

    // Version simplifiée pour Railway - logging uniquement
    console.log(`📊 [Railway] Analyse ${data.analysisType}: ${data.success ? 'Succès' : 'Échec'} - ${data.userPhone}`);
    if (data.confidence) console.log(`📊 [Railway] Confiance: ${data.confidence}%`);
  }

  /**
   * Enregistrer une métrique système
   */
  async recordSystemMetric(service: string, metric: string, value: number, unit?: string, metadata?: any) {
    if (!this.isEnabled) return;

    // Version simplifiée pour Railway - logging uniquement
    console.log(`📊 [Railway] Métrique ${service}.${metric}: ${value}${unit || ''}`);
  }

  /**
   * Enregistrer les métriques de performance du bot
   */
  async recordBotPerformanceMetrics() {
    if (!this.isEnabled) return;

    // Version simplifiée pour Railway - logging uniquement
    const memoryUsage = process.memoryUsage();
    await this.recordSystemMetric('bot', 'memory_usage', memoryUsage.heapUsed / 1024 / 1024, 'MB');
    await this.recordSystemMetric('bot', 'uptime', process.uptime(), 'seconds');
    await this.recordSystemMetric('bot', 'availability', 100, '%');

    console.log('📊 [Railway] Métriques de performance du bot enregistrées');
  }

  /**
   * Traiter un log d'activité du bot
   */
  async processActivityLog(logEntry: LogEntry) {
    if (!this.isEnabled) return;

    // Version simplifiée pour Railway - logging uniquement
    console.log(`📊 [Railway] Log traité: ${logEntry.category} - ${logEntry.level}`);
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

    console.log('📊 [Railway] Collecte périodique de métriques démarrée (5 min)');
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

    // Version simplifiée pour Railway - pas de données réelles
    console.log('📊 [Railway] Récupération des statistiques (non implémenté)');
    return null;
  }

  /**
   * Fermer les connexions
   */
  async shutdown() {
    if (this.isEnabled) {
      console.log('📊 [Railway] Dashboard Integration Service fermé');
    }
  }
}

// Instance singleton
export const dashboardIntegration = new DashboardIntegrationService();
