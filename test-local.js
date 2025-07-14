/**
 * Script de test local pour vérifier que WhatsApp Web.js fonctionne
 * avant de déployer sur Railway
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('🧪 Test local de WhatsApp Web.js...');

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './test-sessions'
  }),
  puppeteer: {
    headless: false, // Mode visible pour voir ce qui se passe
    args: ['--no-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('📱 QR Code généré avec succès !');
  qrcode.generate(qr, { small: true });
  console.log('\n✅ Si vous voyez le QR code ci-dessus, WhatsApp Web.js fonctionne !');
  console.log('🚀 Vous pouvez maintenant déployer sur Railway.');
});

client.on('ready', () => {
  console.log('✅ Bot connecté avec succès !');
  console.log('🎯 WhatsApp Web.js fonctionne parfaitement.');
  process.exit(0);
});

client.on('auth_failure', (msg) => {
  console.error('❌ Échec authentification:', msg);
  process.exit(1);
});

client.on('disconnected', (reason) => {
  console.log('📵 Déconnecté:', reason);
  process.exit(1);
});

// Timeout de sécurité
setTimeout(() => {
  console.error('⏰ Timeout - Le test a pris trop de temps');
  process.exit(1);
}, 60000);

console.log('🚀 Démarrage du test...');
client.initialize();
