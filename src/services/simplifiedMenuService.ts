import { MessageMedia } from 'whatsapp-web.js';
import { AudioService } from './audioService';
import { UserSessionService, UserState } from './userSessionService';

/**
 * Service pour gérer les menus simplifiés - Phase 0 MVP
 * Version française simplifiée pour validation concept
 */
export class SimplifiedMenuService {
  private audioService: AudioService;
  private userSessionService: UserSessionService;

  constructor(audioService: AudioService, userSessionService: UserSessionService) {
    this.audioService = audioService;
    this.userSessionService = userSessionService;
  }

  /**
   * Messages simplifiés en français
   */
  private getSimplifiedMessages() {
    return {
      welcome: {
        text: "👋 Salut ami agriculteur!\n\n🌾 PestAlert t'aide:\n1️⃣ 📷 Photo plant\n2️⃣ 🚨 Urgent\n3️⃣ ❓ Aide\n\nTape: 1, 2 ou 3",
        audio: "fr_simple/welcome_simple.mp3"
      },
      menu: {
        text: "🌾 Ton plant:\n1️⃣ 📷 Photo → 🎵\n2️⃣ 🚨 Urgent\n3️⃣ ❓ Aide\n\nTape: 1, 2 ou 3",
        audio: null
      },
      healthy: {
        text: "✅ Très bien!\nTon plant va bien! 👍🌱\nContinue comme ça!",
        audio: "fr_simple/healthy_simple.mp3"
      },
      diseased: {
        text: "⚠️ Attention!\nPetites bêtes détectées! 🐛\nTraite rapidement!",
        audio: "fr_simple/diseased_simple.mp3"
      },
      critical: {
        text: "🚨 URGENT!\nTon plant très malade! 😰\nAppelle expert maintenant! 📞",
        audio: "fr_simple/critical_simple.mp3"
      },
      unclear: {
        text: "📷 Photo pas claire\nReprends avec lumière ☀️\nMerci!",
        audio: "fr_simple/unclear_simple.mp3"
      },
      analyzing: {
        text: "🔍 Analyse en cours...\nPatiente un moment ⏳",
        audio: "fr_simple/analyzing_simple.mp3"
      },
      help: {
        text: "❓ Aide PestAlert:\n• Envoie photo plant 📷\n• Je dis si va bien ✅\n• Je t'aide si problème 🆘\n\nTape 'menu' pour revenir",
        audio: null
      }
    };
  }

  /**
   * Générer le message de bienvenue simplifié
   */
  async getWelcomeMessage(): Promise<{ audioMessage: MessageMedia | null; textMessage: string }> {
    const messages = this.getSimplifiedMessages();
    const welcome = messages.welcome;
    
    // Obtenir l'audio de bienvenue
    const audioMessage = await this.audioService.createAudioMessage(welcome.audio);
    
    return {
      audioMessage,
      textMessage: welcome.text
    };
  }

  /**
   * Générer le menu principal simplifié
   */
  getMainMenu(): string {
    const messages = this.getSimplifiedMessages();
    return messages.menu.text;
  }

  /**
   * Traiter la sélection d'option du menu
   */
  async handleMenuSelection(userId: string, option: string): Promise<{ success: boolean; message: string; newState?: UserState }> {
    const session = this.userSessionService.getSession(userId);
    
    switch (option) {
      case '1':
        this.userSessionService.updateSessionState(userId, UserState.WAITING_FOR_HEALTH_IMAGE);
        return {
          success: true,
          message: "📷 Envoie photo de ton plant\nJe vais l'analyser! 🔍",
          newState: UserState.WAITING_FOR_HEALTH_IMAGE
        };

      case '2':
        this.userSessionService.updateSessionState(userId, UserState.WAITING_FOR_ALERT_DETAILS);
        return {
          success: true,
          message: "🚨 Problème urgent?\nDécris ou envoie photo 📷",
          newState: UserState.WAITING_FOR_ALERT_DETAILS
        };

      case '3':
        const messages = this.getSimplifiedMessages();
        return {
          success: true,
          message: messages.help.text
        };

      default:
        return {
          success: false,
          message: "❌ Tape 1, 2 ou 3\n\n" + this.getMainMenu()
        };
    }
  }

  /**
   * Générer une réponse d'analyse simplifiée
   */
  async generateAnalysisResponse(
    isHealthy: boolean, 
    confidence: number, 
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<{ audioMessage: MessageMedia | null; textMessage: string }> {
    const messages = this.getSimplifiedMessages();
    let response;

    if (severity === 'critical') {
      response = messages.critical;
    } else if (isHealthy) {
      response = messages.healthy;
    } else {
      response = messages.diseased;
    }

    // Obtenir l'audio correspondant
    const audioMessage = response.audio 
      ? await this.audioService.createAudioMessage(response.audio)
      : null;

    // Ajouter niveau de confiance si pertinent
    let textMessage = response.text;
    if (confidence < 0.7 && !isHealthy) {
      textMessage += "\n\n🤔 Pas sûr à 100%\nMontre à un expert si possible";
    }

    return {
      audioMessage,
      textMessage
    };
  }

  /**
   * Générer message d'analyse en cours
   */
  async getAnalyzingMessage(): Promise<{ audioMessage: MessageMedia | null; textMessage: string }> {
    const messages = this.getSimplifiedMessages();
    const analyzing = messages.analyzing;
    
    const audioMessage = analyzing.audio 
      ? await this.audioService.createAudioMessage(analyzing.audio)
      : null;

    return {
      audioMessage,
      textMessage: analyzing.text
    };
  }

  /**
   * Générer message pour photo pas claire
   */
  async getUnclearPhotoMessage(): Promise<{ audioMessage: MessageMedia | null; textMessage: string }> {
    const messages = this.getSimplifiedMessages();
    const unclear = messages.unclear;
    
    const audioMessage = unclear.audio 
      ? await this.audioService.createAudioMessage(unclear.audio)
      : null;

    return {
      audioMessage,
      textMessage: unclear.text
    };
  }

  /**
   * Vérifier si un message est une commande simple
   */
  isSimpleCommand(message: string): boolean {
    const lowerMessage = message.toLowerCase().trim();
    const simpleCommands = [
      '1', '2', '3',
      'oui', 'non', 'ok',
      'aide', 'help', '?',
      'menu', 'retour', 'back',
      'salut', 'bonjour', 'hi', 'hello'
    ];
    
    return simpleCommands.includes(lowerMessage);
  }

  /**
   * Obtenir aide contextuelle selon l'état
   */
  getContextualHelp(userId: string): string {
    const session = this.userSessionService.getSession(userId);
    
    switch (session.state) {
      case UserState.IDLE:
        return "👋 Dis 'salut' pour commencer!";
        
      case UserState.MAIN_MENU:
        return "🌾 Tu es dans le menu.\n\n" + this.getMainMenu();
        
      case UserState.WAITING_FOR_HEALTH_IMAGE:
        return "📷 Envoie photo de ton plant\nOu tape 'menu' pour revenir";
        
      case UserState.WAITING_FOR_PEST_IMAGE:
        return "📷 Envoie photo du problème\nOu tape 'menu' pour revenir";
        
      case UserState.WAITING_FOR_ALERT_DETAILS:
        return "🚨 Décris ton problème urgent\nOu envoie photo 📷";
        
      default:
        return "❓ Tape 'salut' pour recommencer";
    }
  }

  /**
   * Vérifier si c'est une commande de retour au menu
   */
  isReturnToMenuCommand(message: string): boolean {
    const lowerMessage = message.toLowerCase().trim();
    return ['menu', 'retour', 'back', 'accueil'].includes(lowerMessage);
  }

  /**
   * Retourner au menu principal
   */
  returnToMainMenu(userId: string): string {
    this.userSessionService.updateSessionState(userId, UserState.MAIN_MENU);
    return "🔄 Retour au menu\n\n" + this.getMainMenu();
  }

  /**
   * Générer message d'erreur simplifié
   */
  getErrorMessage(): string {
    return "❌ Problème technique\nRéessaie dans un moment\nOu tape 'aide'";
  }

  /**
   * Générer message de bienvenue pour nouveaux utilisateurs
   */
  async getFirstTimeUserMessage(): Promise<{ audioMessage: MessageMedia | null; textMessage: string }> {
    const welcomeResponse = await this.getWelcomeMessage();
    
    // Ajouter instructions supplémentaires pour nouveaux utilisateurs
    const enhancedText = welcomeResponse.textMessage + 
      "\n\n💡 Première fois?\n• Prends photo claire 📷\n• Avec bonne lumière ☀️\n• Plant bien visible 🌱";

    return {
      audioMessage: welcomeResponse.audioMessage,
      textMessage: enhancedText
    };
  }

  /**
   * Statistiques d'utilisation simplifiées
   */
  getUsageStats(): any {
    return {
      totalInteractions: 0, // À implémenter avec base de données
      successfulAnalyses: 0,
      averageResponseTime: 0,
      userSatisfaction: 0
    };
  }

  /**
   * Valider si l'audio est disponible
   */
  async validateAudioAvailability(): Promise<{ available: string[]; missing: string[] }> {
    const messages = this.getSimplifiedMessages();
    const available: string[] = [];
    const missing: string[] = [];

    for (const [key, message] of Object.entries(messages)) {
      if (message.audio) {
        try {
          const audio = await this.audioService.createAudioMessage(message.audio);
          if (audio) {
            available.push(message.audio);
          } else {
            missing.push(message.audio);
          }
        } catch (error) {
          missing.push(message.audio);
        }
      }
    }

    return { available, missing };
  }
}
