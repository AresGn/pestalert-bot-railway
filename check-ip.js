/**
 * Script pour vérifier votre IP publique
 */

const https = require('https');

console.log('🔍 Vérification de votre IP publique...\n');

// Méthode 1: ipify.org
https.get('https://api.ipify.org?format=json', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('📍 Votre IP publique (ipify): ' + result.ip);
    } catch (e) {
      console.log('❌ Erreur ipify:', e.message);
    }
  });
}).on('error', (e) => {
  console.log('❌ Erreur connexion ipify:', e.message);
});

// Méthode 2: httpbin.org
https.get('https://httpbin.org/ip', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('📍 Votre IP publique (httpbin): ' + result.origin);
    } catch (e) {
      console.log('❌ Erreur httpbin:', e.message);
    }
  });
}).on('error', (e) => {
  console.log('❌ Erreur connexion httpbin:', e.message);
});

// Instructions
setTimeout(() => {
  console.log('\n🔧 ÉTAPES POUR RÉSOUDRE:');
  console.log('1. Copiez votre IP ci-dessus');
  console.log('2. Allez sur https://my.plantnet.org');
  console.log('3. Connectez-vous à votre compte');
  console.log('4. Cherchez "IP Whitelist" ou "Security"');
  console.log('5. Ajoutez votre IP à la liste autorisée');
  console.log('6. Sauvegardez les changements');
  console.log('\n💡 Si pas d\'option IP, contactez support PlantNet');
}, 2000);
