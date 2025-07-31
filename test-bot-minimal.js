console.log('🚀 Test Bot Minimal...');

require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('📱 Création du client WhatsApp...');

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'pestalert-bot'
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
});

console.log('🔗 Configuration des événements...');

client.on('qr', (qr) => {
  console.log('📱 QR Code généré:');
  qrcode.generate(qr, { small: true });
  console.log('🔗 Ou scannez ce lien:', `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`);
});

client.on('ready', () => {
  console.log('✅ WhatsApp connecté avec succès !');
  console.log('🎯 Mode simplifié:', process.env.SIMPLIFIED_MODE);
});

client.on('authenticated', () => {
  console.log('🔐 Authentification réussie');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Échec authentification:', msg);
});

client.on('disconnected', (reason) => {
  console.log('📵 Déconnecté:', reason);
});

client.on('message', async (message) => {
  const contact = await message.getContact();
  console.log(`📩 Message de ${contact.name || contact.number}: ${message.body}`);
  
  // Test simple du mode simplifié
  if (message.body.toLowerCase() === 'salut') {
    await message.reply('👋 Salut ! Mode simplifié Phase 0 activé !\n\n🌾 PestAlert t\'aide:\n1️⃣ 📷 Photo plant\n2️⃣ 🚨 Urgent\n3️⃣ ❓ Aide\n\nTape: 1, 2 ou 3');
  }
});

console.log('🚀 Démarrage du client...');
client.initialize().catch(error => {
  console.error('❌ Erreur initialisation:', error);
});
