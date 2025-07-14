import { openEPIConfig } from '../config/openepi';

/**
 * Service d'authentification OAuth2 pour OpenEPI
 */
export class AuthService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Obtenir un token d'accès valide
   */
  async getAccessToken(): Promise<string> {
    // Vérifier si le token actuel est encore valide
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Obtenir un nouveau token
    return await this.refreshAccessToken();
  }

  /**
   * Obtenir un nouveau token d'accès
   */
  private async refreshAccessToken(): Promise<string> {
    try {
      console.log('🔐 Obtention d\'un nouveau token d\'accès OpenEPI...');

      // Préparer les données en format form-urlencoded
      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');
      formData.append('client_id', openEPIConfig.clientId);
      formData.append('client_secret', openEPIConfig.clientSecret);

      const tokenResponse = await fetch(openEPIConfig.authURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: formData.toString()
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Authentification échouée: ${tokenResponse.status} - ${errorText}`);
      }

      const tokenJson: any = await tokenResponse.json();

      if (!tokenJson.access_token) {
        throw new Error('Token d\'accès non reçu dans la réponse');
      }

      this.accessToken = tokenJson.access_token;

      // Calculer l'expiration (généralement expires_in est en secondes)
      const expiresIn = tokenJson.expires_in || 3600; // 1 heure par défaut
      this.tokenExpiry = Date.now() + (expiresIn * 1000) - 60000; // -1 minute de sécurité

      console.log('✅ Token d\'accès obtenu avec succès');
      return this.accessToken!;

    } catch (error: any) {
      console.error('❌ Erreur lors de l\'authentification:', error.message);
      throw new Error(`Impossible d'obtenir le token d'accès: ${error.message}`);
    }
  }

  /**
   * Vérifier si l'authentification est configurée
   */
  isConfigured(): boolean {
    const configured = !!(openEPIConfig.clientId && openEPIConfig.clientSecret);
    console.log('🔐 Configuration auth:', {
      clientId: openEPIConfig.clientId ? 'Configuré' : 'Manquant',
      clientSecret: openEPIConfig.clientSecret ? 'Configuré' : 'Manquant',
      configured
    });
    return configured;
  }

  /**
   * Réinitialiser le token (forcer une nouvelle authentification)
   */
  resetToken(): void {
    this.accessToken = null;
    this.tokenExpiry = 0;
  }

  /**
   * Obtenir les headers d'authentification
   */
  async getAuthHeaders(): Promise<{ [key: string]: string }> {
    const token = await this.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }
}
