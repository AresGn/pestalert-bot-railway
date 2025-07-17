/**
 * Configuration des numéros autorisés pour PestAlert Bot
 * 
 * Format des numéros : 
 * - Format international sans le + : 22912345678
 * - Le bot ajoutera automatiquement @c.us
 * 
 * Exemples :
 * - Bénin : 22912345678
 * - France : 33123456789
 * - Sénégal : 22112345678
 */

export interface AllowedNumbersConfig {
  // Numéros d'administrateurs (accès complet)
  adminNumbers: string[];
  
  // Numéros d'utilisateurs autorisés (accès normal)
  allowedUsers: string[];
  
  // Préfixes de pays autorisés (optionnel)
  allowedCountryCodes: string[];
  
  // Mode de filtrage
  filterMode: 'whitelist' | 'country' | 'disabled';
  
  // Alertes pour tentatives d'accès non autorisées
  alertOnUnauthorized: boolean;
}

// Configuration par défaut
export const defaultAllowedNumbers: AllowedNumbersConfig = {
  // 🔧 MODIFIEZ CES NUMÉROS SELON VOS BESOINS
  adminNumbers: [
    // Exemples - remplacez par vos vrais numéros d'admin
    // '22912345678',  // Admin principal Bénin
    // '33123456789',  // Admin France
  ],
  
  allowedUsers: [
    // Exemples - remplacez par vos vrais numéros d'utilisateurs
    // '22911111111',  // Utilisateur 1 Bénin
    // '22922222222',  // Utilisateur 2 Bénin
    // '22133333333',  // Utilisateur Sénégal
  ],
  
  // Codes pays autorisés (sans le +)
  allowedCountryCodes: [
    '229',  // Bénin
    '221',  // Sénégal
    '33',   // France
    '1',    // USA/Canada
  ],
  
  // Mode de filtrage :
  // 'whitelist' = Seulement les numéros dans adminNumbers + allowedUsers
  // 'country' = Tous les numéros des pays dans allowedCountryCodes
  // 'disabled' = Aucun filtrage (répond à tous)
  filterMode: 'disabled', // 🔧 CHANGEZ EN 'whitelist' ou 'country' pour activer le filtrage
  
  // Alerter les admins en cas de tentative d'accès non autorisée
  alertOnUnauthorized: true
};

// Fonction pour charger la configuration depuis les variables d'environnement
export function loadAllowedNumbersFromEnv(): AllowedNumbersConfig {
  const config = { ...defaultAllowedNumbers };
  
  // Charger depuis les variables d'environnement si disponibles
  if (process.env.ADMIN_NUMBERS) {
    config.adminNumbers = process.env.ADMIN_NUMBERS.split(',').map(n => n.trim());
  }
  
  if (process.env.ALLOWED_USERS) {
    config.allowedUsers = process.env.ALLOWED_USERS.split(',').map(n => n.trim());
  }
  
  if (process.env.ALLOWED_COUNTRY_CODES) {
    config.allowedCountryCodes = process.env.ALLOWED_COUNTRY_CODES.split(',').map(n => n.trim());
  }
  
  if (process.env.FILTER_MODE) {
    config.filterMode = process.env.FILTER_MODE as 'whitelist' | 'country' | 'disabled';
  }
  
  if (process.env.ALERT_ON_UNAUTHORIZED) {
    config.alertOnUnauthorized = process.env.ALERT_ON_UNAUTHORIZED === 'true';
  }
  
  return config;
}

// Fonction pour valider un numéro
export function isNumberAllowed(phoneNumber: string, config: AllowedNumbersConfig): {
  allowed: boolean;
  reason: string;
  isAdmin: boolean;
} {
  // Nettoyer le numéro (enlever @c.us si présent)
  const cleanNumber = phoneNumber.replace('@c.us', '');
  
  // Si le filtrage est désactivé
  if (config.filterMode === 'disabled') {
    return {
      allowed: true,
      reason: 'Filtrage désactivé',
      isAdmin: false
    };
  }
  
  // Vérifier si c'est un admin
  const isAdmin = config.adminNumbers.includes(cleanNumber);
  if (isAdmin) {
    return {
      allowed: true,
      reason: 'Numéro administrateur',
      isAdmin: true
    };
  }
  
  // Mode whitelist : vérifier la liste des utilisateurs autorisés
  if (config.filterMode === 'whitelist') {
    const isAllowedUser = config.allowedUsers.includes(cleanNumber);
    return {
      allowed: isAllowedUser,
      reason: isAllowedUser ? 'Numéro autorisé' : 'Numéro non autorisé',
      isAdmin: false
    };
  }
  
  // Mode country : vérifier le code pays
  if (config.filterMode === 'country') {
    const isAllowedCountry = config.allowedCountryCodes.some(code => 
      cleanNumber.startsWith(code)
    );
    return {
      allowed: isAllowedCountry,
      reason: isAllowedCountry ? 'Pays autorisé' : 'Pays non autorisé',
      isAdmin: false
    };
  }
  
  return {
    allowed: false,
    reason: 'Mode de filtrage inconnu',
    isAdmin: false
  };
}
