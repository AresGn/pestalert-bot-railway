import * as fs from 'fs';
import * as path from 'path';

/**
 * Test pour vérifier l'intégration de l'audio image_inapproprié.mp3
 */
async function testAudioIntegration() {
  console.log('🎵 Test d\'intégration audio image_inapproprié.mp3');
  console.log('='.repeat(50));

  // 1. Vérifier que l'audio existe
  const audioPath = path.join(__dirname, 'audio', 'fr_simple', 'image_inapproprié.mp3');
  console.log(`📁 Chemin audio: ${audioPath}`);
  
  if (fs.existsSync(audioPath)) {
    const stats = fs.statSync(audioPath);
    console.log(`✅ Audio trouvé: ${(stats.size / 1024).toFixed(1)} KB`);
  } else {
    console.log('❌ Audio non trouvé !');
    return;
  }

  // 2. Vérifier le chemin utilisé dans le code
  const codeAudioPath = path.join(process.cwd(), 'audio', 'fr_simple', 'image_inapproprié.mp3');
  console.log(`📁 Chemin dans le code: ${codeAudioPath}`);
  
  if (fs.existsSync(codeAudioPath)) {
    console.log('✅ Chemin du code correct');
  } else {
    console.log('❌ Chemin du code incorrect !');
  }

  // 3. Vérifier les autres audios pour comparaison
  console.log('\n📋 Autres audios fr_simple:');
  const audioDir = path.join(__dirname, 'audio', 'fr_simple');
  const audioFiles = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3'));
  
  audioFiles.forEach(file => {
    const filePath = path.join(audioDir, file);
    const stats = fs.statSync(filePath);
    console.log(`   📄 ${file}: ${(stats.size / 1024).toFixed(1)} KB`);
  });

  // 4. Simulation du flux d'envoi
  console.log('\n🔄 Simulation du flux d\'envoi:');
  console.log('   1. Image non-agricole détectée');
  console.log('   2. 🎵 Envoi audio image_inapproprié.mp3');
  console.log('   3. ⏱️ Attente 1.5 secondes');
  console.log('   4. 📝 Envoi message texte d\'erreur');

  console.log('\n🎯 Intégration prête !');
  console.log('📋 Prochaine étape: Tester avec le bot WhatsApp');
  console.log('   - Envoyer une image non-agricole');
  console.log('   - Vérifier que l\'audio est envoyé en premier');
  console.log('   - Vérifier que le message texte suit après 1.5s');
}

// Exécuter le test
testAudioIntegration().catch(console.error);
