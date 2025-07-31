/**
 * Vérifier le format exact des numéros dans la configuration
 */

import { defaultAllowedNumbers } from './config/allowedNumbers';

console.log('🔍 VÉRIFICATION FORMAT NUMÉROS\n');

const targetNumber = '22999323073';
console.log(`🎯 Numéro cible: "${targetNumber}"`);
console.log(`📏 Longueur: ${targetNumber.length} caractères`);
console.log('');

console.log('📋 ANALYSE DE LA LISTE:');
defaultAllowedNumbers.allowedUsers.forEach((number, index) => {
  const isTarget = number === targetNumber;
  console.log(`${index + 1}. "${number}" (${number.length} chars) ${isTarget ? '← CIBLE ✅' : ''}`);
  
  if (isTarget) {
    // Analyse caractère par caractère
    console.log('   🔍 Analyse caractère par caractère:');
    for (let i = 0; i < number.length; i++) {
      const char = number[i];
      const code = char.charCodeAt(0);
      console.log(`      [${i}] "${char}" (code: ${code})`);
    }
  }
});

console.log('\n🧪 TESTS DE CORRESPONDANCE:');
console.log(`   Exact match: ${defaultAllowedNumbers.allowedUsers.includes(targetNumber)}`);
console.log(`   Index dans liste: ${defaultAllowedNumbers.allowedUsers.indexOf(targetNumber)}`);

// Test avec différents formats
const testFormats = [
  targetNumber,
  ` ${targetNumber}`,  // Espace avant
  `${targetNumber} `,  // Espace après
  ` ${targetNumber} `, // Espaces des deux côtés
  targetNumber.trim()  // Nettoyé
];

console.log('\n🔧 TESTS AVEC ESPACES:');
testFormats.forEach((format, index) => {
  const found = defaultAllowedNumbers.allowedUsers.includes(format);
  console.log(`   ${index + 1}. "${format}" (${format.length} chars) → ${found ? '✅' : '❌'}`);
});

console.log('\n💡 RECOMMANDATIONS:');
if (defaultAllowedNumbers.allowedUsers.includes(targetNumber)) {
  console.log('✅ Le numéro 22999323073 est bien dans la liste');
  console.log('🔍 Le problème vient probablement du format reçu par WhatsApp');
  console.log('📋 Utilisez le script debug-real-messages.ts pour voir le format exact');
} else {
  console.log('❌ Le numéro 22999323073 N\'EST PAS dans la liste !');
  console.log('🔧 Vérifiez la configuration dans allowedNumbers.ts');
}
