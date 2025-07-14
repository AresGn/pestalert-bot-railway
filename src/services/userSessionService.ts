/**
 * Service pour gérer les sessions et états des utilisateurs
 */

export interface UserSession {
  userId: string;
  state: UserState;
  lastActivity: Date;
  context?: any;
}

export enum UserState {
  IDLE = 'idle',
  MAIN_MENU = 'main_menu',
  WAITING_FOR_HEALTH_IMAGE = 'waiting_for_health_image',
  WAITING_FOR_PEST_IMAGE = 'waiting_for_pest_image',
  WAITING_FOR_ALERT_DETAILS = 'waiting_for_alert_details'
}

export class UserSessionService {
  private sessions: Map<string, UserSession> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  /**
   * Obtenir ou créer une session utilisateur
   */
  getSession(userId: string): UserSession {
    let session = this.sessions.get(userId);
    
    if (!session) {
      session = {
        userId,
        state: UserState.IDLE,
        lastActivity: new Date(),
        context: {}
      };
      this.sessions.set(userId, session);
      console.log(`📝 Nouvelle session créée pour ${userId}`);
    } else {
      // Mettre à jour l'activité
      session.lastActivity = new Date();
    }
    
    return session;
  }

  /**
   * Mettre à jour l'état d'une session
   */
  updateSessionState(userId: string, newState: UserState, context?: any): void {
    const session = this.getSession(userId);
    const oldState = session.state;
    
    session.state = newState;
    session.lastActivity = new Date();
    
    if (context) {
      session.context = { ...session.context, ...context };
    }
    
    console.log(`🔄 Session ${userId}: ${oldState} → ${newState}`);
  }

  /**
   * Vérifier si l'utilisateur est dans un état spécifique
   */
  isUserInState(userId: string, state: UserState): boolean {
    const session = this.getSession(userId);
    return session.state === state;
  }

  /**
   * Réinitialiser une session à l'état IDLE
   */
  resetSession(userId: string): void {
    const session = this.getSession(userId);
    session.state = UserState.IDLE;
    session.context = {};
    session.lastActivity = new Date();
    console.log(`🔄 Session ${userId} réinitialisée`);
  }

  /**
   * Obtenir le contexte d'une session
   */
  getSessionContext(userId: string): any {
    const session = this.getSession(userId);
    return session.context || {};
  }

  /**
   * Nettoyer les sessions expirées
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    this.sessions.forEach((session, userId) => {
      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
      if (timeSinceLastActivity > this.SESSION_TIMEOUT) {
        expiredSessions.push(userId);
      }
    });

    expiredSessions.forEach(userId => {
      this.sessions.delete(userId);
      console.log(`🗑️ Session expirée supprimée: ${userId}`);
    });

    if (expiredSessions.length > 0) {
      console.log(`🧹 ${expiredSessions.length} sessions expirées nettoyées`);
    }
  }

  /**
   * Obtenir le nombre de sessions actives
   */
  getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  /**
   * Obtenir toutes les sessions actives (pour debug)
   */
  getAllSessions(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Démarrer le nettoyage automatique des sessions
   */
  startSessionCleanup(): void {
    // Nettoyer toutes les 10 minutes
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 10 * 60 * 1000);
    
    console.log('🧹 Nettoyage automatique des sessions démarré (toutes les 10 minutes)');
  }
}
