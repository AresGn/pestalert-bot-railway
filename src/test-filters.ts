/**
 * Script pour tester les filtres de sécurité du bot
 */

// Simulation des filtres de sécurité
const BOT_START_TIME = Date.now();

interface MockMessage {
  fromMe: boolean;
  timestamp: number;
  body: string;
  hasMedia: boolean;
}

interface MockChat {
  isGroup: boolean;
  name?: string;
}

function shouldProcessMessage(message: MockMessage, chat: MockChat): boolean {
  console.log(`\n🧪 Test du message: "${message.body}"`);
  console.log(`   - fromMe: ${message.fromMe}`);
  console.log(`   - isGroup: ${chat.isGroup}`);
  console.log(`   - timestamp: ${new Date(message.timestamp * 1000).toLocaleString()}`);
  console.log(`   - hasMedia: ${message.hasMedia}`);

  // 1. Ignorer TOUS les messages envoyés par le bot lui-même
  if (message.fromMe) {
    console.log(`   ❌ REJETÉ: Message du bot lui-même`);
    return false;
  }

  // 2. Ignorer TOUS les messages de groupes
  if (chat.isGroup) {
    console.log(`   ❌ REJETÉ: Message de groupe (${chat.name || 'Groupe'})`);
    return false;
  }

  // 3. Ignorer les messages antérieurs au démarrage du bot
  const messageTimestamp = message.timestamp * 1000; // WhatsApp timestamp en secondes
  if (messageTimestamp < BOT_START_TIME) {
    console.log(`   ❌ REJETÉ: Message ancien (avant ${new Date(BOT_START_TIME).toLocaleString()})`);
    return false;
  }

  // 4. Vérifier que c'est bien un chat privé
  if (!chat.isGroup && !message.fromMe) {
    console.log(`   ✅ ACCEPTÉ: Message privé valide`);
    return true;
  }

  console.log(`   ❌ REJETÉ: Conditions non remplies`);
  return false;
}

function testFilters() {
  console.log('🔒 Test des filtres de sécurité du bot PestAlert');
  console.log(`⏰ Timestamp de démarrage du bot: ${new Date(BOT_START_TIME).toLocaleString()}`);
  console.log('='.repeat(60));

  // Cas de test
  const testCases = [
    {
      name: "Message du bot lui-même",
      message: { fromMe: true, timestamp: Date.now() / 1000, body: "Test", hasMedia: false },
      chat: { isGroup: false }
    },
    {
      name: "Message de groupe",
      message: { fromMe: false, timestamp: Date.now() / 1000, body: "Salut tout le monde", hasMedia: false },
      chat: { isGroup: true, name: "Groupe Test" }
    },
    {
      name: "Message ancien (avant démarrage)",
      message: { fromMe: false, timestamp: (BOT_START_TIME - 60000) / 1000, body: "Message ancien", hasMedia: false },
      chat: { isGroup: false }
    },
    {
      name: "Message privé valide avec image",
      message: { fromMe: false, timestamp: Date.now() / 1000, body: "", hasMedia: true },
      chat: { isGroup: false }
    },
    {
      name: "Message privé valide avec commande",
      message: { fromMe: false, timestamp: Date.now() / 1000, body: "!help", hasMedia: false },
      chat: { isGroup: false }
    },
    {
      name: "Message privé valide normal",
      message: { fromMe: false, timestamp: Date.now() / 1000, body: "Bonjour", hasMedia: false },
      chat: { isGroup: false }
    }
  ];

  let acceptedCount = 0;
  let rejectedCount = 0;

  testCases.forEach((testCase, index) => {
    console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
    const result = shouldProcessMessage(testCase.message, testCase.chat);
    
    if (result) {
      acceptedCount++;
    } else {
      rejectedCount++;
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('📊 Résultats des tests:');
  console.log(`   ✅ Messages acceptés: ${acceptedCount}`);
  console.log(`   ❌ Messages rejetés: ${rejectedCount}`);
  console.log(`   📈 Total: ${testCases.length}`);

  if (acceptedCount === 3 && rejectedCount === 3) {
    console.log('\n🎉 TOUS LES FILTRES FONCTIONNENT CORRECTEMENT !');
    console.log('   Le bot ne répondra QU\'AUX messages privés reçus après son démarrage.');
  } else {
    console.log('\n⚠️ PROBLÈME DÉTECTÉ dans les filtres !');
  }

  console.log('\n💡 Recommandations:');
  console.log('   - Redémarrez le bot pour réinitialiser le timestamp');
  console.log('   - Testez avec un seul contact à la fois');
  console.log('   - Évitez d\'envoyer des images dans les groupes');
}

if (require.main === module) {
  testFilters();
}
