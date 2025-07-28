import { LogEntry } from './loggingService';
import axios, { AxiosInstance } from 'axios';

/**
 * Service d'intégration pour envoyer les données du bot vers le dashboard
 * Version améliorée avec connexion API au dashboard backend
 */
export class DashboardIntegrationService {
  private isEnabled: boolean;
  private apiClient: AxiosInstance | null = null;
  private dashboardApiUrl: string;
  private apiToken: string | null = null;

  constructor() {
    this.isEnabled = process.env.DASHBOARD_INTEGRATION_ENABLED === 'true';
    this.dashboardApiUrl = process.env.DASHBOARD_API_URL || 'https://pestalert-dashboard.vercel.app';

    if (this.isEnabled) {
      this.initializeApiClient();
      console.log('📊 Dashboard Integration Service activé');
      console.log(`📊 Dashboard API URL: ${this.dashboardApiUrl}`);
    } else {
      console.log('📊 Dashboard Integration Service désactivé');
    }
  }

  /**
   * Initialiser le client API pour communiquer avec le dashboard backend
   */
  private initializeApiClient() {
    this.apiClient = axios.create({
      baseURL: `${this.dashboardApiUrl}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PestAlert-Bot-Railway/1.0'
      }
    });

    // Intercepteur pour ajouter le token d'authentification
    this.apiClient.interceptors.request.use((config) => {
      if (this.apiToken) {
        config.headers.Authorization = `Bearer ${this.apiToken}`;
      }
      return config;
    });

    // Intercepteur pour gérer les erreurs
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('❌ Erreur API Dashboard:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authentifier le bot auprès de l'API dashboard
   */
  async authenticate() {
    if (!this.isEnabled || !this.apiClient) return false;

    try {
      const response = await this.apiClient.post('/auth/bot-login', {
        botId: 'pestalert-railway-bot',
        secret: process.env.BOT_API_SECRET || 'default-bot-secret'
      });

      if (response.data.success && response.data.token) {
        this.apiToken = response.data.token;
        console.log('✅ Bot authentifié auprès du dashboard API');
        return true;
      }
    } catch (error) {
      console.error('❌ Échec de l\'authentification bot:', error);
    }

    return false;
  }

  /**
   * Enregistrer une nouvelle session utilisateur
   */
  async recordUserSession(userId: string, userPhone: string, userName?: string, location?: any) {
    if (!this.isEnabled) return;

    try {
      if (this.apiClient && this.apiToken) {
        await this.apiClient.post('/bot/user-session', {
          userId,
          userPhone,
          userName,
          location,
          timestamp: new Date().toISOString(),
          botSource: 'railway'
        });
        console.log(`📊 ✅ Session utilisateur envoyée: ${userPhone}`);
      } else {
        console.log(`📊 [Local] Session utilisateur: ${userPhone} (${userId})`);
      }
    } catch (error) {
      console.error('❌ Erreur envoi session utilisateur:', error);
      // Fallback vers logging local
      console.log(`📊 [Fallback] Session utilisateur: ${userPhone} (${userId})`);
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
      if (this.apiClient && this.apiToken) {
        await this.apiClient.post('/bot/image-analysis', {
          ...data,
          timestamp: new Date().toISOString(),
          botSource: 'railway'
        });
        console.log(`📊 ✅ Analyse envoyée: ${data.analysisType} - ${data.userPhone}`);
      } else {
        console.log(`📊 [Local] Analyse ${data.analysisType}: ${data.success ? 'Succès' : 'Échec'} - ${data.userPhone}`);
        if (data.confidence) console.log(`📊 [Local] Confiance: ${data.confidence}%`);
      }
    } catch (error) {
      console.error('❌ Erreur envoi analyse:', error);
      // Fallback vers logging local
      console.log(`📊 [Fallback] Analyse ${data.analysisType}: ${data.success ? 'Succès' : 'Échec'} - ${data.userPhone}`);
    }
  }

  /**
   * Enregistrer une métrique système
   */
  async recordSystemMetric(service: string, metric: string, value: number, unit?: string, metadata?: any) {
    if (!this.isEnabled) return;

    try {
      if (this.apiClient && this.apiToken) {
        await this.apiClient.post('/bot/system-metric', {
          service,
          metric,
          value,
          unit,
          metadata,
          timestamp: new Date().toISOString(),
          botSource: 'railway'
        });
        console.log(`📊 ✅ Métrique envoyée: ${service}.${metric}`);
      } else {
        console.log(`📊 [Local] Métrique ${service}.${metric}: ${value}${unit || ''}`);
      }
    } catch (error) {
      console.error('❌ Erreur envoi métrique:', error);
      // Fallback vers logging local
      console.log(`📊 [Fallback] Métrique ${service}.${metric}: ${value}${unit || ''}`);
    }
  }

  /**
   * Enregistrer les métriques de performance du bot
   */
  async recordBotPerformanceMetrics() {
    if (!this.isEnabled) return;

    try {
      const memoryUsage = process.memoryUsage();
      const metrics = {
        memory_usage: { value: memoryUsage.heapUsed / 1024 / 1024, unit: 'MB' },
        memory_total: { value: memoryUsage.heapTotal / 1024 / 1024, unit: 'MB' },
        uptime: { value: process.uptime(), unit: 'seconds' },
        availability: { value: 100, unit: '%' },
        cpu_usage: { value: process.cpuUsage().user / 1000000, unit: 'ms' }
      };

      if (this.apiClient && this.apiToken) {
        await this.apiClient.post('/bot/performance-metrics', {
          metrics,
          timestamp: new Date().toISOString(),
          botSource: 'railway'
        });
        console.log('📊 ✅ Métriques de performance envoyées');
      } else {
        // Fallback vers méthode individuelle
        for (const [key, data] of Object.entries(metrics)) {
          await this.recordSystemMetric('bot', key, data.value, data.unit);
        }
      }
    } catch (error) {
      console.error('❌ Erreur envoi métriques performance:', error);
      console.log('📊 [Fallback] Métriques de performance du bot enregistrées localement');
    }
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
