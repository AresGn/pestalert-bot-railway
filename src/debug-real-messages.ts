/**
 * Script pour débugger les messages réels WhatsApp
 * Ajouter temporairement dans index.ts pour voir les formats exacts
 */

// À ajouter temporairement dans src/index.ts après la ligne "client.on('message', async (message) => {"

/*
console.log('🔍 DEBUG MESSAGE REÇU:');
console.log('   📱 message.from:', message.from);
console.log('   📝 message.body:', message.body);
console.log('   🧹 Nettoyé:', message.from.replace('@c.us', '').replace('+', ''));

const contact = await message.getContact();
console.log('   👤 contact.number:', contact.number);
console.log('   📛 contact.name:', contact.name);

// Test d'autorisation en direct
const authResult = authorizationService.checkAuthorization(message.from);
console.log('   🔐 Autorisation:', authResult.allowed ? 'AUTORISÉ ✅' : 'REFUSÉ ❌');
console.log('   📝 Raison:', authResult.reason);
console.log('   🚨 Alerte:', authResult.shouldAlert);
console.log('');
*/

console.log('📋 Instructions pour débugger:');
console.log('');
console.log('1. Copiez le code commenté ci-dessus');
console.log('2. Ajoutez-le dans src/index.ts après la ligne:');
console.log('   client.on(\'message\', async (message) => {');
console.log('3. Redémarrez le bot');
console.log('4. Demandez à l\'utilisateur 1 Bénin d\'envoyer un message');
console.log('5. Regardez les logs pour voir le format exact');
console.log('');
console.log('🎯 Cela vous dira exactement:');
console.log('   • Le format du numéro reçu');
console.log('   • Si l\'autorisation fonctionne');
console.log('   • Pourquoi ça pourrait échouer');
console.log('');
console.log('💡 Autres vérifications:');
console.log('   • Le numéro est-il exactement 22999323073 ?');
console.log('   • Y a-t-il des espaces cachés ?');
console.log('   • Le bot est-il redémarré après les changements ?');
console.log('   • Le mode filtrage est-il bien "whitelist" ?');
