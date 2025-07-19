import { MessageMedia } from 'whatsapp-web.js';
import { AudioService } from './audioService';
import { UserSessionService } from './userSessionService';

/**
 * Types pour la gestion des modes d'interaction
 */
export type SupportedLanguage = 'fr' | 'bambara' | 'moore' | 'ewe' | 'dioula' | 'fon';
export type InteractionMode = 'audio_plus' | 'simplified' | 'multilingual';
export type LiteracyLevel = 'basic' | 'intermediate' | 'advanced';

export interface UserProfile {
  userId: string;
  preferredLanguage: SupportedLanguage;
  interactionMode: InteractionMode;
  literacyLevel: LiteracyLevel;
  audioPreference: boolean;
  detectedFromMessages: string[];
  lastUpdated: Date;
}

export interface AdaptedResponse {
  audioMessage: MessageMedia | null;
  textMessage: string;
  useEmojis: boolean;
  simplified: boolean;
}

export interface LanguageKeywords {
  [key: string]: string[];
}

/**
 * Service pour gérer les modes d'interaction adaptés aux utilisateurs d'Afrique de l'Ouest
 */
export class InteractionModeService {
  private audioService: AudioService;
  private userSessionService: UserSessionService;
  private userProfiles: Map<string, UserProfile> = new Map();

  // Mots-clés pour détecter les langues locales
  private languageKeywords: LanguageKeywords = {
    bambara: ['ni ce', 'sɛnɛkɛ', 'ka nyɛ', 'an ka', 'i bɛ', 'sɛnɛkɛla', 'ka kɛ'],
    moore: ['yaa soaba', 'tɩ', 'sɛba', 'yaa', 'tõnd', 'sɛn', 'kõm'],
    ewe: ['woezɔ', 'agble', 'nuku', 'míawo', 'ɖe', 'wò', 'agbledɔwɔla'],
    dioula: ['an sɔrɔ', 'sɛnɛ', 'ka kɛ', 'i ni ce', 'sɛnɛkɛ', 'ka di'],
    fon: ['kú àbó', 'gbè', 'àzɔ̃', 'mì', 'wè', 'gbèdoto', 'àgblɛ']
  };

  // Messages simplifiés par langue
  private simpleMessages = {
    fr: {
      welcome: "👋 Salut ami! PestAlert ka i dɛmɛ 🌾",
      menu: "Ton plant:\n1️⃣ 📷 Photo\n2️⃣ 🚨 Urgent\n3️⃣ ❓ Aide\n\nTape: 1, 2 ou 3",
      healthy: "✅ Ton plant va bien! 👍",
      diseased: "⚠️ Petites bêtes! Traite vite! 🐛",
      critical: "🚨 URGENT! Ton plant malade! 📞",
      unclear: "📷 Photo pas claire. Reprends avec lumière ☀️"
    },
    bambara: {
      welcome: "👋 I ni ce, sɛnɛkɛla! PestAlert bɛ yan 🌾",
      menu: "I ka sɛnɛkɛ:\n1️⃣ 📷 Ja\n2️⃣ 🚨 Teliya\n3️⃣ ❓ Dɛmɛ\n\nSɛbɛn: 1, 2 walima 3",
      healthy: "✅ I ka sɛnɛkɛ ka nyɛ! 👍",
      diseased: "⚠️ Kɔnɔbagaw bɛ yan! Ka furakɛ kɛ joona! 🐛",
      critical: "🚨 TELIYA! I ka sɛnɛkɛ banaw! 📞",
      unclear: "📷 Ja man jɛ ka nyɛ. Ka segin ni yeelen ye ☀️"
    },
    moore: {
      welcome: "👋 Yaa soaba, sɛnkɛdba! PestAlert yaa tɩ 🌾",
      menu: "A sɛnkɛ:\n1️⃣ 📷 Foto\n2️⃣ 🚨 Kõsem\n3️⃣ ❓ Sõalem\n\nSɛbga: 1, 2 kamba 3",
      healthy: "✅ A sɛnkɛ sɔm ka nyɛ! 👍",
      diseased: "⚠️ Yɩɩbsa be la! Ka yɩɩb-kõsem kɛ! 🐛",
      critical: "🚨 KÕSEM! A sɛnkɛ sɔm banaw! 📞",
      unclear: "📷 Foto kõ yɛlɛ. Ka segin ni yɛlɛm ye ☀️"
    }
  };

  constructor(audioService: AudioService, userSessionService: UserSessionService) {
    this.audioService = audioService;
    this.userSessionService = userSessionService;
  }

  /**
   * Détecter automatiquement le profil utilisateur basé sur ses messages
   */
  async detectUserProfile(userId: string, message: string): Promise<UserProfile> {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = {
        userId,
        preferredLanguage: 'fr', // Par défaut
        interactionMode: 'audio_plus',
        literacyLevel: 'basic',
        audioPreference: true,
        detectedFromMessages: [],
        lastUpdated: new Date()
      };
    }

    // Ajouter le message à l'historique
    profile.detectedFromMessages.push(message);
    
    // Détecter la langue
    const detectedLanguage = this.detectLanguage(message);
    if (detectedLanguage !== 'fr') {
      profile.preferredLanguage = detectedLanguage;
      profile.interactionMode = 'multilingual';
    }

    // Détecter le niveau d'alphabétisation
    profile.literacyLevel = this.detectLiteracyLevel(profile.detectedFromMessages);
    
    // Adapter le mode d'interaction
    profile.interactionMode = this.determineInteractionMode(profile);
    
    profile.lastUpdated = new Date();
    this.userProfiles.set(userId, profile);
    
    return profile;
  }

  /**
   * Détecter la langue d'un message
   */
  private detectLanguage(message: string): SupportedLanguage {
    const lowerMessage = message.toLowerCase();
    
    // Vérifier chaque langue
    for (const [language, keywords] of Object.entries(this.languageKeywords)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          return language as SupportedLanguage;
        }
      }
    }
    
    return 'fr'; // Par défaut français
  }

  /**
   * Détecter le niveau d'alphabétisation
   */
  private detectLiteracyLevel(messages: string[]): LiteracyLevel {
    if (messages.length === 0) return 'basic';
    
    const recentMessages = messages.slice(-5); // 5 derniers messages
    let totalLength = 0;
    let complexWords = 0;
    let errors = 0;
    
    for (const message of recentMessages) {
      totalLength += message.length;
      
      // Compter les mots complexes (plus de 8 caractères)
      const words = message.split(' ');
      complexWords += words.filter(word => word.length > 8).length;
      
      // Détecter des erreurs simples (répétitions, majuscules manquantes)
      if (message.includes('  ') || message.toLowerCase() === message) {
        errors++;
      }
    }
    
    const avgLength = totalLength / recentMessages.length;
    const complexityRatio = complexWords / recentMessages.length;
    
    if (avgLength > 50 && complexityRatio > 0.3 && errors < 2) {
      return 'advanced';
    } else if (avgLength > 20 && complexityRatio > 0.1) {
      return 'intermediate';
    }
    
    return 'basic';
  }

  /**
   * Déterminer le mode d'interaction optimal
   */
  private determineInteractionMode(profile: UserProfile): InteractionMode {
    if (profile.preferredLanguage !== 'fr') {
      return 'multilingual';
    }
    
    if (profile.literacyLevel === 'basic') {
      return 'audio_plus';
    }
    
    return 'simplified';
  }

  /**
   * Adapter une réponse selon le profil utilisateur
   */
  async adaptResponse(
    messageKey: string, 
    userId: string, 
    additionalData?: any
  ): Promise<AdaptedResponse> {
    const profile = this.userProfiles.get(userId) || await this.detectUserProfile(userId, '');
    
    // Obtenir le message texte adapté
    const textMessage = this.getLocalizedMessage(messageKey, profile.preferredLanguage);
    
    // Obtenir l'audio correspondant
    const audioMessage = await this.getLocalizedAudio(messageKey, profile.preferredLanguage);
    
    return {
      audioMessage,
      textMessage,
      useEmojis: profile.literacyLevel === 'basic',
      simplified: profile.interactionMode === 'simplified' || profile.literacyLevel === 'basic'
    };
  }

  /**
   * Obtenir un message localisé
   */
  private getLocalizedMessage(messageKey: string, language: SupportedLanguage): string {
    const messages = this.simpleMessages[language] || this.simpleMessages.fr;
    return messages[messageKey] || messages.welcome;
  }

  /**
   * Obtenir l'audio localisé
   */
  async getLocalizedAudio(messageKey: string, language: SupportedLanguage): Promise<MessageMedia | null> {
    // Construire le nom du fichier audio
    const audioFileName = language === 'fr' 
      ? `${messageKey}.mp3` 
      : `${messageKey}_${language}.mp3`;
    
    try {
      return await this.audioService.createAudioMessage(audioFileName);
    } catch (error) {
      console.log(`⚠️ Audio ${audioFileName} non trouvé, utilisation du français par défaut`);
      // Fallback vers le français
      return await this.audioService.createAudioMessage(`${messageKey}.mp3`);
    }
  }

  /**
   * Obtenir le profil d'un utilisateur
   */
  getUserProfile(userId: string): UserProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  /**
   * Mettre à jour manuellement le profil d'un utilisateur
   */
  updateUserProfile(userId: string, updates: Partial<UserProfile>): void {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      Object.assign(profile, updates, { lastUpdated: new Date() });
      this.userProfiles.set(userId, profile);
    }
  }

  /**
   * Vérifier si un message est simple (pour utilisateurs basic)
   */
  isSimpleMessage(message: string): boolean {
    const simplePatterns = [
      /^[123]$/, // Numéros 1, 2, 3
      /^(oui|non|ok|aide|help|\?)$/i, // Mots simples
      /^(salut|bonjour|hi|hello)$/i // Salutations
    ];
    
    return simplePatterns.some(pattern => pattern.test(message.trim()));
  }

  /**
   * Générer un menu adapté au profil utilisateur
   */
  async generateAdaptedMenu(userId: string): Promise<AdaptedResponse> {
    return await this.adaptResponse('menu', userId);
  }

  /**
   * Statistiques des profils utilisateurs
   */
  getProfileStats(): any {
    const stats = {
      total: this.userProfiles.size,
      byLanguage: {} as any,
      byMode: {} as any,
      byLiteracy: {} as any
    };

    for (const profile of this.userProfiles.values()) {
      // Stats par langue
      stats.byLanguage[profile.preferredLanguage] = 
        (stats.byLanguage[profile.preferredLanguage] || 0) + 1;
      
      // Stats par mode
      stats.byMode[profile.interactionMode] = 
        (stats.byMode[profile.interactionMode] || 0) + 1;
      
      // Stats par niveau
      stats.byLiteracy[profile.literacyLevel] = 
        (stats.byLiteracy[profile.literacyLevel] || 0) + 1;
    }

    return stats;
  }
}
