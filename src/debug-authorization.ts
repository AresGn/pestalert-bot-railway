/**
 * Script de diagnostic pour les problèmes d'autorisation
 */

import { AuthorizationService } from './services/authorizationService';
import { defaultAllowedNumbers, isNumberAllowed } from './config/allowedNumbers';

// Charger dotenv
require('dotenv').config();

console.log('🔍 DIAGNOSTIC AUTORISATION\n');
console.log('='.repeat(60));

// 1. Vérifier la configuration
console.log('📋 CONFIGURATION ACTUELLE:');
console.log('   Mode filtrage:', defaultAllowedNumbers.filterMode);
console.log('   Alertes:', defaultAllowedNumbers.alertOnUnauthorized);
console.log('   Admins:', defaultAllowedNumbers.adminNumbers);
console.log('   Utilisateurs autorisés:', defaultAllowedNumbers.allowedUsers);
console.log('');

// 2. Créer le service d'autorisation
const authService = new AuthorizationService();

// 3. Tester différents formats de numéros
const testNumbers = [
  // Formats possibles pour l'utilisateur 1 Bénin
  '22999323073',           // Format propre
  '22999323073@c.us',      // Format WhatsApp
  '+22999323073',          // Format international
  '+22999323073@c.us',     // Format international + WhatsApp
  
  // Autres utilisateurs autorisés
  '22990646499',
  '22990646499@c.us',
  
  // Numéro non autorisé pour comparaison
  '22911111111',
  '22911111111@c.us'
];

console.log('🧪 TESTS D\'AUTORISATION:');
console.log('-'.repeat(60));

testNumbers.forEach(number => {
  console.log(`\n📱 Test numéro: "${number}"`);
  
  // Test avec la fonction directe
  const directResult = isNumberAllowed(number, defaultAllowedNumbers);
  console.log(`   📊 Fonction directe: ${directResult.allowed ? '✅ AUTORISÉ' : '❌ REFUSÉ'}`);
  console.log(`   📝 Raison: ${directResult.reason}`);
  console.log(`   👑 Admin: ${directResult.isAdmin ? 'Oui' : 'Non'}`);
  
  // Test avec le service
  const serviceResult = authService.checkAuthorization(number);
  console.log(`   🔧 Service: ${serviceResult.allowed ? '✅ AUTORISÉ' : '❌ REFUSÉ'}`);
  console.log(`   📝 Raison service: ${serviceResult.reason}`);
  console.log(`   🚨 Alerte: ${serviceResult.shouldAlert ? 'Oui' : 'Non'}`);
});

console.log('\n' + '='.repeat(60));

// 4. Analyser les formats de numéros
console.log('\n🔍 ANALYSE DES FORMATS:');
console.log('-'.repeat(40));

const sampleNumber = '22999323073@c.us';
console.log(`📱 Numéro d'exemple: "${sampleNumber}"`);
console.log(`🧹 Nettoyé: "${sampleNumber.replace('@c.us', '')}"`);
console.log(`🔍 Dans la liste: ${defaultAllowedNumbers.allowedUsers.includes(sampleNumber.replace('@c.us', ''))}`);

// 5. Vérifier les variables d'environnement
console.log('\n🌍 VARIABLES D\'ENVIRONNEMENT:');
console.log('-'.repeat(40));
console.log(`FILTER_MODE: ${process.env.FILTER_MODE || 'non défini'}`);
console.log(`ADMIN_NUMBERS: ${process.env.ADMIN_NUMBERS || 'non défini'}`);
console.log(`ALLOWED_USERS: ${process.env.ALLOWED_USERS || 'non défini'}`);
console.log(`ALERT_ON_UNAUTHORIZED: ${process.env.ALERT_ON_UNAUTHORIZED || 'non défini'}`);

// 6. Recommandations
console.log('\n💡 RECOMMANDATIONS:');
console.log('-'.repeat(40));

if (defaultAllowedNumbers.filterMode === 'disabled') {
  console.log('⚠️  Le filtrage est DÉSACTIVÉ - tous les numéros sont autorisés');
} else if (defaultAllowedNumbers.filterMode === 'whitelist') {
  console.log('✅ Mode whitelist activé - seuls les numéros listés sont autorisés');
} else if (defaultAllowedNumbers.filterMode === 'country') {
  console.log('🌍 Mode pays activé - numéros des pays autorisés acceptés');
}

console.log('\n🔧 SOLUTIONS POSSIBLES:');
console.log('1. Vérifier que le numéro est exactement dans la liste (sans @c.us)');
console.log('2. Vérifier le mode de filtrage');
console.log('3. Regarder les logs du bot pour voir le format exact reçu');
console.log('4. Tester avec !auth stats depuis un numéro admin');

console.log('\n✅ Diagnostic terminé!');
