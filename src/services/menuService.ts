import { UserSessionService, UserState } from './userSessionService';
import { AudioService } from './audioService';
import { MessageMedia } from 'whatsapp-web.js';

/**
 * Service pour gérer les menus et flux d'interaction
 */
export class MenuService {
  private userSessionService: UserSessionService;
  private audioService: AudioService;

  constructor(userSessionService: UserSessionService, audioService: AudioService) {
    this.userSessionService = userSessionService;
    this.audioService = audioService;
  }

  /**
   * Générer le menu principal
   */
  getMainMenu(): string {
    return `🌾 *Menu PestAlert*

Choisissez une option :

1️⃣ Analyser la santé (sain/malade)
2️⃣ Vérifier la présence de ravageurs  
3️⃣ Envoyer une alerte

Tapez le numéro de votre choix (1, 2 ou 3)`;
  }

  /**
   * Traiter le déclencheur d'accueil "Hi PestAlerte 👋"
   */
  async handleWelcomeTrigger(userId: string): Promise<{ audioMessage: MessageMedia | null; textMessage: string }> {
    // Mettre à jour l'état de l'utilisateur
    this.userSessionService.updateSessionState(userId, UserState.MAIN_MENU);
    
    // Obtenir l'audio de bienvenue
    const audioMessage = await this.audioService.getWelcomeAudio();
    
    // Retourner l'audio et le menu
    return {
      audioMessage,
      textMessage: this.getMainMenu()
    };
  }

  /**
   * Traiter la sélection d'option du menu
   */
  async handleMenuSelection(userId: string, option: string): Promise<{ success: boolean; message: string; newState?: UserState }> {
    const session = this.userSessionService.getSession(userId);
    
    // Vérifier que l'utilisateur est dans le bon état
    if (session.state !== UserState.MAIN_MENU) {
      return {
        success: false,
        message: "❌ Veuillez d'abord dire 'Hi PestAlerte 👋' pour accéder au menu."
      };
    }

    switch (option.trim()) {
      case '1':
        this.userSessionService.updateSessionState(userId, UserState.WAITING_FOR_HEALTH_IMAGE);
        return {
          success: true,
          message: "🌾 **Option 1 sélectionnée - Analyse de santé**\n\n📷 En attente de vos images de cultures.\n\nEnvoyez une photo claire de votre culture pour analyse.",
          newState: UserState.WAITING_FOR_HEALTH_IMAGE
        };

      case '2':
        this.userSessionService.updateSessionState(userId, UserState.WAITING_FOR_PEST_IMAGE);
        return {
          success: true,
          message: "🐛 **Option 2 sélectionnée - Détection de ravageurs**\n\n📷 En attente de vos images de cultures.\n\nEnvoyez une photo claire de la zone affectée pour détecter les ravageurs.",
          newState: UserState.WAITING_FOR_PEST_IMAGE
        };

      case '3':
        this.userSessionService.updateSessionState(userId, UserState.WAITING_FOR_ALERT_DETAILS);
        return {
          success: true,
          message: "🚨 **Option 3 sélectionnée - Système d'alerte**\n\n📝 Décrivez le problème urgent que vous souhaitez signaler.\n\nVous pouvez également envoyer une photo si nécessaire.",
          newState: UserState.WAITING_FOR_ALERT_DETAILS
        };

      default:
        return {
          success: false,
          message: "❌ Option invalide. Veuillez choisir 1, 2 ou 3.\n\n" + this.getMainMenu()
        };
    }
  }

  /**
   * Obtenir un message d'aide contextuel selon l'état de l'utilisateur
   */
  getContextualHelp(userId: string): string {
    const session = this.userSessionService.getSession(userId);
    
    switch (session.state) {
      case UserState.IDLE:
        return "👋 Dites 'Hi PestAlerte 👋' pour commencer !";
        
      case UserState.MAIN_MENU:
        return "🌾 Vous êtes dans le menu principal.\n\n" + this.getMainMenu();
        
      case UserState.WAITING_FOR_HEALTH_IMAGE:
        return "📷 J'attends une photo de votre culture pour analyser sa santé (sain/malade).\n\nEnvoyez une image claire ou tapez 'menu' pour revenir au menu principal.";
        
      case UserState.WAITING_FOR_PEST_IMAGE:
        return "📷 J'attends une photo de votre culture pour détecter les ravageurs.\n\nEnvoyez une image claire ou tapez 'menu' pour revenir au menu principal.";
        
      case UserState.WAITING_FOR_ALERT_DETAILS:
        return "🚨 J'attends les détails de votre alerte.\n\nDécrivez le problème ou envoyez une photo, ou tapez 'menu' pour revenir au menu principal.";
        
      default:
        return "❓ État inconnu. Tapez 'Hi PestAlerte 👋' pour recommencer.";
    }
  }

  /**
   * Vérifier si un message est une commande de retour au menu
   */
  isReturnToMenuCommand(message: string): boolean {
    const lowerMessage = message.toLowerCase().trim();
    return lowerMessage === 'menu' || lowerMessage === 'retour' || lowerMessage === 'back';
  }

  /**
   * Retourner au menu principal
   */
  returnToMainMenu(userId: string): string {
    this.userSessionService.updateSessionState(userId, UserState.MAIN_MENU);
    return "🔄 Retour au menu principal.\n\n" + this.getMainMenu();
  }

  /**
   * Vérifier si l'utilisateur peut recevoir une image dans son état actuel
   */
  canReceiveImage(userId: string): boolean {
    const session = this.userSessionService.getSession(userId);
    return session.state === UserState.WAITING_FOR_HEALTH_IMAGE || 
           session.state === UserState.WAITING_FOR_PEST_IMAGE ||
           session.state === UserState.WAITING_FOR_ALERT_DETAILS;
  }

  /**
   * Obtenir le type d'analyse requis selon l'état de l'utilisateur
   */
  getRequiredAnalysisType(userId: string): 'health' | 'pest' | 'alert' | null {
    const session = this.userSessionService.getSession(userId);
    
    switch (session.state) {
      case UserState.WAITING_FOR_HEALTH_IMAGE:
        return 'health';
      case UserState.WAITING_FOR_PEST_IMAGE:
        return 'pest';
      case UserState.WAITING_FOR_ALERT_DETAILS:
        return 'alert';
      default:
        return null;
    }
  }
}
