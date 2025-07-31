import { AllowedNumbersConfig, loadAllowedNumbersFromEnv, isNumberAllowed } from '../config/allowedNumbers';
import { LoggingService } from './loggingService';

export class AuthorizationService {
  private config: AllowedNumbersConfig;
  private logger: LoggingService;
  private unauthorizedAttempts: Map<string, number> = new Map();

  constructor() {
    this.config = loadAllowedNumbersFromEnv();
    this.logger = new LoggingService();
    this.logConfiguration();
  }

  /**
   * Vérifier si un numéro est autorisé à utiliser le bot
   */
  public checkAuthorization(phoneNumber: string): {
    allowed: boolean;
    reason: string;
    isAdmin: boolean;
    shouldAlert: boolean;
  } {
    // Ignorer les messages système WhatsApp
    if (phoneNumber.includes('@broadcast') || phoneNumber.includes('status@')) {
      return {
        allowed: false,
        reason: 'Message système WhatsApp',
        isAdmin: false,
        shouldAlert: false // Pas d'alerte pour les messages système
      };
    }

    const result = isNumberAllowed(phoneNumber, this.config);

    // Si non autorisé, enregistrer la tentative
    if (!result.allowed) {
      this.recordUnauthorizedAttempt(phoneNumber);
    }

    return {
      ...result,
      shouldAlert: !result.allowed && this.config.alertOnUnauthorized
    };
  }

  /**
   * Vérifier si un numéro est administrateur
   */
  public isAdmin(phoneNumber: string): boolean {
    const cleanNumber = phoneNumber.replace('@c.us', '').replace('+', '');
    return this.config.adminNumbers.includes(cleanNumber);
  }

  /**
   * Obtenir la liste des numéros d'administrateurs (pour les alertes)
   */
  public getAdminNumbers(): string[] {
    return this.config.adminNumbers.map(num => `${num}@c.us`);
  }

  /**
   * Obtenir les statistiques d'autorisation
   */
  public getAuthStats(): {
    filterMode: string;
    adminCount: number;
    allowedUsersCount: number;
    allowedCountriesCount: number;
    unauthorizedAttempts: number;
  } {
    return {
      filterMode: this.config.filterMode,
      adminCount: this.config.adminNumbers.length,
      allowedUsersCount: this.config.allowedUsers.length,
      allowedCountriesCount: this.config.allowedCountryCodes.length,
      unauthorizedAttempts: Array.from(this.unauthorizedAttempts.values()).reduce((a, b) => a + b, 0)
    };
  }

  /**
   * Recharger la configuration
   */
  public reloadConfig(): void {
    this.config = loadAllowedNumbersFromEnv();
    this.logConfiguration();
    console.log('🔄 Configuration d\'autorisation rechargée');
  }

  /**
   * Ajouter un numéro à la liste des utilisateurs autorisés (admin seulement)
   */
  public addAllowedUser(phoneNumber: string, adminNumber: string): boolean {
    if (!this.isAdmin(adminNumber)) {
      return false;
    }

    const cleanNumber = phoneNumber.replace('@c.us', '').replace('+', '');
    if (!this.config.allowedUsers.includes(cleanNumber)) {
      this.config.allowedUsers.push(cleanNumber);
      this.logger.logBotActivity('ADMIN', `Numéro ajouté à la liste autorisée: ${cleanNumber}`, {
        addedBy: adminNumber
      });
      return true;
    }
    return false;
  }

  /**
   * Supprimer un numéro de la liste des utilisateurs autorisés (admin seulement)
   */
  public removeAllowedUser(phoneNumber: string, adminNumber: string): boolean {
    if (!this.isAdmin(adminNumber)) {
      return false;
    }

    const cleanNumber = phoneNumber.replace('@c.us', '').replace('+', '');
    const index = this.config.allowedUsers.indexOf(cleanNumber);
    if (index > -1) {
      this.config.allowedUsers.splice(index, 1);
      this.logger.logBotActivity('ADMIN', `Numéro supprimé de la liste autorisée: ${cleanNumber}`, {
        removedBy: adminNumber
      });
      return true;
    }
    return false;
  }

  /**
   * Changer le mode de filtrage (admin seulement)
   */
  public setFilterMode(mode: 'whitelist' | 'country' | 'disabled', adminNumber: string): boolean {
    if (!this.isAdmin(adminNumber)) {
      return false;
    }

    const oldMode = this.config.filterMode;
    this.config.filterMode = mode;
    
    this.logger.logBotActivity('ADMIN', `Mode de filtrage changé: ${oldMode} → ${mode}`, {
      changedBy: adminNumber
    });
    
    console.log(`🔧 Mode de filtrage changé: ${oldMode} → ${mode}`);
    return true;
  }

  /**
   * Enregistrer une tentative d'accès non autorisée
   */
  private recordUnauthorizedAttempt(phoneNumber: string): void {
    const cleanNumber = phoneNumber.replace('@c.us', '').replace('+', '');
    const currentAttempts = this.unauthorizedAttempts.get(cleanNumber) || 0;
    this.unauthorizedAttempts.set(cleanNumber, currentAttempts + 1);
    
    this.logger.logBotActivity('SECURITY', 'Tentative d\'accès non autorisée', {
      phoneNumber: cleanNumber,
      attempts: currentAttempts + 1,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Logger la configuration actuelle
   */
  private logConfiguration(): void {
    console.log('🔐 Configuration d\'autorisation:');
    console.log(`   Mode de filtrage: ${this.config.filterMode}`);
    console.log(`   Administrateurs: ${this.config.adminNumbers.length}`);
    console.log(`   Utilisateurs autorisés: ${this.config.allowedUsers.length}`);
    console.log(`   Pays autorisés: ${this.config.allowedCountryCodes.length}`);
    console.log(`   Alertes non autorisées: ${this.config.alertOnUnauthorized ? 'Activées' : 'Désactivées'}`);
    
    if (this.config.filterMode === 'disabled') {
      console.log('⚠️  ATTENTION: Le filtrage est DÉSACTIVÉ - Le bot répond à tous les numéros');
    }
  }

  /**
   * Obtenir un message d'aide pour les commandes d'autorisation (admin seulement)
   */
  public getAdminHelp(): string {
    return `🔐 *Commandes d'Administration - Autorisation*

📋 **Gestion des utilisateurs:**
• !auth add +22912345678 - Ajouter un numéro autorisé
• !auth remove +22912345678 - Supprimer un numéro autorisé
• !auth list - Voir les numéros autorisés

🔧 **Configuration:**
• !auth mode whitelist - Mode liste blanche
• !auth mode country - Mode pays autorisés
• !auth mode disabled - Désactiver le filtrage

📊 **Statistiques:**
• !auth stats - Voir les statistiques d'autorisation
• !auth reload - Recharger la configuration

⚠️ **Note:** Ces commandes sont réservées aux administrateurs.`;
  }
}
