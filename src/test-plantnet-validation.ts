import fs from 'fs';
import path from 'path';
import { PlantNetValidationService } from './services/plantNetValidationService';

/**
 * Test du service PlantNet (approche recommandée)
 */

async function testPlantNetValidation() {
  console.log('🧪 Test du service PlantNet (approche recommandée)\n');

  const plantNetService = new PlantNetValidationService();
  
  // Afficher les statistiques du service
  const stats = plantNetService.getUsageStats();
  console.log('📊 Statistiques du service PlantNet:');
  console.log(`   🌿 PlantNet utilisé: ${stats.plantnet.used}/${stats.plantnet.remaining + stats.plantnet.used}`);
  console.log(`   📈 Pourcentage: ${stats.plantnet.percentage.toFixed(1)}%`);
  console.log(`   🎯 Seuil PlantNet: ${(stats.thresholds.MIN_PLANTNET_CONFIDENCE * 100).toFixed(1)}%`);
  console.log(`   🌾 Seuil agricole: ${(stats.thresholds.MIN_AGRICULTURAL_CONFIDENCE * 100).toFixed(1)}%`);
  console.log(`   🔬 Espèces supportées: ${stats.supportedSpecies}`);
  console.log(`   🔄 Reset: ${stats.plantnet.resetTime}`);
  console.log('');

  // Tester avec les vraies images
  const testCases = [
    {
      filename: 'mais.jpg',
      expectedType: 'agricultural',
      description: 'Plant de maïs (Zea mays)'
    },
    {
      filename: 'cacao.jpg',
      expectedType: 'agricultural',
      description: 'Plant de cacao (Theobroma cacao)'
    },
    {
      filename: 'chenille_sur_mais.jpg',
      expectedType: 'agricultural',
      description: 'Chenille sur maïs'
    },
    {
      filename: 'Mais_detruite_ravageur.jpg',
      expectedType: 'agricultural',
      description: 'Maïs détruit par ravageur'
    },
    {
      filename: 'caco_malade.jpg',
      expectedType: 'agricultural',
      description: 'Cacao malade'
    },
    {
      filename: '8-Frugiperda.jpg',
      expectedType: 'agricultural',
      description: 'Chenille légionnaire (sur culture)'
    },
    {
      filename: 'chenille.jpg',
      expectedType: 'agricultural',
      description: 'Chenille (parasite agricole)'
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
      const validationResult = await plantNetService.validateAgriculturalImage(imageBuffer);
      const processingTime = Date.now() - startTime;

      // Vérifier si le résultat est correct
      const isCorrect = (testCase.expectedType === 'agricultural') === validationResult.isValid;
      const status = isCorrect ? '✅' : '❌';
      
      console.log(`${status} Résultat: ${validationResult.isValid ? 'AGRICOLE' : 'NON-AGRICOLE'}`);
      console.log(`📈 Confiance: ${(validationResult.confidence * 100).toFixed(1)}%`);
      console.log(`⏱️  Temps: ${processingTime}ms`);
      console.log(`📋 Raisons: ${validationResult.reasons.join(', ')}`);

      // Afficher les détails PlantNet si disponibles
      if (validationResult.sources.plantnet) {
        const plantnet = validationResult.sources.plantnet;
        console.log(`🌿 PlantNet détails:`);
        console.log(`   🔬 Espèce: ${plantnet.species || 'Non identifiée'}`);
        console.log(`   📛 Nom commun: ${plantnet.commonName || 'Non spécifié'}`);
        console.log(`   👨‍🔬 Famille: ${plantnet.family || 'Non spécifiée'}`);
        console.log(`   📊 Confiance PlantNet: ${(plantnet.confidence * 100).toFixed(1)}%`);
        
        if (plantnet.allResults && plantnet.allResults.length > 1) {
          console.log(`   🔍 Autres résultats: ${plantnet.allResults.slice(1, 3).map((r: any) => 
            `${r.species.scientificNameWithoutAuthor} (${(r.score * 100).toFixed(1)}%)`
          ).join(', ')}`);
        }
      }

      // Afficher les détails agricoles
      if (validationResult.agricultural) {
        const agri = validationResult.agricultural;
        console.log(`🌾 Analyse agricole:`);
        console.log(`   ✅ Est culture: ${agri.isCrop ? 'OUI' : 'NON'}`);
        console.log(`   📂 Catégorie: ${agri.category}`);
        console.log(`   📊 Confiance agricole: ${(agri.confidence * 100).toFixed(1)}%`);
        if (agri.matchedSpecies) {
          console.log(`   🎯 Espèce correspondante: ${agri.matchedSpecies}`);
        }
      }

      // Afficher les espèces identifiées
      if (validationResult.species) {
        const species = validationResult.species;
        console.log(`🔬 Espèce identifiée:`);
        console.log(`   📛 Scientifique: ${species.scientific}`);
        console.log(`   🗣️  Commun: ${species.common}`);
        console.log(`   👨‍🔬 Famille: ${species.family}`);
      }

      // Afficher fallback si utilisé
      if (validationResult.sources.fallback) {
        const fallback = validationResult.sources.fallback;
        console.log(`🔄 Fallback utilisé:`);
        console.log(`   🌿 Vert: ${fallback.greenPercentage.toFixed(1)}%`);
        console.log(`   🟤 Brun: ${fallback.brownPercentage.toFixed(1)}%`);
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
        sources: validationResult.sources,
        species: validationResult.species,
        agricultural: validationResult.agricultural
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
  displayPlantNetTestSummary(results, plantNetService);
}

function displayPlantNetTestSummary(results: any[], service: PlantNetValidationService) {
  console.log('📊 RÉSUMÉ DES TESTS PLANTNET\n');
  console.log('='.repeat(60));

  const totalTests = results.length;
  const correctResults = results.filter(r => r.isCorrect).length;
  const errorResults = results.filter(r => r.actual === 'error').length;
  const accuracy = totalTests > 0 ? (correctResults / (totalTests - errorResults)) * 100 : 0;

  console.log(`📈 Total des tests: ${totalTests}`);
  console.log(`✅ Résultats corrects: ${correctResults}`);
  console.log(`❌ Erreurs: ${errorResults}`);
  console.log(`🎯 Précision: ${accuracy.toFixed(1)}%\n`);

  // Comparaison avec les systèmes précédents
  console.log('🔄 COMPARAISON AVEC LES SYSTÈMES PRÉCÉDENTS:');
  console.log('   Système basique (couleurs): 87.5% de précision');
  console.log('   Système amélioré (couleurs+texture): ~90% de précision');
  console.log(`   Système PlantNet: ${accuracy.toFixed(1)}% de précision`);
  
  if (accuracy > 90) {
    console.log('   🎉 EXCELLENT! PlantNet surpasse les systèmes précédents');
  } else if (accuracy > 87.5) {
    console.log('   👍 AMÉLIORATION! PlantNet est plus précis');
  } else {
    console.log('   ⚠️  PlantNet a des difficultés - vérifier configuration');
  }
  console.log('');

  // Temps de traitement
  const validResults = results.filter(r => r.actual !== 'error');
  if (validResults.length > 0) {
    const avgProcessingTime = validResults.reduce((sum, r) => sum + r.processingTime, 0) / validResults.length;
    console.log(`⏱️  Temps moyen: ${avgProcessingTime.toFixed(1)}ms`);
    console.log('   (PlantNet peut être plus lent mais plus précis)');
  }

  console.log('');

  // Analyse des sources utilisées
  const plantnetUsed = results.filter(r => r.sources?.plantnet).length;
  const fallbackUsed = results.filter(r => r.sources?.fallback).length;
  
  console.log('📡 SOURCES UTILISÉES:');
  console.log(`   🌿 PlantNet API: ${plantnetUsed} tests`);
  console.log(`   🔄 Fallback local: ${fallbackUsed} tests`);
  
  if (fallbackUsed > 0) {
    console.log('   ⚠️  Fallback utilisé - vérifier clé API PlantNet');
  }

  console.log('');

  // Détails par image
  console.log('📋 DÉTAILS PAR IMAGE:');
  results.forEach(result => {
    const status = result.isCorrect ? '✅' : (result.actual === 'error' ? '💥' : '❌');
    console.log(`${status} ${result.filename}: ${result.expected} → ${result.actual} (${(result.confidence * 100).toFixed(1)}%)`);
    
    if (result.species) {
      console.log(`   🔬 Espèce: ${result.species.scientific}`);
    }
    
    if (result.agricultural?.isCrop) {
      console.log(`   🌾 Culture: ${result.agricultural.matchedSpecies || 'Générique'}`);
    }
    
    if (result.error) {
      console.log(`   💥 Erreur: ${result.error}`);
    }
  });

  console.log('');

  // Analyse des faux positifs/négatifs
  const falsePositives = results.filter(r => r.expected === 'non-agricultural' && r.actual === 'agricultural');
  const falseNegatives = results.filter(r => r.expected === 'agricultural' && r.actual === 'non-agricultural');

  if (falsePositives.length === 0 && falseNegatives.length === 0) {
    console.log('🎉 PARFAIT! Aucun faux positif ou négatif détecté.');
  } else {
    if (falsePositives.length > 0) {
      console.log(`🚨 FAUX POSITIFS (${falsePositives.length}): Images non-agricoles détectées comme agricoles`);
      falsePositives.forEach(fp => {
        console.log(`   • ${fp.filename}`);
        if (fp.species) {
          console.log(`     PlantNet a identifié: ${fp.species.scientific}`);
        }
      });
    }

    if (falseNegatives.length > 0) {
      console.log(`🚨 FAUX NÉGATIFS (${falseNegatives.length}): Images agricoles rejetées`);
      falseNegatives.forEach(fn => {
        console.log(`   • ${fn.filename}`);
        if (fn.species) {
          console.log(`     PlantNet a identifié: ${fn.species.scientific} (non-agricole)`);
        }
      });
    }
  }

  // Statistiques finales d'usage
  const finalStats = service.getUsageStats();
  console.log('\n📈 USAGE FINAL PLANTNET:');
  console.log(`   🔢 Requêtes utilisées: ${finalStats.plantnet.used}`);
  console.log(`   🔢 Requêtes restantes: ${finalStats.plantnet.remaining}`);
  console.log(`   📊 Pourcentage: ${finalStats.plantnet.percentage.toFixed(1)}%`);

  console.log('\n💡 RECOMMANDATIONS:');
  if (accuracy >= 95) {
    console.log('   ✨ Excellent! Système prêt pour la production');
    console.log('   🚀 Déployer avec confiance');
  } else if (accuracy >= 90) {
    console.log('   👍 Très bon! Quelques ajustements possibles');
    console.log('   🔧 Considérer ajustement des seuils');
  } else if (accuracy >= 80) {
    console.log('   ⚠️  Correct mais améliorable');
    console.log('   🔑 Vérifier la clé API PlantNet');
    console.log('   📊 Ajuster les seuils de confiance');
  } else {
    console.log('   🔧 Nécessite des améliorations');
    console.log('   🔑 Obtenir une clé API PlantNet valide');
    console.log('   📊 Revoir les seuils et la logique');
    console.log('   🌐 Vérifier la connectivité réseau');
  }

  // Test spécifique pour la pelouse (problème récurrent)
  const lawnTest = results.find(r => r.filename.includes('gazon') || r.filename.includes('maison'));
  if (lawnTest) {
    console.log('\n🏠 ANALYSE SPÉCIFIQUE PELOUSE:');
    if (lawnTest.actual === 'non-agricultural') {
      console.log('   ✅ Pelouse correctement rejetée par PlantNet');
    } else {
      console.log('   ❌ Pelouse incorrectement acceptée');
      if (lawnTest.species) {
        console.log(`   🔬 PlantNet a identifié: ${lawnTest.species.scientific}`);
        console.log('   💡 Suggestion: Ajouter cette espèce à la liste d\'exclusion');
      }
    }
  }
}

// Exécuter le test
if (require.main === module) {
  testPlantNetValidation()
    .then(() => {
      console.log('🎉 Tests PlantNet terminés!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur lors des tests:', error);
      process.exit(1);
    });
}

export { testPlantNetValidation };
