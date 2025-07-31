import { HealthAnalysisService } from './src/services/healthAnalysisService';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test avec l'image de voiture pour vérifier la correction de validation
 */
async function testVoitureValidation() {
  console.log('🚗 Test de validation avec image de voiture');
  console.log('='.repeat(50));

  const healthAnalysisService = new HealthAnalysisService();

  // Charger l'image de voiture
  const imagePath = path.join(__dirname, 'images', 'test', 'images_voiture.jpg');
  
  if (!fs.existsSync(imagePath)) {
    console.log(`❌ Image non trouvée: ${imagePath}`);
    console.log('📁 Vérifiez que le fichier images_voiture.jpg existe dans le dossier images/');
    return;
  }

  try {
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`📸 Image chargée: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
    console.log('');

    console.log('🔍 Analyse en cours...');
    console.log('📋 Recherchez dans les logs:');
    console.log('   - "🌱 Début validation PlantNet..." = PlantNet utilisé');
    console.log('   - "📋 PlantNet: Aucune espèce trouvée" = Réponse normale (pas erreur)');
    console.log('   - "🚫 Image rejetée - envoi du message d\'erreur" = Correction appliquée');
    console.log('');

    const result = await healthAnalysisService.analyzeCropHealth(imageBuffer, 'test-voiture');
    
    console.log('📊 RÉSULTAT:');
    console.log(`   isHealthy: ${result.isHealthy}`);
    console.log(`   confidence: ${result.confidence}`);
    console.log(`   textMessage présent: ${!!result.textMessage}`);
    console.log(`   recommendation: ${result.recommendation || 'Aucune'}`);
    
    // Test de la condition de détection d'erreur de validation
    const isValidationError = result.confidence === 0 && !result.isHealthy && result.textMessage;
    console.log(`   ✅ Détecté comme erreur de validation: ${isValidationError}`);
    
    if (result.textMessage) {
      console.log('\n📝 MESSAGE D\'ERREUR:');
      console.log(result.textMessage);
    }

    console.log('\n🎯 VÉRIFICATION:');
    if (isValidationError) {
      console.log('✅ SUCCÈS: L\'image de voiture est correctement rejetée');
      console.log('✅ Le mode simplifié enverra le message d\'erreur au lieu de "diseased"');
    } else {
      console.log('❌ PROBLÈME: L\'image de voiture n\'est pas rejetée correctement');
    }

  } catch (error: any) {
    console.log(`\n❌ Exception: ${error.message}`);
  }

  console.log('\n🔄 Prochaine étape: Tester avec le bot WhatsApp en envoyant cette image');
}

// Exécuter le test
testVoitureValidation().catch(console.error);
