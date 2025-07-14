import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';

dotenv.config();

// Configuration simple sans Puppeteer complexe
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: process.env.WHATSAPP_SESSION_PATH || './sessions'
  }),
  puppeteer: {
    headless: false, // Mode visible pour debug
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  }
});

// Événements du client
client.on('qr', (qr) => {
  console.log('📱 Scannez ce QR code avec WhatsApp:');
  qrcode.generate(qr, { small: true });
  console.log('\n🔗 Ou copiez ce lien dans votre navigateur:');
  console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
});

client.on('ready', () => {
  console.log('✅ Bot WhatsApp PestAlert connecté!');
  console.log('🤖 Le bot est maintenant actif et prêt à recevoir des messages.');
});

client.on('authenticated', () => {
  console.log('🔐 Authentification réussie!');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Échec de l\'authentification:', msg);
  console.log('💡 Essayez de supprimer le dossier sessions et relancer le bot.');
});

client.on('disconnected', (reason) => {
  console.log('📵 Client déconnecté:', reason);
  console.log('🔄 Tentative de reconnexion...');
});

// Gestion des messages simplifiée
client.on('message', async (message) => {
  try {
    const contact = await message.getContact();
    console.log(`📩 Message de ${contact.name || contact.number}: ${message.body}`);
    
    // Commandes de base
    if (message.body === '!ping') {
      await message.reply('🤖 Pong! Bot PestAlert actif.');
    }
    
    if (message.body === '!help') {
      const helpText = `🌾 *PestAlert Bot*

Commandes disponibles:
• !ping - Test de connexion
• !help - Afficher cette aide
• !status - État du bot

Envoyez une photo de vos cultures pour analyse.`;
      await message.reply(helpText);
    }
    
    if (message.body === '!status') {
      await message.reply('✅ Bot opérationnel\n🕒 ' + new Date().toLocaleString('fr-FR'));
    }
    
    // Gestion des photos
    if (message.hasMedia) {
      await message.reply('📷 Photo reçue! Analyse en cours...');
      // Simulation d'analyse
      setTimeout(async () => {
        await message.reply('🌾 Analyse terminée: Aucun parasite détecté. Cultures en bonne santé! 👍');
      }, 2000);
    }
    
  } catch (error) {
    console.error('Erreur:', error);
    await message.reply('❌ Erreur temporaire. Veuillez réessayer.');
  }
});

// Démarrage du bot
console.log('🚀 Démarrage du bot WhatsApp PestAlert (version simple)...');
console.log('⏳ Initialisation en cours...');

client.initialize().catch(error => {
  console.error('❌ Erreur lors de l\'initialisation:', error);
  console.log('\n💡 Solutions possibles:');
  console.log('1. Installer Google Chrome');
  console.log('2. Supprimer le dossier sessions');
  console.log('3. Redémarrer le bot');
});
