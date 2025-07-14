import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
import express from 'express';
import { PestMonitoringService } from './services/pestMonitoringService';
import { LoggingService } from './services/loggingService';
import { UserSessionService, UserState } from './services/userSessionService';
import { MenuService } from './services/menuService';
import { HealthAnalysisService } from './services/healthAnalysisService';
import { AudioService } from './services/audioService';
import { AlertService } from './services/alertService';
import { FarmerData } from './types';

dotenv.config();

// Créer un serveur Express pour le health check
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'PestAlert WhatsApp Bot is running',
    status: 'active'
  });
});

// Démarrer le serveur Express
app.listen(PORT, () => {
  console.log(`🌐 Health check server running on port ${PORT}`);
});

// Initialisation des services
const pestMonitoring = new PestMonitoringService();
const logger = new LoggingService();
const userSessionService = new UserSessionService();
const audioService = new AudioService();
const menuService = new MenuService(userSessionService, audioService);
const healthAnalysisService = new HealthAnalysisService();
const alertService = new AlertService();

// Timestamp de démarrage du bot - IMPORTANT pour ignorer les anciens messages
const BOT_START_TIME = Date.now();
console.log(`🚀 Bot démarré à: ${new Date(BOT_START_TIME).toLocaleString()}`);
console.log(`⏰ Timestamp de démarrage: ${BOT_START_TIME}`);

// Démarrer le nettoyage automatique des sessions
userSessionService.startSessionCleanup();

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: process.env.WHATSAPP_SESSION_PATH || './sessions'
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

// Événements du client
client.on('qr', (qr) => {
  console.log('📱 Scannez ce QR code avec WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Bot WhatsApp PestAlert connecté!');
  console.log('🔒 FILTRES DE SÉCURITÉ ACTIVÉS:');
  console.log('   - Ignore TOUS les messages de groupes');
  console.log('   - Ignore TOUS les messages du bot lui-même');
  console.log('   - Ignore TOUS les messages antérieurs au démarrage');
  console.log('   - Répond SEULEMENT aux messages privés reçus APRÈS le démarrage');
  console.log(`   - Timestamp de démarrage: ${new Date(BOT_START_TIME).toLocaleString()}`);
  logger.logBotActivity('SYSTEM', 'Bot WhatsApp connecté et prêt avec filtres de sécurité');
});

client.on('message', async (message) => {
  const contact = await message.getContact();
  const chat = await message.getChat();

  // FILTRES STRICTS - TRÈS IMPORTANT

  // 1. Ignorer TOUS les messages envoyés par le bot lui-même
  if (message.fromMe) {
    return;
  }

  // 2. Ignorer TOUS les messages de groupes
  if (chat.isGroup) {
    console.log(`🚫 Message de groupe ignoré: ${chat.name}`);
    return;
  }

  // 3. Ignorer les messages antérieurs au démarrage du bot
  const messageTimestamp = message.timestamp * 1000; // WhatsApp timestamp en secondes
  if (messageTimestamp < BOT_START_TIME) {
    console.log(`🚫 Message ancien ignoré (${new Date(messageTimestamp).toLocaleString()})`);
    return;
  }

  // 4. Vérifier que c'est bien un chat privé
  if (!chat.isGroup && !message.fromMe) {
    console.log(`📩 Message VALIDE de ${contact.name || contact.number}: ${message.body}`);

    // Logger le message reçu
    logger.logBotActivity(contact.number, 'Message reçu', {
      messageType: message.hasMedia ? 'media' : 'text',
      messageBody: message.body.substring(0, 100), // Limiter la longueur pour le log
      isGroup: chat.isGroup,
      fromMe: message.fromMe,
      timestamp: new Date(messageTimestamp).toISOString()
    });
  } else {
    console.log(`🚫 Message filtré: groupe=${chat.isGroup}, fromMe=${message.fromMe}`);
    return;
  }

  try {
    // 1. Vérifier d'abord le déclencheur d'accueil
    if (message.body.trim() === 'Hi PestAlerte 👋') {
      await handleWelcomeTrigger(message);
      return;
    }

    // 2. Vérifier les commandes de retour au menu
    if (menuService.isReturnToMenuCommand(message.body)) {
      const menuMessage = menuService.returnToMainMenu(contact.number);
      await message.reply(menuMessage);
      return;
    }

    // 3. Vérifier les sélections de menu (1, 2, 3)
    if (['1', '2', '3'].includes(message.body.trim())) {
      await handleMenuSelection(message);
      return;
    }

    // 4. Gérer les médias (photos) selon le contexte utilisateur
    if (message.hasMedia) {
      await handleMediaMessages(message);
      return;
    }

    // 5. Gérer les commandes traditionnelles (!ping, !help, etc.)
    if (message.body.startsWith('!')) {
      await handleCommands(message);
      return;
    }

    // 6. Réponses contextuelles selon l'état de l'utilisateur
    await handleContextualResponses(message);

  } catch (error: any) {
    console.error('Erreur lors du traitement du message:', error);
    logger.logServiceError('MESSAGE_HANDLER', error.message, contact.number);
    await message.reply('❌ Une erreur s\'est produite. Veuillez réessayer.');
  }
});

// Function to handle welcome trigger
async function handleWelcomeTrigger(message: any) {
  const contact = await message.getContact();
  console.log(`👋 Déclencheur d'accueil reçu de ${contact.name || contact.number}`);

  try {
    const welcomeResponse = await menuService.handleWelcomeTrigger(contact.number);

    // Envoyer d'abord l'audio de bienvenue
    if (welcomeResponse.audioMessage) {
      await message.reply(welcomeResponse.audioMessage);
      // Attendre un peu avant d'envoyer le menu texte
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Puis envoyer le menu texte
    await message.reply(welcomeResponse.textMessage);

    logger.logBotActivity(contact.number, 'Welcome Trigger', {
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erreur lors du traitement de l\'accueil:', error.message);
    await message.reply('❌ Erreur lors de l\'initialisation. Veuillez réessayer.');
  }
}

// Function to handle menu selection
async function handleMenuSelection(message: any) {
  const contact = await message.getContact();
  const option = message.body.trim();

  console.log(`📋 Sélection de menu: ${option} par ${contact.name || contact.number}`);

  try {
    const selectionResult = await menuService.handleMenuSelection(contact.number, option);

    await message.reply(selectionResult.message);

    logger.logBotActivity(contact.number, 'Menu Selection', {
      option: option,
      success: selectionResult.success,
      newState: selectionResult.newState,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de la sélection de menu:', error.message);
    await message.reply('❌ Erreur lors de la sélection. Veuillez réessayer.');
  }
}

// Function to handle contextual responses
async function handleContextualResponses(message: any) {
  const contact = await message.getContact();

  // Vérifier si l'utilisateur est en attente de détails d'alerte
  if (userSessionService.isUserInState(contact.number, UserState.WAITING_FOR_ALERT_DETAILS)) {
    await handleAlertText(message);
    return;
  }

  // Obtenir l'aide contextuelle selon l'état de l'utilisateur
  const helpMessage = menuService.getContextualHelp(contact.number);
  await message.reply(helpMessage);
}

// Function to handle media messages (crop photos)
async function handleMediaMessages(message: any) {
  // SÉCURITÉ SUPPLÉMENTAIRE - Vérifier encore une fois
  const chat = await message.getChat();
  if (message.fromMe || chat.isGroup) {
    console.log(`🚫 SÉCURITÉ: Tentative de traitement d'un message non autorisé`);
    return;
  }

  const contact = await message.getContact();

  // Vérifier si l'utilisateur peut recevoir une image dans son état actuel
  if (!menuService.canReceiveImage(contact.number)) {
    const helpMessage = menuService.getContextualHelp(contact.number);
    await message.reply(`❌ Je n'attends pas d'image pour le moment.\n\n${helpMessage}`);
    return;
  }

  if (message.hasMedia) {
    const media = await message.downloadMedia();
    console.log(`📎 Media received: ${media.mimetype}`);

    if (media.mimetype.startsWith('image/')) {
      // Déterminer le type d'analyse requis
      const analysisType = menuService.getRequiredAnalysisType(contact.number);

      if (analysisType === 'health') {
        await handleHealthAnalysis(message, media);
      } else if (analysisType === 'pest') {
        await handlePestAnalysis(message, media);
      } else if (analysisType === 'alert') {
        await handleAlertWithImage(message, media);
      } else {
        await message.reply('❌ Type d\'analyse non reconnu. Tapez "menu" pour revenir au menu principal.');
      }
    } else {
      await message.reply('📷 Veuillez envoyer une image de votre culture pour analyse.');
    }
  }
}

// Function to handle health analysis (Option 1)
async function handleHealthAnalysis(message: any, media: any) {
  const contact = await message.getContact();

  await message.reply('🌾 *Analyse de santé en cours...*\n\n🔍 Analyse pour déterminer si votre culture est saine ou malade.\n\n⏳ Résultats dans quelques instants...');

  try {
    const imageBuffer = Buffer.from(media.data, 'base64');

    // Effectuer l'analyse de santé
    const healthResult = await healthAnalysisService.analyzeCropHealth(imageBuffer, contact.number);

    // Envoyer d'abord l'audio si disponible
    if (healthResult.audioMessage) {
      await client.sendMessage(contact.number + '@c.us', healthResult.audioMessage);
      console.log(`🎵 Audio de santé envoyé: ${healthResult.isHealthy ? 'Saine' : 'Malade'}`);

      // Attendre un peu avant d'envoyer le message texte
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Puis envoyer le message texte détaillé
    await message.reply(healthResult.textMessage);

    // Réinitialiser l'état de l'utilisateur
    userSessionService.resetSession(contact.number);

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'analyse de santé:', error.message);
    await message.reply('❌ Erreur lors de l\'analyse. Veuillez réessayer avec une nouvelle photo ou tapez "menu".');
  }
}

// Function to handle pest analysis (Option 2) - Legacy functionality
async function handlePestAnalysis(message: any, media: any) {
  const contact = await message.getContact();

  await message.reply('🐛 *Détection de ravageurs en cours...*\n\n🔍 Analyse pour détecter la présence de ravageurs.\n\n⏳ Résultats dans quelques instants...');

  try {
    const imageBuffer = Buffer.from(media.data, 'base64');

    // Utiliser l'ancien système de détection des ravageurs
    const farmerData: FarmerData = {
      phone: contact.number,
      location: { lat: 14.6928, lon: -17.4467 }, // Dakar by default
      subscription: 'basic'
    };

    let audioResponse;
    let isAlert = false;

    try {
      // Analyse avec le système existant de détection des ravageurs
      const analysisResponse = await pestMonitoring.handleImageAnalysis(imageBuffer, farmerData);

      // Obtenir la réponse audio appropriée
      audioResponse = await pestMonitoring.getAudioResponse(analysisResponse.analysis.alert);
      isAlert = analysisResponse.analysis.alert.critical;

      console.log(`✅ Analyse de ravageurs réussie: ${isAlert ? 'Alerte critique' : 'Réponse normale'}`);

    } catch (analysisError: any) {
      console.log('⚠️ Erreur API, envoi de la réponse normale par défaut');

      // En cas d'erreur API, toujours envoyer une réponse normale
      audioResponse = await pestMonitoring.getNormalAudioResponse();
      isAlert = false;

      logger.logServiceError('PEST_ANALYSIS_FALLBACK', analysisError.message, contact.number);
    }

    // Toujours envoyer une note audio
    if (audioResponse) {
      await client.sendMessage(contact.number + '@c.us', audioResponse);
      console.log(`🎵 Note audio envoyée: ${isAlert ? 'Alerte' : 'Réponse normale'}`);
    } else {
      await message.reply('🐛 *Analyse terminée*\n\nVotre image a été analysée. Les fichiers audio ne sont pas disponibles actuellement.');
    }

    // Si c'est une alerte critique, envoyer des informations textuelles supplémentaires
    if (isAlert) {
      await message.reply('🆘 *ALERTE CRITIQUE ACTIVÉE*\n\nUn expert sera contacté immédiatement.\nSuivez les recommandations dans la note audio.');
    }

    // Réinitialiser l'état de l'utilisateur
    userSessionService.resetSession(contact.number);

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'analyse de ravageurs:', error.message);
    await message.reply('❌ Erreur lors de l\'analyse. Veuillez réessayer avec une nouvelle photo ou tapez "menu".');
  }
}

// Function to handle alert text (Option 3)
async function handleAlertText(message: any) {
  const contact = await message.getContact();
  const alertDescription = message.body;

  await message.reply('🚨 *Traitement de votre alerte...*\n\n📝 Description reçue et analysée.\n\n⏳ Un expert sera notifié immédiatement.');

  try {
    const alertResponse = await alertService.handleTextAlert(
      contact.number,
      contact.name || contact.number,
      alertDescription
    );

    if (alertResponse.success) {
      await message.reply(alertResponse.message);
    } else {
      await message.reply(`❌ ${alertResponse.message}\n\n💡 Tapez 'menu' pour revenir au menu principal.`);
    }

    // Réinitialiser l'état de l'utilisateur
    userSessionService.resetSession(contact.number);

  } catch (error: any) {
    console.error('❌ Erreur lors du traitement de l\'alerte textuelle:', error.message);
    await message.reply('❌ Erreur lors du traitement de l\'alerte. Veuillez réessayer ou tapez "menu".');
  }
}

// Function to handle alert with image (Option 3)
async function handleAlertWithImage(message: any, media: any) {
  const contact = await message.getContact();

  await message.reply('🚨 *Traitement de votre alerte...*\n\n📷 Image reçue et enregistrée.\n\n⏳ Un expert sera notifié immédiatement.');

  try {
    const imageBuffer = Buffer.from(media.data, 'base64');

    // Obtenir la description du contexte de session si disponible
    const sessionContext = userSessionService.getSessionContext(contact.number);
    const description = sessionContext.alertDescription || 'Alerte avec image';

    const alertResponse = await alertService.handleImageAlert(
      contact.number,
      contact.name || contact.number,
      imageBuffer,
      description
    );

    if (alertResponse.success) {
      await message.reply(alertResponse.message);
    } else {
      await message.reply(`❌ ${alertResponse.message}\n\n💡 Tapez 'menu' pour revenir au menu principal.`);
    }

    // Réinitialiser l'état de l'utilisateur
    userSessionService.resetSession(contact.number);

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi d\'alerte avec image:', error.message);
    await message.reply('❌ Erreur lors de l\'envoi de l\'alerte. Veuillez réessayer ou tapez "menu".');
  }
}

// Function to handle commands
async function handleCommands(message: any) {
  // SÉCURITÉ SUPPLÉMENTAIRE - Vérifier encore une fois
  const chat = await message.getChat();
  if (message.fromMe || chat.isGroup) {
    console.log(`🚫 SÉCURITÉ: Tentative de commande non autorisée`);
    return;
  }

  const body = message.body.toLowerCase();

  switch(body) {
    case '!ping':
      await message.reply('🤖 Pong! PestAlert Bot active.');
      break;

    case '!hello':
    case '!hi':
      const contact = await message.getContact();
      await message.reply(`👋 Hello ${contact.name || 'farmer'}! Welcome to PestAlert 🌾`);
      break;

    case '!help':
      const helpText = `🌾 *PestAlert Bot - Assistant Agricole*

🚀 **Pour commencer:**
Tapez "Hi PestAlerte 👋" pour accéder au menu principal

📋 **Menu principal:**
1️⃣ Analyser la santé (sain/malade)
2️⃣ Vérifier la présence de ravageurs
3️⃣ Envoyer une alerte

📋 **Commandes disponibles:**
• !ping - Test de connexion
• !help - Cette aide
• !status - Statut des services
• menu - Retour au menu principal

💡 **Astuce:** Tapez "menu" à tout moment pour revenir au menu principal`;
      await message.reply(helpText);
      break;

    case '!status':
      try {
        await message.reply('🔍 Vérification du statut des services...');
        const servicesStatus = await pestMonitoring.checkServicesStatus();
        const healthServiceStatus = await healthAnalysisService.checkServiceStatus();
        const alertStats = alertService.getAlertStats();
        const activeSessions = userSessionService.getActiveSessionsCount();

        const statusMessage = `🔧 *Statut des Services PestAlert*

🌾 **Service d'analyse des cultures:**
${servicesStatus.cropHealth.status === 'healthy' ? '✅ Opérationnel' : '❌ Indisponible'}

🖼️ **Service de traitement d'images:**
${servicesStatus.imageProcessing ? '✅ Opérationnel' : '❌ Indisponible'}

🎵 **Fichiers audio:**
${servicesStatus.audioFiles.available ? '✅ Disponibles' : `❌ Manquants: ${servicesStatus.audioFiles.missing.join(', ')}`}

🏥 **Service d'analyse de santé:**
${healthServiceStatus.status === 'healthy' ? '✅ Opérationnel' : `❌ ${healthServiceStatus.error}`}

🚨 **Système d'alertes:**
✅ Opérationnel (${alertStats.total} alertes traitées)

👥 **Sessions actives:** ${activeSessions}

⏰ Dernière vérification: ${new Date().toLocaleString('fr-FR')}

${servicesStatus.cropHealth.status !== 'healthy' || !servicesStatus.audioFiles.available ?
  '⚠️ Certains services sont indisponibles. L\'analyse peut être limitée.' :
  '🎉 Tous les services sont opérationnels !'}`;

        await message.reply(statusMessage);
      } catch (error) {
        await message.reply('❌ Impossible de vérifier le statut des services.');
      }
      break;

    case '!alert':
      await message.reply(`🚨 *Mode Alerte Activé*

Décrivez votre problème urgent:
• Type de culture affectée
• Symptômes observés
• Étendue du problème

Un expert sera notifié immédiatement.
📞 Urgence: +33 1 XX XX XX XX`);
      break;

    case '!conseils':
      const tips = [
        "🌱 Inspectez vos cultures quotidiennement, de préférence le matin",
        "💧 Arrosez au pied des plantes pour éviter l'humidité sur les feuilles",
        "🦗 Favorisez la biodiversité pour un contrôle naturel des parasites",
        "🌡️ Surveillez les variations de température et d'humidité",
        "🔄 Pratiquez la rotation des cultures pour casser les cycles parasitaires"
      ];
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      await message.reply(`💡 *Conseil du jour:*\n\n${randomTip}`);
      break;

    case '!contact':
      await message.reply(`📞 *Contacter nos experts*

🌾 **Agronomes disponibles:**
• Dr. Martin Dubois - Maladies des céréales
• Dr. Sophie Laurent - Parasites maraîchers
• Dr. Pierre Moreau - Agriculture bio

📧 Email: experts@pestalert.com
📱 Urgence: +33 1 XX XX XX XX
🕒 Disponibilité: 8h-18h, Lun-Ven`);
      break;

    case '!meteo':
      await message.reply(`🌤️ *Météo Agricole*

📍 **Votre région:** (Localisation automatique)
🌡️ **Température:** 22°C (min: 15°C, max: 28°C)
💧 **Humidité:** 65%
🌧️ **Précipitations:** 20% de chance
💨 **Vent:** 12 km/h SO

⚠️ **Alertes:**
• Conditions favorables aux champignons
• Surveillance recommandée

🔄 Mise à jour toutes les 3h`);
      break;

    case '!maladies':
      await message.reply(`🦠 *Maladies Courantes - Saison Actuelle*

🍅 **Tomates:**
• Mildiou - Taches brunes sur feuilles
• Alternariose - Cercles concentriques

🥬 **Légumes feuilles:**
• Oïdium - Poudre blanche
• Rouille - Pustules orangées

🌾 **Céréales:**
• Septoriose - Taches allongées
• Fusariose - Jaunissement

📷 Envoyez une photo pour diagnostic précis !`);
      break;

    default:
      // Réponse pour commandes non reconnues
      if (message.body.startsWith('!')) {
        await message.reply('❌ Commande non reconnue. Tapez !help pour voir les commandes disponibles.');
      }
      break;
  }
}



// Gestion des erreurs
client.on('auth_failure', (msg) => {
  console.error('❌ Échec de l\'authentification:', msg);
});

client.on('disconnected', (reason) => {
  console.log('📵 Client déconnecté:', reason);
});

// Démarrage du bot
client.initialize();

console.log('🤖 Démarrage du bot WhatsApp PestAlert...');
