import fs from 'fs';
import path from 'path';
import { HybridImageValidationService } from './services/hybridImageValidationService';

/**
 * Test du service de validation hybride avec TensorFlow.js et PlantNet
 */

async function testHybridValidation() {
  console.log('🧪 Test du service de validation hybride (TensorFlow + PlantNet)\n');

  const hybridService = new HybridImageValidationService();
  
  // Attendre que TensorFlow soit initialisé
  console.log('⏳ Attente de l\'initialisation de TensorFlow...');
  let attempts = 0;
  while (!hybridService.isReady() && attempts < 30) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
    if (attempts % 5 === 0) {
      console.log(`⏳ Tentative ${attempts}/30...`);
    }
  }

  if (!hybridService.isReady()) {
    console.log('⚠️  TensorFlow non initialisé, test avec fallback uniquement');
  } else {
    console.log('✅ TensorFlow initialisé avec succès');
  }

  // Afficher les statistiques du service
  const stats = hybridService.getStats();
  console.log('📊 Statistiques du service:');
  console.log(`   🤖 TensorFlow: ${stats.tensorflowReady ? 'Prêt' : 'Non disponible'}`);
  console.log(`   🌿 PlantNet: ${stats.plantnetAvailable ? 'Clé API disponible' : 'Pas de clé API'}`);
  console.log('');

  // Tester avec les vraies images
  const testCases = [
    {
      filename: 'mais.jpg',
      expectedType: 'agricultural',
      description: 'Plant de maïs'
    },
    {
      filename: 'cacao.jpg',
      expectedType: 'agricultural',
      description: 'Plant de cacao'
    },
    {
      filename: 'chenille_sur_mais.jpg',
      expectedType: 'agricultural',
      description: 'Chenille sur maïs'
    },
    {
      filename: 'maison_villa_avec_gazon.jpeg',
      expectedType: 'non-agricultural',
      description: 'Maison avec gazon (test critique)'
    }
  ];

  const results: any[] = [];
  const imagesPath = path.join(process.cwd(), 'images', 'test');

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
      console.log(`📊 Taille: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

      const startTime = Date.now();
      const validationResult = await hybridService.validateAgriculturalImage(imageBuffer);
      const processingTime = Date.now() - startTime;

      // Vérifier si le résultat est correct
      const isCorrect = (testCase.expectedType === 'agricultural') === validationResult.isValid;
      const status = isCorrect ? '✅' : '❌';
      
      console.log(`${status} Résultat: ${validationResult.isValid ? 'AGRICOLE' : 'NON-AGRICOLE'}`);
      console.log(`📈 Confiance: ${(validationResult.confidence * 100).toFixed(1)}%`);
      console.log(`⏱️  Temps: ${processingTime}ms`);
      console.log(`📋 Raisons: ${validationResult.reasons.join(', ')}`);

      // Afficher les détails des sources
      if (validationResult.sources.tensorflow) {
        const tf = validationResult.sources.tensorflow;
        console.log(`🤖 TensorFlow: ${tf.isPlant ? 'Plante' : 'Non-plante'} (${(tf.confidence * 100).toFixed(1)}%)`);
      }

      if (validationResult.sources.plantnet) {
        const pn = validationResult.sources.plantnet;
        console.log(`🌿 PlantNet: ${pn.isPlant ? 'Plante' : 'Non-plante'} (${(pn.confidence * 100).toFixed(1)}%)`);
        if (pn.species && pn.species.length > 0) {
          console.log(`   Espèces détectées: ${pn.species.map((s: any) => s.species?.scientificNameWithoutAuthor || 'Inconnue').join(', ')}`);
        }
      }

      if (validationResult.sources.consensus) {
        const consensus = validationResult.sources.consensus;
        console.log(`🎯 Consensus: ${consensus.isValid ? 'Valide' : 'Rejeté'} (${(consensus.confidence * 100).toFixed(1)}%)`);
      }

      if (!validationResult.isValid) {
        console.log(`💡 Type d'erreur: ${validationResult.errorType}`);
        if (validationResult.suggestion) {
          console.log(`🔧 Suggestion: ${validationResult.suggestion}`);
        }
      }

      results.push({
        filename: testCase.filename,
        expected: testCase.expectedType,
        actual: validationResult.isValid ? 'agricultural' : 'non-agricultural',
        confidence: validationResult.confidence,
        isCorrect,
        processingTime,
        sources: validationResult.sources
      });

      console.log('');

    } catch (error: any) {
      console.error(`❌ Erreur: ${error.message}\n`);
      results.push({
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
  displayHybridTestSummary(results);
}

function displayHybridTestSummary(results: any[]) {
  console.log('📊 RÉSUMÉ DES TESTS HYBRIDES\n');
  console.log('='.repeat(60));

  const totalTests = results.length;
  const correctResults = results.filter(r => r.isCorrect).length;
  const errorResults = results.filter(r => r.actual === 'error').length;
  const accuracy = totalTests > 0 ? (correctResults / (totalTests - errorResults)) * 100 : 0;

  console.log(`📈 Total des tests: ${totalTests}`);
  console.log(`✅ Résultats corrects: ${correctResults}`);
  console.log(`❌ Erreurs: ${errorResults}`);
  console.log(`🎯 Précision: ${accuracy.toFixed(1)}%\n`);

  // Comparaison avec l'ancien système
  console.log('🔄 COMPARAISON AVEC L\'ANCIEN SYSTÈME:');
  console.log('   Ancien système (couleurs uniquement): 87.5% de précision');
  console.log(`   Nouveau système (hybride): ${accuracy.toFixed(1)}% de précision`);
  
  if (accuracy > 87.5) {
    console.log('   🎉 AMÉLIORATION! Le système hybride est plus précis');
  } else if (accuracy === 87.5) {
    console.log('   ⚖️  ÉGALITÉ - Même précision');
  } else {
    console.log('   ⚠️  RÉGRESSION - L\'ancien système était plus précis');
  }
  console.log('');

  // Temps de traitement
  const validResults = results.filter(r => r.actual !== 'error');
  if (validResults.length > 0) {
    const avgProcessingTime = validResults.reduce((sum, r) => sum + r.processingTime, 0) / validResults.length;
    console.log(`⏱️  Temps moyen: ${avgProcessingTime.toFixed(1)}ms`);
    console.log('   (Comparé à ~104ms pour l\'ancien système)');
  }

  console.log('');

  // Détails par image
  console.log('📋 DÉTAILS PAR IMAGE:');
  results.forEach(result => {
    const status = result.isCorrect ? '✅' : (result.actual === 'error' ? '💥' : '❌');
    console.log(`${status} ${result.filename}: ${result.expected} → ${result.actual} (${(result.confidence * 100).toFixed(1)}%)`);
    
    // Afficher les sources utilisées
    if (result.sources) {
      const sources = [];
      if (result.sources.tensorflow) sources.push('TensorFlow');
      if (result.sources.plantnet) sources.push('PlantNet');
      if (sources.length > 0) {
        console.log(`   📡 Sources: ${sources.join(', ')}`);
      }
    }
    
    if (result.error) {
      console.log(`   💥 Erreur: ${result.error}`);
    }
  });

  console.log('');

  // Recommandations
  const falsePositives = results.filter(r => r.expected === 'non-agricultural' && r.actual === 'agricultural');
  const falseNegatives = results.filter(r => r.expected === 'agricultural' && r.actual === 'non-agricultural');

  if (falsePositives.length === 0 && falseNegatives.length === 0) {
    console.log('🎉 PARFAIT! Aucun faux positif ou négatif détecté.');
  } else {
    if (falsePositives.length > 0) {
      console.log(`🚨 FAUX POSITIFS (${falsePositives.length}): Images non-agricoles détectées comme agricoles`);
      falsePositives.forEach(fp => console.log(`   • ${fp.filename}`));
    }

    if (falseNegatives.length > 0) {
      console.log(`🚨 FAUX NÉGATIFS (${falseNegatives.length}): Images agricoles rejetées`);
      falseNegatives.forEach(fn => console.log(`   • ${fn.filename}`));
    }
  }

  console.log('\n💡 RECOMMANDATIONS:');
  if (accuracy >= 95) {
    console.log('   ✨ Excellent! Le système est prêt pour la production');
  } else if (accuracy >= 90) {
    console.log('   👍 Très bon! Quelques ajustements mineurs possibles');
  } else if (accuracy >= 80) {
    console.log('   ⚠️  Correct mais peut être amélioré');
    console.log('   • Considérer l\'ajout d\'une clé PlantNet API');
    console.log('   • Ajuster les seuils de consensus');
  } else {
    console.log('   🔧 Nécessite des améliorations importantes');
    console.log('   • Vérifier la configuration TensorFlow');
    console.log('   • Ajouter une clé PlantNet API');
    console.log('   • Revoir l\'algorithme de consensus');
  }
}

// Exécuter le test
if (require.main === module) {
  testHybridValidation()
    .then(() => {
      console.log('🎉 Tests hybrides terminés!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur lors des tests:', error);
      process.exit(1);
    });
}

export { testHybridValidation };
