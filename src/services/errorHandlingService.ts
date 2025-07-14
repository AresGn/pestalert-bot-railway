import { LoggingService } from './loggingService';

/**
 * Service de gestion d'erreurs centralisé
 */

export interface ErrorContext {
  userId?: string;
  action: string;
  service?: string;
  additionalData?: any;
}

export class ErrorHandlingService {
  private logger: LoggingService;

  constructor() {
    this.logger = new LoggingService();
  }

  /**
   * Gérer les erreurs d'analyse d'image
   */
  handleImageAnalysisError(error: Error, context: ErrorContext): string {
    this.logger.logServiceError(context.service || 'IMAGE_ANALYSIS', error.message, context.userId);

    // Déterminer le type d'erreur et retourner un message approprié
    if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      return '⏰ *Service temporairement indisponible*\n\nLe service d\'analyse est actuellement surchargé. Veuillez réessayer dans quelques minutes.';
    }
    
    if (error.message.includes('Image invalide') || error.message.includes('validation')) {
      this.logger.logImageValidationError(context.userId || 'unknown', error.message);
      return '📷 *Image non valide*\n\nVeuillez envoyer une image claire et bien éclairée de vos cultures. Formats acceptés : JPEG, PNG, WebP.';
    }
    
    if (error.message.includes('API') || error.message.includes('prediction failed')) {
      return '🔧 *Erreur du service d\'analyse*\n\nNos services d\'IA sont temporairement indisponibles. Nous travaillons à résoudre le problème.';
    }
    
    if (error.message.includes('preprocessing')) {
      return '🖼️ *Erreur de traitement d\'image*\n\nImpossible de traiter cette image. Assurez-vous qu\'elle n\'est pas corrompue et réessayez.';
    }

    // Erreur générique
    return '❌ *Erreur inattendue*\n\nUne erreur s\'est produite lors de l\'analyse. Veuillez réessayer ou contacter le support si le problème persiste.';
  }

  /**
   * Gérer les erreurs de service
   */
  handleServiceError(error: Error, serviceName: string, context: ErrorContext): string {
    this.logger.logServiceError(serviceName, error.message, context.userId);

    switch (serviceName) {
      case 'CROP_HEALTH':
        return '🌾 *Service d\'analyse des cultures indisponible*\n\nLe service d\'analyse OpenEPI est temporairement hors ligne. Veuillez réessayer plus tard.';
      
      case 'IMAGE_PROCESSING':
        return '🖼️ *Service de traitement d\'images indisponible*\n\nImpossible de traiter votre image actuellement. Veuillez réessayer.';
      
      case 'WEATHER':
        return '🌤️ *Service météorologique indisponible*\n\nLes données météorologiques ne sont pas disponibles actuellement.';
      
      default:
        return `⚠️ *Service ${serviceName} indisponible*\n\nCe service est temporairement hors ligne. Veuillez réessayer plus tard.`;
    }
  }

  /**
   * Gérer les erreurs de WhatsApp
   */
  handleWhatsAppError(error: Error, context: ErrorContext): void {
    this.logger.logServiceError('WHATSAPP', error.message, context.userId);
    
    console.error('❌ Erreur WhatsApp:', {
      message: error.message,
      context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Gérer les erreurs de validation
   */
  handleValidationError(error: Error, context: ErrorContext): string {
    this.logger.logImageValidationError(context.userId || 'unknown', error.message);

    if (error.message.includes('trop petite')) {
      return '📏 *Image trop petite*\n\nVeuillez envoyer une image d\'au moins 100x100 pixels pour une analyse précise.';
    }
    
    if (error.message.includes('trop grande')) {
      return '📏 *Image trop grande*\n\nVeuillez réduire la taille de votre image (maximum 4000x4000 pixels).';
    }
    
    if (error.message.includes('format')) {
      return '📷 *Format non supporté*\n\nVeuillez envoyer une image au format JPEG, PNG ou WebP.';
    }

    return '❌ *Image non valide*\n\nVeuillez vérifier que votre image est correcte et réessayez.';
  }

  /**
   * Gérer les erreurs critiques
   */
  handleCriticalError(error: Error, context: ErrorContext): void {
    this.logger.logServiceError('CRITICAL', error.message, context.userId);
    
    console.error('🚨 ERREUR CRITIQUE:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });

    // Ici, on pourrait ajouter des notifications d'alerte pour les administrateurs
    this.notifyAdministrators(error, context);
  }

  /**
   * Notifier les administrateurs en cas d'erreur critique
   */
  private notifyAdministrators(error: Error, context: ErrorContext): void {
    // Implémentation future : notification par email, webhook, etc.
    console.log('🔔 Notification administrateur requise:', {
      error: error.message,
      context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Créer un rapport d'erreur détaillé
   */
  createErrorReport(error: Error, context: ErrorContext): any {
    return {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage()
      }
    };
  }

  /**
   * Vérifier si une erreur est récupérable
   */
  isRecoverableError(error: Error): boolean {
    const recoverableErrors = [
      'timeout',
      'ECONNREFUSED',
      'ENOTFOUND',
      'temporarily unavailable',
      'rate limit'
    ];

    return recoverableErrors.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }

  /**
   * Obtenir des suggestions de résolution d'erreur
   */
  getErrorResolutionSuggestions(error: Error): string[] {
    const suggestions: string[] = [];

    if (error.message.includes('timeout')) {
      suggestions.push('Vérifiez votre connexion internet');
      suggestions.push('Réessayez dans quelques minutes');
    }

    if (error.message.includes('Image')) {
      suggestions.push('Vérifiez la qualité de votre image');
      suggestions.push('Assurez-vous que l\'image est bien éclairée');
      suggestions.push('Utilisez un format d\'image standard (JPEG, PNG)');
    }

    if (error.message.includes('API') || error.message.includes('service')) {
      suggestions.push('Le service peut être temporairement indisponible');
      suggestions.push('Contactez le support si le problème persiste');
    }

    return suggestions;
  }
}
