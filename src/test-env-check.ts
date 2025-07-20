/**
 * Vérifier les variables d'environnement
 */

console.log('🔍 VÉRIFICATION VARIABLES D\'ENVIRONNEMENT\n');

console.log('📋 Variables importantes:');
console.log(`   PLANTNET_API_KEY: ${process.env.PLANTNET_API_KEY ? 'DÉFINIE ✅' : 'MANQUANTE ❌'}`);
console.log(`   OPENEPI_CLIENT_ID: ${process.env.OPENEPI_CLIENT_ID ? 'DÉFINIE ✅' : 'MANQUANTE ❌'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'non défini'}`);

if (process.env.PLANTNET_API_KEY) {
  const key = process.env.PLANTNET_API_KEY;
  console.log(`   Clé PlantNet: ${key.substring(0, 5)}...${key.substring(key.length - 3)} (${key.length} caractères)`);
} else {
  console.log('   ❌ PLANTNET_API_KEY non trouvée');
}

console.log('\n🔧 Solutions si manquante:');
console.log('   1. Vérifier le fichier .env');
console.log('   2. Redémarrer le terminal/processus');
console.log('   3. Vérifier que dotenv est chargé');

// Test direct de la clé
const testKey = '2b10u4Mq704bleiuaAps4k5ITu';
console.log(`\n🧪 Test avec clé directe: ${testKey.substring(0, 5)}...${testKey.substring(testKey.length - 3)}`);

// Charger dotenv explicitement
try {
  require('dotenv').config();
  console.log('\n🔄 dotenv rechargé');
  console.log(`   PLANTNET_API_KEY après reload: ${process.env.PLANTNET_API_KEY ? 'TROUVÉE ✅' : 'TOUJOURS MANQUANTE ❌'}`);
} catch (error) {
  console.log('\n❌ Erreur chargement dotenv:', error);
}
