import { LoggingService } from './loggingService';

export interface AlertData {
  userId: string;
  userName?: string;
  description?: string;
  hasImage: boolean;
  imageBuffer?: Buffer;
  location?: { lat: number; lon: number };
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'RESOLVED';
}

export interface AlertResponse {
  success: boolean;
  alertId: string;
  message: string;
  estimatedResponseTime?: string;
}

/**
 * Service pour gérer les alertes urgentes (Option 3)
 */
export class AlertService {
  private logger: LoggingService;
  private alerts: Map<string, AlertData> = new Map();

  constructor() {
    this.logger = new LoggingService();
  }

  /**
   * Créer une nouvelle alerte
   */
  async createAlert(
    userId: string, 
    userName?: string, 
    description?: string, 
    imageBuffer?: Buffer
  ): Promise<AlertResponse> {
    try {
      const alertId = this.generateAlertId();
      const timestamp = new Date();

      // Déterminer la sévérité basée sur les mots-clés
      const severity = this.determineSeverity(description || '');

      const alertData: AlertData = {
        userId,
        userName,
        description,
        hasImage: !!imageBuffer,
        imageBuffer,
        timestamp,
        severity,
        status: 'PENDING'
      };

      // Stocker l'alerte
      this.alerts.set(alertId, alertData);

      // Logger l'alerte
      this.logger.logBotActivity(userId, 'Alert Created', {
        alertId,
        severity,
        hasImage: alertData.hasImage,
        description: description?.substring(0, 100),
        timestamp: timestamp.toISOString()
      });

      // Simuler l'envoi de l'alerte (à remplacer par vraie intégration)
      const sendResult = await this.sendAlertToExperts(alertData, alertId);

      if (sendResult.success) {
        alertData.status = 'SENT';
        this.alerts.set(alertId, alertData);
      }

      return {
        success: sendResult.success,
        alertId,
        message: this.generateAlertMessage(alertData, alertId),
        estimatedResponseTime: this.getEstimatedResponseTime(severity)
      };

    } catch (error: any) {
      this.logger.logServiceError('ALERT_CREATION', error.message, userId);
      
      return {
        success: false,
        alertId: '',
        message: 'Erreur lors de la création de l\'alerte. Veuillez réessayer.'
      };
    }
  }

  /**
   * Traiter une alerte avec description textuelle
   */
  async handleTextAlert(userId: string, userName: string, description: string): Promise<AlertResponse> {
    console.log(`🚨 Traitement d'alerte textuelle de ${userName}: ${description.substring(0, 50)}...`);
    
    return await this.createAlert(userId, userName, description);
  }

  /**
   * Traiter une alerte avec image
   */
  async handleImageAlert(userId: string, userName: string, imageBuffer: Buffer, description?: string): Promise<AlertResponse> {
    console.log(`🚨 Traitement d'alerte avec image de ${userName}`);
    
    return await this.createAlert(userId, userName, description, imageBuffer);
  }

  /**
   * Déterminer la sévérité basée sur les mots-clés
   */
  private determineSeverity(description: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const lowerDesc = description.toLowerCase();
    
    // Mots-clés critiques
    const criticalKeywords = ['urgent', 'critique', 'mort', 'détruit', 'invasion', 'catastrophe'];
    const highKeywords = ['grave', 'sérieux', 'important', 'rapide', 'beaucoup'];
    const mediumKeywords = ['problème', 'souci', 'inquiet', 'bizarre', 'étrange'];

    if (criticalKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return 'CRITICAL';
    } else if (highKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return 'HIGH';
    } else if (mediumKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Simuler l'envoi d'alerte aux experts
   */
  private async sendAlertToExperts(alertData: AlertData, alertId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulation d'envoi (à remplacer par vraie intégration)
      console.log(`📧 Envoi d'alerte ${alertId} aux experts...`);
      
      // Simuler un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simuler un succès (95% de réussite)
      const success = Math.random() > 0.05;
      
      if (success) {
        console.log(`✅ Alerte ${alertId} envoyée avec succès`);
        return { success: true };
      } else {
        console.log(`❌ Échec d'envoi de l'alerte ${alertId}`);
        return { success: false, error: 'Échec de communication avec les experts' };
      }
      
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Générer un message de confirmation d'alerte
   */
  private generateAlertMessage(alertData: AlertData, alertId: string): string {
    const severityEmoji = {
      'LOW': '🟡',
      'MEDIUM': '🟠', 
      'HIGH': '🔴',
      'CRITICAL': '🆘'
    };

    return `🚨 **ALERTE ENVOYÉE**

${severityEmoji[alertData.severity]} **Sévérité**: ${alertData.severity}
📋 **ID Alerte**: ${alertId}
👤 **Contact**: ${alertData.userName || alertData.userId}
📷 **Image**: ${alertData.hasImage ? 'Incluse' : 'Non fournie'}
⏰ **Heure**: ${alertData.timestamp.toLocaleString()}

📝 **Description**:
${alertData.description || 'Aucune description fournie'}

🔔 **Statut**: Expert notifié
⏱️ **Réponse estimée**: ${this.getEstimatedResponseTime(alertData.severity)}

💡 Tapez 'menu' pour revenir au menu principal`;
  }

  /**
   * Obtenir le temps de réponse estimé selon la sévérité
   */
  private getEstimatedResponseTime(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): string {
    switch (severity) {
      case 'CRITICAL':
        return 'Immédiate (< 1h)';
      case 'HIGH':
        return 'Rapide (< 4h)';
      case 'MEDIUM':
        return 'Standard (< 24h)';
      case 'LOW':
        return 'Normal (< 48h)';
      default:
        return 'Standard (< 24h)';
    }
  }

  /**
   * Générer un ID unique pour l'alerte
   */
  private generateAlertId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ALT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Obtenir une alerte par ID
   */
  getAlert(alertId: string): AlertData | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Obtenir toutes les alertes d'un utilisateur
   */
  getUserAlerts(userId: string): AlertData[] {
    return Array.from(this.alerts.values()).filter(alert => alert.userId === userId);
  }

  /**
   * Obtenir le nombre total d'alertes
   */
  getTotalAlertsCount(): number {
    return this.alerts.size;
  }

  /**
   * Obtenir les statistiques des alertes
   */
  getAlertStats(): { total: number; bySeverity: Record<string, number>; byStatus: Record<string, number> } {
    const alerts = Array.from(this.alerts.values());
    
    const bySeverity = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = alerts.reduce((acc, alert) => {
      acc[alert.status] = (acc[alert.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: alerts.length,
      bySeverity,
      byStatus
    };
  }
}
