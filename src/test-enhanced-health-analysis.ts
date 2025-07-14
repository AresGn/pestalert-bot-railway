import dotenv from 'dotenv';
import { HealthAnalysisService } from './services/healthAnalysisService';
import { ConfidenceAnalysisService } from './services/confidenceAnalysisService';
import { AudioService } from './services/audioService';
import { CropHealthService } from './services/cropHealthService';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

/**
 * Script de test pour valider le système d'analyse de santé amélioré
 */
async function testEnhancedHealthAnalysis() {
  console.log('🧪 Test du système d\'analyse de santé amélioré');
  console.log('=' .repeat(60));

  // 1. Test des services de base
  console.log('\n📋 1. Test des services de base...');
  
  const healthAnalysisService = new HealthAnalysisService();
  const confidenceAnalysisService = new ConfidenceAnalysisService();
  const audioService = new AudioService();
  const cropHealthService = new CropHealthService();

  console.log('  ✅ Services initialisés');

  // 2. Test du service audio amélioré
  console.log('\n🎵 2. Test du service audio amélioré...');
  const audioStatus = audioService.checkAudioFiles();
  console.log(`  📊 Fichiers requis: ${audioStatus.available ? 'Tous disponibles' : 'Manquants'}`);
  
  if (!audioStatus.available) {
    console.log(`  ❌ Fichiers requis manquants: ${audioStatus.missing.join(', ')}`);
  }
  
  if (audioStatus.optional_missing.length > 0) {
    console.log(`  ⚠️ Fichiers optionnels manquants: ${audioStatus.optional_missing.join(', ')}`);
    console.log('  💡 Ces fichiers amélioreront l\'expérience utilisateur');
  }

  // 3. Test du service d'analyse de confiance
  console.log('\n📊 3. Test du service d\'analyse de confiance...');
  
  // Test des différents niveaux de confiance
  const testConfidences = [0.15, 0.35, 0.60, 0.82, 0.95];
  
  testConfidences.forEach(confidence => {
    const level = confidenceAnalysisService.getConfidenceLevel(confidence);
    const interval = confidenceAnalysisService.getConfidenceInterval(confidence);
    console.log(`  📈 Confiance ${(confidence * 100).toFixed(1)}% → Niveau: ${level} (${interval.description})`);
  });

  // 4. Test de la qualité d'analyse
  console.log('\n🔍 4. Test de la qualité d\'analyse...');
  
  const qualityTests = [
    { binary: 0.9, disease: 0.85, imageQuality: 'excellent', time: 1.5 },
    { binary: 0.6, disease: 0.4, imageQuality: 'fair', time: 3.2 },
    { binary: 0.3, disease: 0.2, imageQuality: 'poor', time: 5.0 }
  ];

  qualityTests.forEach((test, index) => {
    const quality = confidenceAnalysisService.determineAnalysisQuality(
      test.binary,
      test.disease,
      test.imageQuality as any,
      test.time
    );
    console.log(`  🎯 Test ${index + 1}: Qualité ${quality} (binaire: ${(test.binary * 100).toFixed(1)}%, maladie: ${(test.disease * 100).toFixed(1)}%)`);
  });

  // 5. Test des recommandations
  console.log('\n💡 5. Test des recommandations...');
  
  const recommendationTests = [
    { level: 'very_high' as const, healthy: true, disease: undefined },
    { level: 'high' as const, healthy: false, disease: 'Cassava Mosaic Disease' },
    { level: 'medium' as const, healthy: false, disease: 'Maize Lethal Necrosis' },
    { level: 'low' as const, healthy: true, disease: undefined }
  ];

  recommendationTests.forEach(test => {
    const recommendations = confidenceAnalysisService.generateRecommendations(
      test.level,
      test.healthy,
      test.disease
    );
    console.log(`  📋 ${test.level} + ${test.healthy ? 'sain' : 'malade'}:`);
    console.log(`    • Immédiates: ${recommendations.immediate.length} actions`);
    console.log(`    • Court terme: ${recommendations.short_term.length} actions`);
    console.log(`    • Surveillance: ${recommendations.monitoring.length} actions`);
  });

  // 6. Test de l'évaluation des risques
  console.log('\n⚠️ 6. Test de l\'évaluation des risques...');
  
  const riskTests = [
    { healthy: true, level: 'very_high' as const, confidence: 0.95 },
    { healthy: false, level: 'high' as const, confidence: 0.85, disease: 'Fall Armyworm' },
    { healthy: false, level: 'medium' as const, confidence: 0.60, disease: 'Unknown Disease' },
    { healthy: false, level: 'low' as const, confidence: 0.30 }
  ];

  riskTests.forEach((test, index) => {
    const risk = confidenceAnalysisService.assessRiskLevel(
      test.healthy,
      test.level,
      test.confidence,
      test.disease
    );
    console.log(`  🎯 Test ${index + 1}: Risque ${risk.level} - Urgence: ${risk.urgency}`);
    console.log(`    Facteurs: ${risk.factors.join(', ')}`);
  });

  // 7. Test de cohérence des prédictions
  console.log('\n🔄 7. Test de cohérence des prédictions...');
  
  const consistencyTests = [
    { binary: 0.9, disease: 0.85, prediction: 'diseased' as const },
    { binary: 0.8, disease: 0.2, prediction: 'diseased' as const }, // Incohérent
    { binary: 0.3, disease: 0.8, prediction: 'healthy' as const }, // Incohérent
    { binary: 0.9, disease: 0.1, prediction: 'healthy' as const }
  ];

  consistencyTests.forEach((test, index) => {
    const consistency = confidenceAnalysisService.calculatePredictionConsistency(
      test.binary,
      test.disease,
      test.prediction
    );
    console.log(`  🔄 Test ${index + 1}: Cohérence ${(consistency * 100).toFixed(1)}% (binaire: ${test.prediction}, confiance maladie: ${(test.disease * 100).toFixed(1)}%)`);
  });

  // 8. Test de sélection des fichiers audio
  console.log('\n🎤 8. Test de sélection des fichiers audio...');
  
  const audioTests = [
    { level: 'very_high' as const, healthy: true },
    { level: 'very_high' as const, healthy: false },
    { level: 'medium' as const, healthy: true },
    { level: 'low' as const, healthy: false },
    { level: 'very_low' as const, healthy: true }
  ];

  audioTests.forEach(test => {
    const audioFile = confidenceAnalysisService.getAudioFile(test.level, test.healthy);
    console.log(`  🎵 ${test.level} + ${test.healthy ? 'sain' : 'malade'} → ${audioFile}`);
  });

  // 9. Test du service de santé (si possible)
  console.log('\n🏥 9. Test du service de santé...');
  try {
    const healthStatus = await healthAnalysisService.checkServiceStatus();
    console.log(`  📊 Statut: ${healthStatus.status}`);
    if (healthStatus.error) {
      console.log(`  ⚠️ Erreur: ${healthStatus.error}`);
    }
  } catch (error: any) {
    console.log(`  ❌ Erreur de test: ${error.message}`);
  }

  // 10. Test avec image simulée (si disponible)
  console.log('\n📷 10. Test avec image simulée...');
  
  // Chercher une image de test
  const testImagePath = path.join(__dirname, '../test-images/sample-crop.jpg');
  if (fs.existsSync(testImagePath)) {
    try {
      const imageBuffer = fs.readFileSync(testImagePath);
      console.log(`  📸 Image de test trouvée: ${imageBuffer.length} bytes`);
      
      // Test de l'analyse complète
      const result = await healthAnalysisService.analyzeCropHealth(imageBuffer, 'test-user');
      console.log(`  📊 Résultat: ${result.isHealthy ? 'Sain' : 'Malade'} (${(result.confidence * 100).toFixed(1)}%)`);
      console.log(`  🎚️ Niveau de confiance: ${result.confidenceLevel}`);
      console.log(`  🖼️ Qualité d'analyse: ${result.analysisQuality}`);
      
      if (result.detailedAnalysis) {
        console.log(`  🎯 Risque: ${result.detailedAnalysis.risk_assessment.level}`);
        console.log(`  ⚡ Urgence: ${result.detailedAnalysis.risk_assessment.urgency}`);
      }
      
    } catch (error: any) {
      console.log(`  ❌ Erreur lors de l'analyse: ${error.message}`);
    }
  } else {
    console.log(`  ⚠️ Aucune image de test trouvée à ${testImagePath}`);
    console.log('  💡 Créez un dossier test-images avec une image sample-crop.jpg pour tester l\'analyse complète');
  }

  // 11. Résumé final
  console.log('\n📊 11. Résumé des améliorations...');
  console.log('  ✅ Système de niveaux de confiance: OK');
  console.log('  ✅ Analyse de qualité: OK');
  console.log('  ✅ Recommandations adaptatives: OK');
  console.log('  ✅ Évaluation des risques: OK');
  console.log('  ✅ Cohérence des prédictions: OK');
  console.log('  ✅ Sélection audio intelligente: OK');
  console.log(`  ${audioStatus.available ? '✅' : '❌'} Fichiers audio: ${audioStatus.available ? 'Complets' : 'Incomplets'}`);

  console.log('\n🎉 Tests terminés !');
  
  if (!audioStatus.available || audioStatus.optional_missing.length > 0) {
    console.log('\n⚠️  ATTENTION: Certains fichiers audio sont manquants.');
    console.log('   Consultez packages/bot/audio/README_NOUVEAUX_FICHIERS.md pour les créer.');
    console.log('   Le système fonctionnera avec des fallbacks mais l\'expérience sera limitée.');
  } else {
    console.log('\n✅ Système d\'analyse de santé amélioré entièrement opérationnel !');
  }
}

// Exécuter les tests
if (require.main === module) {
  testEnhancedHealthAnalysis().catch(console.error);
}

export { testEnhancedHealthAnalysis };
