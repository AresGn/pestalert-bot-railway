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
import { dashboardIntegration } from './services/dashboardIntegrationService';
import { AuthorizationService } from './services/authorizationService';
import { SimplifiedMenuService } from './services/simplifiedMenuService';
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
const authorizationService = new AuthorizationService();

// PHASE 0: Service simplifié pour MVP français
const simplifiedMenuService = new SimplifiedMenuService(audioService, userSessionService);

// Flag pour activer/désactiver le mode simplifié (Phase 0)
const SIMPLIFIED_MODE_ENABLED = process.env.SIMPLIFIED_MODE === 'true' || true; // Activé par défaut pour Phase 0

// Timestamp de démarrage du bot - IMPORTANT pour ignorer les anciens messages
const BOT_START_TIME = Date.now();
console.log(`🚀 Bot démarré à: ${new Date(BOT_START_TIME).toLocaleString()}`);
console.log(`⏰ Timestamp de démarrage: ${BOT_START_TIME}`);

// Set pour éviter de traiter le même message plusieurs fois
const processedMessages = new Set();

// Démarrer le nettoyage automatique des sessions
userSessionService.startSessionCleanup();

// Configuration Puppeteer ultra-basique pour Railway
const puppeteerConfig: any = {
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
};

// Ajouter le chemin exécutable si défini (pour Railway)
if (process.env.PUPPETEER_EXECUTABLE_PATH) {
  puppeteerConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
}

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: process.env.WHATSAPP_SESSION_PATH || './sessions',
    clientId: 'pestalert-bot' // Identifiant unique pour éviter les conflits
  }),
  puppeteer: puppeteerConfig,
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
  }
});

// Événements du client
client.on('qr', (qr) => {
  console.log('📱 Scannez ce QR code avec WhatsApp:');

  // Vérifier que qr n'est pas undefined avant de l'utiliser
  if (qr && typeof qr === 'string' && qr.trim() !== '') {
    qrcode.generate(qr, { small: true });
    console.log('\n🔗 Ou copiez ce lien dans votre navigateur:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`);
    console.log('\n💡 Astuce: Utilisez le lien ci-dessus pour un QR code plus petit et plus facile à scanner !');
  } else {
    console.log('⚠️ QR code invalide reçu. Redémarrage du client...');
    setTimeout(() => {
      client.destroy().then(() => {
        client.initialize();
      });
    }, 3000);
  }
});

client.on('ready', async () => {
  console.log('✅ Bot WhatsApp PestAlert connecté!');
  console.log('🔒 FILTRES DE SÉCURITÉ ACTIVÉS:');
  console.log('   - Ignore TOUS les messages de groupes');
  console.log('   - Ignore TOUS les messages du bot lui-même');
  console.log('   - Ignore TOUS les messages antérieurs au démarrage');
  console.log('   - Répond SEULEMENT aux messages privés reçus APRÈS le démarrage');
  console.log(`   - Timestamp de démarrage: ${new Date(BOT_START_TIME).toLocaleString()}`);

  // Initialiser l'intégration dashboard
  try {
    const authenticated = await dashboardIntegration.authenticate();
    if (authenticated) {
      console.log('📊 ✅ Dashboard integration activée');
      dashboardIntegration.startPeriodicMetricsCollection();
    } else {
      console.log('📊 ⚠️ Dashboard integration non disponible (mode local)');
    }
  } catch (error) {
    console.log('📊 ❌ Erreur initialisation dashboard:', error);
  }

  // Informations de debug sur la connexion
  try {
    const info = client.info;
    console.log(`📱 Numéro du bot: ${info.wid.user}`);
    console.log(`👤 Nom du bot: ${info.pushname}`);
    console.log(`🔗 État de connexion: READY`);

    // Test de connexion désactivé pour éviter les messages automatiques
    // setTimeout(async () => {
    //   console.log('🧪 Test de connexion - envoi d\'un message de test...');
    //   try {
    //     const testMessage = await client.sendMessage(info.wid._serialized, '🤖 Test de connexion - Bot opérationnel');
    //     console.log('✅ Test de connexion réussi - Le bot peut envoyer des messages');
    //   } catch (error) {
    //     console.error('❌ Test de connexion échoué:', error);
    //   }
    // }, 5000);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des infos:', error);
  }

  logger.logBotActivity('SYSTEM', 'Bot WhatsApp connecté et prêt avec filtres de sécurité');

  // Heartbeat pour surveiller la connexion
  setInterval(() => {
    console.log(`💓 Heartbeat - Bot toujours connecté: ${new Date().toLocaleString()}`);
  }, 60000); // Toutes les minutes

  // Polling manuel pour vérifier les chats (workaround pour Railway)
  const pollingInterval = setInterval(async () => {
    try {
      // Vérifier d'abord si le client est toujours connecté
      if (!client || !client.info) {
        console.log('⚠️ Client non connecté, arrêt du polling');
        return;
      }

      console.log('🔍 Vérification manuelle des nouveaux messages...');
      const chats = await client.getChats();
      const privateChats = chats.filter(chat => !chat.isGroup);

      for (const chat of privateChats.slice(0, 10)) { // Limiter à 10 chats pour éviter la surcharge
        const messages = await chat.fetchMessages({ limit: 1 });
        if (messages.length > 0) {
          const lastMessage = messages[0];
          const messageTime = lastMessage.timestamp * 1000;

          // Vérifier si c'est un nouveau message depuis le démarrage et pas déjà traité
          const messageId = `${lastMessage.id._serialized}`;
          if (messageTime > BOT_START_TIME && !lastMessage.fromMe && !processedMessages.has(messageId)) {
            console.log(`📨 Nouveau message détecté via polling: "${lastMessage.body}" de ${chat.name}`);
            processedMessages.add(messageId);
            // Déclencher manuellement le traitement du message
            handleMessageManually(lastMessage);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du polling des messages:', error);

      // Si c'est une erreur de session fermée, arrêter le polling et redémarrer
      if (error.message.includes('Session closed') || error.message.includes('Protocol error')) {
        console.log('🔄 Session fermée détectée, redémarrage du bot...');
        clearInterval(pollingInterval);
        setTimeout(() => {
          process.exit(1); // Railway redémarrera automatiquement
        }, 5000);
      }
    }
  }, 30000); // Toutes les 30 secondes
});

// Fonction pour traiter manuellement les messages (workaround)
async function handleMessageManually(message: any) {
  console.log('🔄 Traitement manuel du message...');

  try {
    const contact = await message.getContact();
    const chat = await message.getChat();

    // Même logique que l'événement message normal
    console.log(`\n🔍 MESSAGE REÇU - POLLING:`);
    console.log(`   📱 De: ${contact.name || contact.number}`);
    console.log(`   💬 Contenu: "${message.body}"`);
    console.log(`   ⏰ Timestamp: ${new Date(message.timestamp * 1000).toLocaleString()}`);

    // Vérifier si c'est le message de bienvenue
    if (message.body.trim() === 'Hi PestAlerte 👋') {
      console.log('👋 Message de bienvenue détecté via polling !');
      await message.reply('🎉 Bonjour ! Je suis PestAlert, votre assistant agricole !\n\n📋 Menu principal :\n1️⃣ Analyse de santé des cultures\n2️⃣ Détection de parasites\n3️⃣ Système d\'alerte\n\nTapez le numéro de votre choix (1, 2 ou 3)');
      return;
    }

    // Vérifier les commandes
    if (message.body.startsWith('!')) {
      if (message.body === '!help') {
        await message.reply('🤖 *Commandes PestAlert*\n\n🌱 **Analyse:**\n• Hi PestAlerte 👋 - Menu principal\n• Envoyez une photo - Analyse automatique\n\n📋 **Informations:**\n• !help - Cette aide\n• !status - État du système');
      } else if (message.body === '!status') {
        await message.reply('📊 *État du Système PestAlert*\n\n✅ **Services:**\n• Bot WhatsApp: En ligne\n• Analyse d\'images: Opérationnel\n• Système surveillé 24h/24');
      }
      return;
    }

  } catch (error) {
    console.error('❌ Erreur lors du traitement manuel:', error);
  }
}

client.on('message', async (message) => {
  console.log('🎯 ÉVÉNEMENT MESSAGE DÉCLENCHÉ !'); // Log pour confirmer que l'événement se déclenche

  const contact = await message.getContact();
  const chat = await message.getChat();

  // 🔐 VÉRIFICATION D'AUTORISATION
  const authResult = authorizationService.checkAuthorization(message.from);

  if (!authResult.allowed) {
    console.log(`🚫 ACCÈS REFUSÉ: ${message.from} - ${authResult.reason}`);

    // Alerter les admins si configuré
    if (authResult.shouldAlert) {
      const adminNumbers = authorizationService.getAdminNumbers();
      const alertMessage = `🚨 *Tentative d'accès non autorisée*\n\n` +
        `📱 Numéro: ${message.from}\n` +
        `👤 Contact: ${contact.name || 'Inconnu'}\n` +
        `💬 Message: "${message.body}"\n` +
        `⏰ Heure: ${new Date().toLocaleString()}\n` +
        `❌ Raison: ${authResult.reason}`;

      for (const adminNumber of adminNumbers) {
        try {
          await client.sendMessage(adminNumber, alertMessage);
        } catch (error) {
          console.error(`❌ Erreur envoi alerte admin ${adminNumber}:`, error);
        }
      }
    }

    // Optionnel : Répondre à l'utilisateur non autorisé
    try {
      await message.reply('🚫 Désolé, vous n\'êtes pas autorisé à utiliser ce bot.');
    } catch (error) {
      console.error('❌ Erreur réponse non autorisée:', error);
    }

    return; // Arrêter le traitement du message
  }

  // Log pour les utilisateurs autorisés
  console.log(`✅ ACCÈS AUTORISÉ: ${message.from} - ${authResult.reason}${authResult.isAdmin ? ' (ADMIN)' : ''}`);

  // Continuer avec le traitement normal du message...

  // LOGS DE DEBUG DÉTAILLÉS
  const messageTimestamp = message.timestamp * 1000;
  console.log(`\n🔍 MESSAGE REÇU - DEBUG:`);
  console.log(`   📱 De: ${contact.name || contact.number}`);
  console.log(`   💬 Contenu: "${message.body}"`);
  console.log(`   ⏰ Timestamp: ${new Date(messageTimestamp).toLocaleString()}`);
  console.log(`   🚀 Bot démarré: ${new Date(BOT_START_TIME).toLocaleString()}`);
  console.log(`   👥 Groupe: ${chat.isGroup}`);
  console.log(`   🤖 De moi: ${message.fromMe}`);

  // FILTRES STRICTS - TRÈS IMPORTANT

  // 1. Ignorer TOUS les messages envoyés par le bot lui-même
  if (message.fromMe) {
    console.log(`🚫 FILTRE 1: Message ignoré (envoyé par le bot)`);
    return;
  }

  // 2. Ignorer TOUS les messages de groupes
  if (chat.isGroup) {
    console.log(`🚫 FILTRE 2: Message de groupe ignoré: ${chat.name}`);
    return;
  }

  // 3. Ignorer les messages antérieurs au démarrage du bot
  if (messageTimestamp < BOT_START_TIME) {
    console.log(`🚫 FILTRE 3: Message ancien ignoré (${new Date(messageTimestamp).toLocaleString()} < ${new Date(BOT_START_TIME).toLocaleString()})`);
    return;
  }

  console.log(`✅ MESSAGE ACCEPTÉ - Traitement en cours...`);

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
    // PHASE 0: Mode simplifié français activé
    if (SIMPLIFIED_MODE_ENABLED) {
      console.log('🔄 Mode simplifié Phase 0 activé');

      // 1. Vérifier déclencheurs d'accueil simplifiés
      const lowerBody = message.body.trim().toLowerCase();
      if (lowerBody === 'salut' || lowerBody === 'bonjour' ||
          message.body.trim() === 'Hi PestAlerte 👋') {
        await handleSimplifiedWelcome(message);
        return;
      }

      // 2. Vérifier commandes de retour au menu
      if (simplifiedMenuService.isReturnToMenuCommand(message.body)) {
        const menuMessage = simplifiedMenuService.returnToMainMenu(contact.number);
        await message.reply(menuMessage);
        return;
      }

      // 3. Vérifier sélections de menu (1, 2, 3)
      if (['1', '2', '3'].includes(message.body.trim())) {
        await handleSimplifiedMenuSelection(message);
        return;
      }

      // 4. Gérer les médias avec réponses simplifiées
      if (message.hasMedia) {
        await handleSimplifiedMediaMessages(message);
        return;
      }

      // 5. Gérer les commandes traditionnelles (!ping, !help, etc.)
      if (message.body.startsWith('!')) {
        await handleCommands(message);
        return;
      }

      // 6. Réponses contextuelles simplifiées
      await handleSimplifiedContextualResponses(message);

    } else {
      // Mode normal (existant)
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
    }

  } catch (error: any) {
    console.error('Erreur lors du traitement du message:', error);
    logger.logServiceError('MESSAGE_HANDLER', error.message, contact.number);

    // Message d'erreur adapté au mode
    const errorMessage = SIMPLIFIED_MODE_ENABLED
      ? simplifiedMenuService.getErrorMessage()
      : '❌ Une erreur s\'est produite. Veuillez réessayer.';
    await message.reply(errorMessage);
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

    // 🔐 COMMANDES D'AUTORISATION (Admin seulement)
    case '!auth':
      if (!authorizationService.isAdmin(message.from)) {
        await message.reply('🚫 Cette commande est réservée aux administrateurs.');
        break;
      }

      const authArgs = message.body.split(' ').slice(1);
      if (authArgs.length === 0) {
        await message.reply(authorizationService.getAdminHelp());
        break;
      }

      const authCommand = authArgs[0].toLowerCase();

      switch (authCommand) {
        case 'stats':
          const stats = authorizationService.getAuthStats();
          const statsMessage = `📊 *Statistiques d'Autorisation*\n\n` +
            `🔧 Mode de filtrage: ${stats.filterMode}\n` +
            `👑 Administrateurs: ${stats.adminCount}\n` +
            `✅ Utilisateurs autorisés: ${stats.allowedUsersCount}\n` +
            `🌍 Pays autorisés: ${stats.allowedCountriesCount}\n` +
            `🚫 Tentatives non autorisées: ${stats.unauthorizedAttempts}`;
          await message.reply(statsMessage);
          break;

        case 'mode':
          if (authArgs.length < 2) {
            await message.reply('❌ Usage: !auth mode <whitelist|country|disabled>');
            break;
          }

          const newMode = authArgs[1].toLowerCase() as 'whitelist' | 'country' | 'disabled';
          if (!['whitelist', 'country', 'disabled'].includes(newMode)) {
            await message.reply('❌ Mode invalide. Utilisez: whitelist, country, ou disabled');
            break;
          }

          if (authorizationService.setFilterMode(newMode, message.from)) {
            await message.reply(`✅ Mode de filtrage changé vers: ${newMode}`);
          } else {
            await message.reply('❌ Erreur lors du changement de mode');
          }
          break;

        case 'add':
          if (authArgs.length < 2) {
            await message.reply('❌ Usage: !auth add +22912345678');
            break;
          }

          const numberToAdd = authArgs[1].replace('+', '');
          if (authorizationService.addAllowedUser(numberToAdd, message.from)) {
            await message.reply(`✅ Numéro ${numberToAdd} ajouté à la liste autorisée`);
          } else {
            await message.reply('❌ Numéro déjà autorisé ou erreur');
          }
          break;

        case 'remove':
          if (authArgs.length < 2) {
            await message.reply('❌ Usage: !auth remove +22912345678');
            break;
          }

          const numberToRemove = authArgs[1].replace('+', '');
          if (authorizationService.removeAllowedUser(numberToRemove, message.from)) {
            await message.reply(`✅ Numéro ${numberToRemove} supprimé de la liste autorisée`);
          } else {
            await message.reply('❌ Numéro non trouvé ou erreur');
          }
          break;

        case 'reload':
          authorizationService.reloadConfig();
          await message.reply('✅ Configuration d\'autorisation rechargée');
          break;

        default:
          await message.reply(authorizationService.getAdminHelp());
          break;
      }
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
  logger.logBotActivity('ERROR', 'Échec authentification WhatsApp', { error: msg });
});

client.on('disconnected', (reason) => {
  console.log('📵 Client déconnecté:', reason);
  logger.logBotActivity('WARN', 'Client WhatsApp déconnecté', { reason });

  // Nettoyer les sessions si nécessaire
  if (reason === 'LOGOUT' || reason.toString().includes('NAVIGATION')) {
    console.log('🧹 Nettoyage des sessions en cours...');
    cleanupSessions();
  }

  // Pour les erreurs de session fermée, redémarrer immédiatement
  if (reason.toString().includes('Session closed') || reason.toString().includes('Protocol error')) {
    console.log('🔄 Session fermée détectée, redémarrage immédiat...');
    setTimeout(() => {
      process.exit(1); // Railway redémarrera automatiquement
    }, 2000);
    return;
  }

  // Tentative de reconnexion après 30 secondes pour les autres cas
  setTimeout(() => {
    console.log('🔄 Tentative de reconnexion...');
    client.initialize().catch(err => {
      console.error('❌ Erreur lors de la reconnexion:', err);
      // Si la reconnexion échoue, redémarrer
      setTimeout(() => {
        process.exit(1);
      }, 10000);
    });
  }, 30000);
});

// Gestion des erreurs Puppeteer spécifiques
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);

  // Gestion spécifique des erreurs de fichiers verrouillés
  if (reason && reason.toString().includes('EBUSY')) {
    console.log('🔄 Fichier verrouillé détecté, nettoyage et redémarrage...');
    cleanupSessions().then(() => {
      setTimeout(() => {
        process.exit(1); // Railway redémarrera automatiquement
      }, 5000);
    });
    return;
  }

  if (reason && reason.toString().includes('Protocol error')) {
    console.log('🔄 Erreur Puppeteer détectée, redémarrage dans 60 secondes...');
    setTimeout(() => {
      process.exit(1); // Railway redémarrera automatiquement
    }, 60000);
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);

  // Gestion spécifique des erreurs de fichiers verrouillés
  if (error.message.includes('EBUSY') || error.message.includes('resource busy')) {
    console.log('🔄 Erreur de fichier verrouillé, nettoyage et redémarrage...');
    cleanupSessions().then(() => {
      process.exit(1);
    });
    return;
  }

  if (error.message.includes('Protocol error') || error.message.includes('Session closed')) {
    console.log('🔄 Erreur critique Puppeteer, redémarrage immédiat...');
    process.exit(1); // Railway redémarrera automatiquement
  }
});

// Fonction de démarrage avec retry
async function startBot(retryCount = 0) {
  const maxRetries = 3;

  try {
    console.log('🤖 Démarrage du bot WhatsApp PestAlert...');
    await client.initialize();
  } catch (error) {
    console.error(`❌ Erreur lors du démarrage (tentative ${retryCount + 1}/${maxRetries}):`, error);

    if (retryCount < maxRetries) {
      const delay = (retryCount + 1) * 30000; // 30s, 60s, 90s
      console.log(`🔄 Nouvelle tentative dans ${delay/1000} secondes...`);
      setTimeout(() => startBot(retryCount + 1), delay);
    } else {
      console.error('❌ Échec définitif du démarrage après', maxRetries, 'tentatives');
      process.exit(1);
    }
  }
}

// Fonction pour nettoyer les sessions (nettoyage doux par défaut)
async function cleanupSessions(preserveAuth = true) {
  try {
    const fs = require('fs');
    const path = require('path');
    const sessionPath = process.env.WHATSAPP_SESSION_PATH || './sessions';

    if (fs.existsSync(sessionPath)) {
      if (preserveAuth) {
        console.log('🔐 Nettoyage doux des sessions (préservation de l\'auth)...');

        const sessionDir = path.join(sessionPath, 'session');
        if (fs.existsSync(sessionDir)) {
          const items = fs.readdirSync(sessionDir);

          for (const item of items) {
            const itemPath = path.join(sessionDir, item);

            // Préserver les fichiers d'authentification importants
            if (item.includes('Local State') ||
                item.includes('Preferences') ||
                item.includes('Cookies') ||
                item.includes('Login Data') ||
                item.includes('Web Data')) {
              continue; // Garder ces fichiers
            }

            // Supprimer les autres fichiers/dossiers
            try {
              if (fs.statSync(itemPath).isDirectory()) {
                fs.rmSync(itemPath, { recursive: true, force: true });
              } else {
                fs.unlinkSync(itemPath);
              }
            } catch (err) {
              // Ignorer les erreurs de suppression
            }
          }
        }

        console.log('✅ Nettoyage doux terminé (authentification préservée)');
      } else {
        console.log('🗑️ Nettoyage complet des sessions...');
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log('✅ Sessions complètement supprimées');
      }

      // Attendre un peu avant de redémarrer
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des sessions:', error);
  }
}

// Fonction pour arrêter proprement le client
async function gracefulShutdown() {
  console.log('🛑 Arrêt en cours...');
  try {
    if (client) {
      await client.destroy();
      console.log('✅ Client WhatsApp fermé proprement');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'arrêt:', error);
  }

  // Nettoyer les sessions
  await cleanupSessions();
  process.exit(0);
}

// ========================================
// PHASE 0: FONCTIONS MODE SIMPLIFIÉ
// ========================================

// Fonction pour gérer l'accueil simplifié
async function handleSimplifiedWelcome(message: any) {
  const contact = await message.getContact();
  console.log(`👋 Accueil simplifié Phase 0 pour ${contact.name || contact.number}`);

  try {
    const welcomeResponse = await simplifiedMenuService.getWelcomeMessage();

    // Envoyer d'abord l'audio de bienvenue
    if (welcomeResponse.audioMessage) {
      await message.reply(welcomeResponse.audioMessage);
      // Attendre un peu avant d'envoyer le menu texte
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Puis envoyer le menu texte simplifié
    await message.reply(welcomeResponse.textMessage);

    // Mettre à jour l'état de l'utilisateur
    userSessionService.updateSessionState(contact.number, UserState.MAIN_MENU);

    logger.logBotActivity(contact.number, 'Simplified Welcome', {
      timestamp: new Date().toISOString(),
      mode: 'simplified_phase0'
    });

  } catch (error: any) {
    console.error('❌ Erreur accueil simplifié:', error);
    await message.reply(simplifiedMenuService.getErrorMessage());
  }
}

// Fonction pour gérer les sélections de menu simplifiées
async function handleSimplifiedMenuSelection(message: any) {
  const contact = await message.getContact();
  const option = message.body.trim();

  console.log(`📋 Sélection menu simplifié: ${option} par ${contact.number}`);

  try {
    const result = await simplifiedMenuService.handleMenuSelection(contact.number, option);
    await message.reply(result.message);

    logger.logBotActivity(contact.number, 'Simplified Menu Selection', {
      option: option,
      success: result.success,
      newState: result.newState,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erreur sélection menu simplifié:', error);
    await message.reply(simplifiedMenuService.getErrorMessage());
  }
}

// Fonction pour gérer les médias avec réponses simplifiées
async function handleSimplifiedMediaMessages(message: any) {
  const contact = await message.getContact();

  console.log(`📷 Analyse photo simplifiée pour ${contact.number}`);

  try {
    // Envoyer message d'analyse en cours
    const analyzingResponse = await simplifiedMenuService.getAnalyzingMessage();
    if (analyzingResponse.audioMessage) {
      await message.reply(analyzingResponse.audioMessage);
    }
    await message.reply(analyzingResponse.textMessage);

    // Télécharger et analyser l'image
    const media = await message.downloadMedia();
    const imageBuffer = Buffer.from(media.data, 'base64');

    // Utiliser le système d'analyse existant
    const analysisResult = await healthAnalysisService.analyzeCropHealth(imageBuffer, contact.number);

    // Déterminer la sévérité pour la réponse simplifiée
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (analysisResult.confidence > 0.9 && !analysisResult.isHealthy) {
      severity = 'critical';
    } else if (analysisResult.confidence > 0.7) {
      severity = 'high';
    } else if (analysisResult.confidence > 0.5) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    // Générer réponse simplifiée
    const simplifiedResponse = await simplifiedMenuService.generateAnalysisResponse(
      analysisResult.isHealthy,
      analysisResult.confidence,
      severity
    );

    // Envoyer audio puis texte
    if (simplifiedResponse.audioMessage) {
      await client.sendMessage(contact.number + '@c.us', simplifiedResponse.audioMessage);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    await message.reply(simplifiedResponse.textMessage);

    // Logger l'analyse
    logger.logBotActivity(contact.number, 'Simplified Analysis', {
      isHealthy: analysisResult.isHealthy,
      confidence: analysisResult.confidence,
      severity: severity,
      timestamp: new Date().toISOString()
    });

    // Réinitialiser l'état
    userSessionService.resetSession(contact.number);

  } catch (error: any) {
    console.error('❌ Erreur analyse simplifiée:', error);

    // Envoyer message pour photo pas claire
    const unclearResponse = await simplifiedMenuService.getUnclearPhotoMessage();
    if (unclearResponse.audioMessage) {
      await message.reply(unclearResponse.audioMessage);
    }
    await message.reply(unclearResponse.textMessage);
  }
}

// Fonction pour les réponses contextuelles simplifiées
async function handleSimplifiedContextualResponses(message: any) {
  const contact = await message.getContact();

  console.log(`💬 Réponse contextuelle simplifiée pour ${contact.number}: ${message.body}`);

  // Vérifier si c'est une commande simple
  if (simplifiedMenuService.isSimpleCommand(message.body)) {
    const helpMessage = simplifiedMenuService.getContextualHelp(contact.number);
    await message.reply(helpMessage);
  } else {
    // Message non reconnu - réponse très simple
    await message.reply("🤔 Je comprends pas\nTape 'aide' ou 'menu'");
  }

  logger.logBotActivity(contact.number, 'Simplified Contextual Response', {
    messageBody: message.body.substring(0, 50),
    timestamp: new Date().toISOString()
  });
}

// Gestionnaires d'arrêt propre
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Démarrage du bot avec gestion d'erreur
startBot();
