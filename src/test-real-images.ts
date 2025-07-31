import fs from 'fs';
import path from 'path';
import { AgriculturalImageValidationService } from './services/agriculturalImageValidationService';
import { HealthAnalysisService } from './services/healthAnalysisService';
import { UserGuidanceService } from './services/userGuidanceService';

/**
 * Test avec de vraies images du dossier images/test
 */

interface TestCase {
  filename: string;
  expectedType: 'agricultural' | 'non-agricultural';
  description: string;
}

async function testWithRealImages() {
  console.log('🧪 Test avec de vraies images du dossier images/test\n');

  const validationService = new AgriculturalImageValidationService();
  const healthAnalysisService = new HealthAnalysisService();
  const guidanceService = new UserGuidanceService();

  // Définir les cas de test avec les images disponibles
  const testCases: TestCase[] = [
    {
      filename: '8-Frugiperda.jpg',
      expectedType: 'agricultural',
      description: 'Chenille légionnaire (Frugiperda) - Parasite agricole'
    },
    {
      filename: 'Mais_detruite_ravageur.jpg',
      expectedType: 'agricultural',
      description: 'Maïs détruit par ravageur'
    },
    {
      filename: 'cacao.jpg',
      expectedType: 'agricultural',
      description: 'Plant de cacao'
    },
    {
      filename: 'caco_malade.jpg',
      expectedType: 'agricultural',
      description: 'Cacao malade'
    },
    {
      filename: 'chenille.jpg',
      expectedType: 'agricultural',
      description: 'Chenille (parasite agricole)'
    },
    {
      filename: 'chenille_sur_mais.jpg',
      expectedType: 'agricultural',
      description: 'Chenille sur maïs'
    },
    {
      filename: 'mais.jpg',
      expectedType: 'agricultural',
      description: 'Plant de maïs'
    },
    {
      filename: 'maison_villa_avec_gazon.jpeg',
      expectedType: 'non-agricultural',
      description: 'Maison avec gazon (non-agricole)'
    }
  ];

  const testResults: any[] = [];
  const imagesPath = path.join(process.cwd(), 'images', 'test');

  console.log(`📁 Dossier d'images: ${imagesPath}\n`);

  for (const testCase of testCases) {
    const imagePath = path.join(imagesPath, testCase.filename);
    
    console.log(`🔍 Test: ${testCase.description}`);
    console.log(`📁 Fichier: ${testCase.filename}`);
    
    if (!fs.existsSync(imagePath)) {
      console.log(`❌ Image non trouvée: ${imagePath}\n`);
      continue;
    }

    try {
      const imageBuffer = fs.readFileSync(imagePath);
      console.log(`📊 Taille de l'image: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

      const startTime = Date.now();
      
      // Test de validation agricole
      const validationResult = await validationService.validateAgriculturalImage(imageBuffer);
      
      const processingTime = Date.now() - startTime;
      
      // Vérifier si le résultat est correct
      const isCorrect = (testCase.expectedType === 'agricultural') === validationResult.isValid;
      const status = isCorrect ? '✅' : '❌';
      
      console.log(`${status} Résultat: ${validationResult.isValid ? 'AGRICOLE' : 'NON-AGRICOLE'}`);
      console.log(`📈 Confiance: ${(validationResult.confidence * 100).toFixed(1)}%`);
      console.log(`⏱️  Temps: ${processingTime}ms`);
      console.log(`📋 Raisons: ${validationResult.reasons.join(', ')}`);
      
      if (!validationResult.isValid) {
        console.log(`💡 Type d'erreur: ${validationResult.errorType}`);
        if (validationResult.suggestion) {
          console.log(`🔧 Suggestion: ${validationResult.suggestion}`);
        }
      }

      // Enregistrer les résultats
      testResults.push({
        filename: testCase.filename,
        expected: testCase.expectedType,
        actual: validationResult.isValid ? 'agricultural' : 'non-agricultural',
        confidence: validationResult.confidence,
        isCorrect,
        processingTime,
        reasons: validationResult.reasons
      });

      // Si l'image est validée comme agricole, tester aussi l'analyse de santé
      if (validationResult.isValid) {
        console.log('🌾 Test d\'analyse de santé...');
        try {
          const healthResult = await healthAnalysisService.analyzeCropHealth(imageBuffer, 'test-user');
          console.log(`🏥 Santé: ${healthResult.isHealthy ? 'SAINE' : 'MALADE'}`);
          console.log(`📊 Confiance santé: ${(healthResult.confidence * 100).toFixed(1)}%`);
        } catch (healthError: any) {
          console.log(`⚠️  Erreur analyse santé: ${healthError.message}`);
        }
      }

      console.log('');

    } catch (error: any) {
      console.error(`❌ Erreur lors du test ${testCase.filename}: ${error.message}\n`);
      testResults.push({
        filename: testCase.filename,
        expected: testCase.expectedType,
        actual: 'error',
        confidence: 0,
        isCorrect: false,
        processingTime: 0,
        error: error.message
      });
    }
  }

  // Afficher le résumé
  displayTestSummary(testResults);
}

function displayTestSummary(results: any[]) {
  console.log('📊 RÉSUMÉ DES TESTS AVEC VRAIES IMAGES\n');
  console.log('='.repeat(60));

  const totalTests = results.length;
  const correctResults = results.filter(r => r.isCorrect).length;
  const errorResults = results.filter(r => r.actual === 'error').length;
  const accuracy = totalTests > 0 ? (correctResults / (totalTests - errorResults)) * 100 : 0;

  console.log(`📈 Total des tests: ${totalTests}`);
  console.log(`✅ Résultats corrects: ${correctResults}`);
  console.log(`❌ Erreurs: ${errorResults}`);
  console.log(`🎯 Précision: ${accuracy.toFixed(1)}%\n`);

  // Statistiques par type
  const agriculturalTests = results.filter(r => r.expected === 'agricultural' && r.actual !== 'error');
  const nonAgriculturalTests = results.filter(r => r.expected === 'non-agricultural' && r.actual !== 'error');

  if (agriculturalTests.length > 0) {
    const agriculturalCorrect = agriculturalTests.filter(r => r.actual === 'agricultural').length;
    const agriculturalAccuracy = (agriculturalCorrect / agriculturalTests.length) * 100;
    console.log(`🌾 Images agricoles: ${agriculturalCorrect}/${agriculturalTests.length} (${agriculturalAccuracy.toFixed(1)}%)`);
  }

  if (nonAgriculturalTests.length > 0) {
    const nonAgriculturalCorrect = nonAgriculturalTests.filter(r => r.actual === 'non-agricultural').length;
    const nonAgriculturalAccuracy = (nonAgriculturalCorrect / nonAgriculturalTests.length) * 100;
    console.log(`🏠 Images non-agricoles: ${nonAgriculturalCorrect}/${nonAgriculturalTests.length} (${nonAgriculturalAccuracy.toFixed(1)}%)`);
  }

  // Temps de traitement
  const validResults = results.filter(r => r.actual !== 'error');
  if (validResults.length > 0) {
    const avgProcessingTime = validResults.reduce((sum, r) => sum + r.processingTime, 0) / validResults.length;
    console.log(`⏱️  Temps moyen: ${avgProcessingTime.toFixed(1)}ms`);
  }

  console.log('');

  // Détails des résultats
  console.log('📋 DÉTAILS PAR IMAGE:');
  results.forEach(result => {
    const status = result.isCorrect ? '✅' : (result.actual === 'error' ? '💥' : '❌');
    console.log(`${status} ${result.filename}: ${result.expected} → ${result.actual} (${(result.confidence * 100).toFixed(1)}%)`);
    if (result.error) {
      console.log(`   💥 Erreur: ${result.error}`);
    }
  });

  console.log('');

  // Recommandations
  if (accuracy < 80) {
    console.log('⚠️  RECOMMANDATIONS:');
    console.log('   • Ajuster les seuils de détection');
    console.log('   • Améliorer l\'analyse des couleurs');
    console.log('   • Vérifier les algorithmes de texture');
  } else if (accuracy >= 90) {
    console.log('🎉 EXCELLENT! Le système fonctionne très bien avec les vraies images.');
  } else {
    console.log('👍 BON! Le système fonctionne correctement.');
  }

  // Analyse des faux positifs/négatifs
  const falsePositives = results.filter(r => r.expected === 'non-agricultural' && r.actual === 'agricultural');
  const falseNegatives = results.filter(r => r.expected === 'agricultural' && r.actual === 'non-agricultural');

  if (falsePositives.length > 0) {
    console.log(`\n🚨 FAUX POSITIFS (${falsePositives.length}): Images non-agricoles détectées comme agricoles`);
    falsePositives.forEach(fp => console.log(`   • ${fp.filename}`));
  }

  if (falseNegatives.length > 0) {
    console.log(`\n🚨 FAUX NÉGATIFS (${falseNegatives.length}): Images agricoles rejetées`);
    falseNegatives.forEach(fn => console.log(`   • ${fn.filename}`));
  }
}

// Exécuter le test
if (require.main === module) {
  testWithRealImages()
    .then(() => {
      console.log('🎉 Tests avec vraies images terminés!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur lors des tests:', error);
      process.exit(1);
    });
}

export { testWithRealImages };
