import { HealthAnalysisService } from './src/services/healthAnalysisService';
import * as fs from 'fs';

/**
 * Test de debug pour comprendre quel service de validation est utilisé
 */
async function testDebugValidation() {
  console.log('🔍 Test de debug - Quel service de validation est utilisé ?');
  console.log('='.repeat(60));

  const healthAnalysisService = new HealthAnalysisService();

  // Créer une image de test simple (image corrompue pour déclencher l'erreur)
  const testImage = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46
  ]);

  console.log('\n📋 Test avec image corrompue pour voir les logs...');
  console.log('🔍 Recherchez dans les logs:');
  console.log('   - "🔍 DEBUG: Utilisation de PlantNetValidationService..." = HealthAnalysisService utilisé');
  console.log('   - "🌱 Début validation PlantNet..." = PlantNetValidationService utilisé');
  console.log('   - "🔍 Début de la validation d\'image agricole..." = AgriculturalImageValidationService utilisé');
  console.log('');

  try {
    const result = await healthAnalysisService.analyzeCropHealth(testImage, 'debug-user');
    
    console.log('\n📊 Résultat:');
    console.log(`   isHealthy: ${result.isHealthy}`);
    console.log(`   confidence: ${result.confidence}`);
    console.log(`   textMessage présent: ${!!result.textMessage}`);
    
    // Test de la condition de détection d'erreur
    const isValidationError = result.confidence === 0 && !result.isHealthy && result.textMessage;
    console.log(`   ✅ Détecté comme erreur de validation: ${isValidationError}`);
    
    if (result.textMessage) {
      const shortMessage = result.textMessage.substring(0, 80) + '...';
      console.log(`   📝 Message: ${shortMessage}`);
    }

  } catch (error: any) {
    console.log(`\n❌ Exception capturée: ${error.message}`);
  }

  console.log('\n🎯 Analyse des logs:');
  console.log('   Si vous voyez "🔍 DEBUG: Utilisation de PlantNetValidationService..." → HealthAnalysisService fonctionne');
  console.log('   Si vous voyez "🌱 Début validation PlantNet..." → PlantNetValidationService fonctionne');
  console.log('   Si vous voyez "🔍 Début de la validation d\'image agricole..." → Problème de routage !');
}

// Exécuter le test
testDebugValidation().catch(console.error);
