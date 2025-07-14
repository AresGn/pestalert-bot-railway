/**
 * Service de logging pour le suivi des analyses et des erreurs
 */

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  category: string;
  message: string;
  data?: any;
  userId?: string;
}

export class LoggingService {
  private logLevel: string;

  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  /**
   * Logger une analyse d'image
   */
  logImageAnalysis(userId: string, success: boolean, analysisData?: any, error?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: success ? 'INFO' : 'ERROR',
      category: 'IMAGE_ANALYSIS',
      message: success ? 'Analyse d\'image réussie' : 'Échec de l\'analyse d\'image',
      userId,
      data: success ? {
        prediction: analysisData?.analysis?.crop_health?.binaryResult?.prediction,
        confidence: analysisData?.analysis?.crop_health?.binaryResult?.confidence,
        topDisease: analysisData?.analysis?.crop_health?.multiClassResult?.top_prediction?.disease,
        alertLevel: analysisData?.analysis?.alert?.critical ? 'CRITICAL' : 
                   analysisData?.analysis?.alert?.preventive ? 'PREVENTIVE' : 'NORMAL'
      } : { error }
    };

    this.writeLog(entry);
  }

  /**
   * Logger une erreur de service
   */
  logServiceError(service: string, error: string, userId?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      category: 'SERVICE_ERROR',
      message: `Erreur du service ${service}`,
      userId,
      data: { service, error }
    };

    this.writeLog(entry);
  }

  /**
   * Logger une alerte critique
   */
  logCriticalAlert(userId: string, alertData: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      category: 'CRITICAL_ALERT',
      message: 'Alerte critique déclenchée',
      userId,
      data: alertData
    };

    this.writeLog(entry);
  }

  /**
   * Logger l'activité générale du bot
   */
  logBotActivity(userId: string, activity: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      category: 'BOT_ACTIVITY',
      message: activity,
      userId,
      data
    };

    this.writeLog(entry);
  }

  /**
   * Logger les erreurs de validation d'image
   */
  logImageValidationError(userId: string, error: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      category: 'IMAGE_VALIDATION',
      message: 'Erreur de validation d\'image',
      userId,
      data: { error }
    };

    this.writeLog(entry);
  }

  /**
   * Écrire le log (console pour l'instant, peut être étendu vers fichier/base de données)
   */
  private writeLog(entry: LogEntry) {
    const shouldLog = this.shouldLogLevel(entry.level);
    
    if (shouldLog) {
      const logMessage = this.formatLogMessage(entry);
      
      switch (entry.level) {
        case 'ERROR':
          console.error(logMessage);
          break;
        case 'WARN':
          console.warn(logMessage);
          break;
        case 'DEBUG':
          console.debug(logMessage);
          break;
        default:
          console.log(logMessage);
      }

      // Ici, on pourrait ajouter l'écriture vers un fichier ou une base de données
      this.writeToFile(entry);
    }
  }

  /**
   * Déterminer si on doit logger selon le niveau configuré
   */
  private shouldLogLevel(level: string): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.logLevel.toLowerCase() as keyof typeof levels] || 1;
    const messageLevel = levels[level.toLowerCase() as keyof typeof levels] || 1;
    
    return messageLevel >= currentLevel;
  }

  /**
   * Formater le message de log
   */
  private formatLogMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = entry.level.padEnd(5);
    const category = entry.category.padEnd(15);
    const userId = entry.userId ? `[${entry.userId}]` : '[SYSTEM]';
    
    let message = `${timestamp} ${level} ${category} ${userId} ${entry.message}`;
    
    if (entry.data && Object.keys(entry.data).length > 0) {
      message += ` | Data: ${JSON.stringify(entry.data)}`;
    }
    
    return message;
  }

  /**
   * Écrire vers un fichier (implémentation basique)
   */
  private writeToFile(entry: LogEntry) {
    // Implémentation future : écriture vers fichier de log
    // Pour l'instant, on se contente de la console
  }

  /**
   * Obtenir les statistiques de logging
   */
  getLogStats(): any {
    // Implémentation future : statistiques des logs
    return {
      message: 'Statistiques de logging non encore implémentées',
      timestamp: new Date().toISOString()
    };
  }
}
