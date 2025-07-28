import * as cron from 'node-cron';
import { predictiveAlertService, PestRiskResult, AlertSubscription } from './predictiveAlertService';
import { LoggingService } from './loggingService';
import { Client } from 'whatsapp-web.js';

/**
 * Service de planification des alertes prédictives automatiques
 * Envoie des alertes selon les conditions météo et les seuils de risque
 */
export class AlertSchedulerService {
  private logger: LoggingService;
  private whatsappClient: Client | null = null;
  private isRunning: boolean = false;
  private scheduledTasks: cron.ScheduledTask[] = [];

  constructor() {
    this.logger = new LoggingService();
    console.log('⏰ Service de planification des alertes initialisé');
  }

  /**
   * Initialiser avec le client WhatsApp
   */
  initialize(whatsappClient: Client) {
    this.whatsappClient = whatsappClient;
    console.log('📱 Client WhatsApp connecté au scheduler');
  }

  /**
   * Démarrer la planification automatique des alertes
   */
  startScheduledAlerts() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler déjà en cours d\'exécution');
      return;
    }

    console.log('🚀 Démarrage du système d\'alertes prédictives automatiques');

    // Alertes toutes les 6 heures (6h, 12h, 18h, 24h)
    const mainAlertTask = cron.schedule('0 */6 * * *', async () => {
      console.log('⏰ Exécution des alertes prédictives programmées');
      await this.processScheduledAlerts();
    }, {
      timezone: 'Africa/Abidjan' // Timezone Afrique de l'Ouest
    });

    // Alertes critiques toutes les 2 heures
    const criticalAlertTask = cron.schedule('0 */2 * * *', async () => {
      console.log('🚨 Vérification des alertes critiques');
      await this.processCriticalAlerts();
    }, {
      timezone: 'Africa/Abidjan'
    });

    // Rapport quotidien à 7h du matin
    const dailyReportTask = cron.schedule('0 7 * * *', async () => {
      console.log('📊 Génération du rapport quotidien');
      await this.generateDailyReport();
    }, {
      timezone: 'Africa/Abidjan'
    });

    // Les tâches sont automatiquement démarrées par défaut
    // Pas besoin d'appeler .start() explicitement
    this.scheduledTasks = [mainAlertTask, criticalAlertTask, dailyReportTask];
    this.isRunning = true;

    console.log('✅ Système d\'alertes automatiques démarré');
    console.log('📅 Alertes principales: toutes les 6h');
    console.log('🚨 Alertes critiques: toutes les 2h');
    console.log('📊 Rapport quotidien: 7h00');
  }

  /**
   * Arrêter la planification
   */
  stopScheduledAlerts() {
    if (!this.isRunning) {
      console.log('⚠️ Scheduler déjà arrêté');
      return;
    }

    this.scheduledTasks.forEach(task => {
      task.stop();
      task.destroy();
    });

    this.scheduledTasks = [];
    this.isRunning = false;

    console.log('🛑 Système d\'alertes automatiques arrêté');
  }

  /**
   * Traiter les alertes programmées pour tous les utilisateurs abonnés
   */
  private async processScheduledAlerts() {
    try {
      const stats = predictiveAlertService.getSubscriptionStats();
      console.log(`📊 Traitement de ${stats.active} abonnements actifs`);

      if (stats.active === 0) {
        console.log('ℹ️ Aucun abonnement actif, pas d\'alertes à envoyer');
        return;
      }

      // Obtenir tous les abonnements actifs
      const subscriptions = Array.from((predictiveAlertService as any).subscriptions.values())
        .filter((sub: AlertSubscription) => sub.isActive) as AlertSubscription[];

      let alertsSent = 0;
      let errorsCount = 0;

      for (const subscription of subscriptions) {
        try {
          // Analyser le risque pour cette localisation
          const riskResult = await predictiveAlertService.analyzeWithBrutalHonesty(
            subscription.location.lat,
            subscription.location.lon,
            subscription.userId
          );

          // Vérifier si une alerte doit être envoyée
          if (this.shouldSendScheduledAlert(subscription, riskResult)) {
            await this.sendPredictiveAlert(subscription, riskResult);
            alertsSent++;

            // Mettre à jour la date de dernière alerte
            subscription.lastAlertSent = new Date();
          }

          // Petit délai pour éviter la surcharge
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: any) {
          console.error(`❌ Erreur pour ${subscription.userPhone}:`, error.message);
          errorsCount++;
        }
      }

      console.log(`✅ Alertes traitées: ${alertsSent} envoyées, ${errorsCount} erreurs`);
      
      // Logger les statistiques
      this.logger.logBotActivity('system', 'Scheduled Alerts Processed', {
        totalSubscriptions: stats.active,
        alertsSent,
        errorsCount,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Erreur lors du traitement des alertes programmées:', error.message);
      this.logger.logServiceError('SCHEDULED_ALERTS', error.message, 'system');
    }
  }

  /**
   * Traiter uniquement les alertes critiques
   */
  private async processCriticalAlerts() {
    try {
      const subscriptions = Array.from((predictiveAlertService as any).subscriptions.values())
        .filter((sub: AlertSubscription) => sub.isActive) as AlertSubscription[];

      let criticalAlertsSent = 0;

      for (const subscription of subscriptions) {
        try {
          const riskResult = await predictiveAlertService.analyzeWithBrutalHonesty(
            subscription.location.lat,
            subscription.location.lon,
            subscription.userId
          );

          // Envoyer seulement les alertes critiques
          if (riskResult.riskLevel === 'CRITICAL') {
            await this.sendPredictiveAlert(subscription, riskResult, true);
            criticalAlertsSent++;
            subscription.lastAlertSent = new Date();
          }

          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error: any) {
          console.error(`❌ Erreur critique pour ${subscription.userPhone}:`, error.message);
        }
      }

      if (criticalAlertsSent > 0) {
        console.log(`🚨 ${criticalAlertsSent} alertes critiques envoyées`);
      }

    } catch (error: any) {
      console.error('❌ Erreur lors du traitement des alertes critiques:', error.message);
    }
  }

  /**
   * Vérifier si une alerte doit être envoyée
   */
  private shouldSendScheduledAlert(subscription: AlertSubscription, riskResult: PestRiskResult): boolean {
    // Vérifier le seuil d'alerte
    const thresholdMet = (
      (subscription.alertThreshold === 'MODERATE' && ['MODERATE', 'HIGH', 'CRITICAL'].includes(riskResult.riskLevel)) ||
      (subscription.alertThreshold === 'HIGH' && ['HIGH', 'CRITICAL'].includes(riskResult.riskLevel)) ||
      (subscription.alertThreshold === 'CRITICAL' && riskResult.riskLevel === 'CRITICAL')
    );

    if (!thresholdMet) return false;

    // Éviter le spam: pas plus d'une alerte par 6 heures (sauf critique)
    if (subscription.lastAlertSent && riskResult.riskLevel !== 'CRITICAL') {
      const timeSinceLastAlert = Date.now() - subscription.lastAlertSent.getTime();
      const sixHours = 6 * 60 * 60 * 1000;
      if (timeSinceLastAlert < sixHours) {
        return false;
      }
    }

    return true;
  }

  /**
   * Envoyer une alerte prédictive à un utilisateur
   */
  private async sendPredictiveAlert(
    subscription: AlertSubscription,
    riskResult: PestRiskResult,
    isCritical: boolean = false
  ) {
    if (!this.whatsappClient) {
      console.log('❌ Client WhatsApp non disponible');
      return;
    }

    try {
      const chatId = subscription.userPhone.includes('@c.us') ? 
        subscription.userPhone : 
        subscription.userPhone + '@c.us';

      // Message principal
      let message = riskResult.alertMessage;
      
      // Ajouter les recommandations
      if (riskResult.recommendations.length > 0) {
        message += '\n\n🛡️ **RECOMMANDATIONS**:\n';
        riskResult.recommendations.forEach((rec, index) => {
          message += `${index + 1}. ${rec}\n`;
        });
      }

      // Footer
      message += '\n\n📱 PestAlert - Système d\'alertes prédictives';
      message += '\n💡 Tapez "menu" pour plus d\'options';

      if (isCritical) {
        message = '🚨 **ALERTE CRITIQUE IMMÉDIATE** 🚨\n\n' + message;
      }

      await this.whatsappClient.sendMessage(chatId, message);

      console.log(`📧 Alerte ${riskResult.riskLevel} envoyée à ${subscription.userPhone}`);
      
      // Logger l'envoi
      this.logger.logBotActivity(subscription.userId, 'Predictive Alert Sent', {
        riskLevel: riskResult.riskLevel,
        riskScore: riskResult.riskScore,
        source: riskResult.source,
        isCritical,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error(`❌ Erreur envoi alerte à ${subscription.userPhone}:`, error.message);
      this.logger.logServiceError('ALERT_SENDING', error.message, subscription.userId);
    }
  }

  /**
   * Générer un rapport quotidien
   */
  private async generateDailyReport() {
    try {
      const stats = predictiveAlertService.getSubscriptionStats();
      
      console.log('📊 === RAPPORT QUOTIDIEN PESTALERT ===');
      console.log(`👥 Abonnements actifs: ${stats.active}`);
      console.log(`📊 Par seuil:`, stats.byThreshold);
      console.log(`⏰ Généré le: ${new Date().toLocaleString()}`);
      
      // TODO: Envoyer le rapport aux administrateurs
      // TODO: Enregistrer dans le dashboard
      
    } catch (error: any) {
      console.error('❌ Erreur génération rapport quotidien:', error.message);
    }
  }

  /**
   * Obtenir le statut du scheduler
   */
  getStatus(): { isRunning: boolean; tasksCount: number; uptime: string } {
    return {
      isRunning: this.isRunning,
      tasksCount: this.scheduledTasks.length,
      uptime: this.isRunning ? 'Active' : 'Inactive'
    };
  }

  /**
   * Forcer l'exécution des alertes (pour tests)
   */
  async forceAlertExecution(): Promise<void> {
    console.log('🔧 Exécution forcée des alertes (mode test)');
    await this.processScheduledAlerts();
  }
}

// Instance singleton
export const alertSchedulerService = new AlertSchedulerService();
