import fs from 'fs';
import path from 'path';
import { ImprovedImageValidationService } from './services/improvedImageValidationService';

/**
 * Test du service de validation amélioré
 */

async function testImprovedValidation() {
  console.log('🧪 Test du service de validation amélioré (sans TensorFlow)\n');

  const improvedService = new ImprovedImageValidationService();
  
  // Afficher les statistiques du service
  const stats = improvedService.getStats();
  console.log('📊 Statistiques du service amélioré:');
  console.log(`   🌿 PlantNet: ${stats.plantnetAvailable ? 'Clé API disponible' : 'Pas de clé API'}`);
  console.log(`   🎯 Seuil de confiance: ${(stats.minAgriculturalConfidence * 100).toFixed(1)}%`);
  console.log(`   🌱 Vert minimum: ${stats.minGreenPercentage}%`);
  console.log(`   🏠 Uniformité max (pelouse): ${(stats.maxUniformGreen * 100).toFixed(1)}%`);
  console.log(`   🖼️  Complexité texture min: ${(stats.minTextureComplexity * 100).toFixed(1)}%`);
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
      const validationResult = await improvedService.validateAgriculturalImage(imageBuffer);
      const processingTime = Date.now() - startTime;

      // Vérifier si le résultat est correct
      const isCorrect = (testCase.expectedType === 'agricultural') === validationResult.isValid;
      const status = isCorrect ? '✅' : '❌';
      
      console.log(`${status} Résultat: ${validationResult.isValid ? 'AGRICOLE' : 'NON-AGRICOLE'}`);
      console.log(`📈 Confiance: ${(validationResult.confidence * 100).toFixed(1)}%`);
      console.log(`⏱️  Temps: ${processingTime}ms`);
      console.log(`📋 Raisons: ${validationResult.reasons.join(', ')}`);

      // Afficher les détails des analyses
      if (validationResult.sources.colorAnalysis) {
        const color = validationResult.sources.colorAnalysis;
        console.log(`🎨 Couleurs détaillées:`);
        console.log(`   🌿 Vert total: ${color.greenPercentage.toFixed(1)}%`);
        console.log(`   🌲 Vert foncé: ${color.darkGreenPercentage.toFixed(1)}%`);
        console.log(`   🌱 Vert clair: ${color.lightGreenPercentage.toFixed(1)}%`);
        console.log(`   🟤 Brun: ${color.brownPercentage.toFixed(1)}%`);
        console.log(`   🔵 Bleu: ${color.bluePercentage.toFixed(1)}%`);
        console.log(`   📏 Uniformité vert: ${(color.greenUniformity * 100).toFixed(1)}%`);
      }

      if (validationResult.sources.textureAnalysis) {
        const texture = validationResult.sources.textureAnalysis;
        console.log(`🖼️  Texture détaillée:`);
        console.log(`   🔧 Complexité: ${(texture.complexity * 100).toFixed(1)}%`);
        console.log(`   📐 Uniformité: ${(texture.uniformity * 100).toFixed(1)}%`);
        console.log(`   ⚡ Force contours: ${texture.edgeStrength.toFixed(1)}`);
      }

      if (validationResult.sources.plantnet) {
        const pn = validationResult.sources.plantnet;
        console.log(`🌿 PlantNet: ${pn.isPlant ? 'Plante' : 'Non-plante'} (${(pn.confidence * 100).toFixed(1)}%)`);
        if (pn.species && pn.species.length > 0) {
          console.log(`   Espèces: ${pn.species.map((s: any) => s.species?.scientificNameWithoutAuthor || 'Inconnue').join(', ')}`);
        }
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
  displayImprovedTestSummary(results);
}

function displayImprovedTestSummary(results: any[]) {
  console.log('📊 RÉSUMÉ DES TESTS AMÉLIORÉS\n');
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
  console.log(`   Système amélioré: ${accuracy.toFixed(1)}% de précision`);
  
  if (accuracy > 87.5) {
    console.log('   🎉 AMÉLIORATION! Le système amélioré est plus précis');
  } else if (accuracy === 87.5) {
    console.log('   ⚖️  ÉGALITÉ - Même précision');
  } else {
    console.log('   ⚠️  RÉGRESSION - Le système basique était plus précis');
  }
  console.log('');

  // Temps de traitement
  const validResults = results.filter(r => r.actual !== 'error');
  if (validResults.length > 0) {
    const avgProcessingTime = validResults.reduce((sum, r) => sum + r.processingTime, 0) / validResults.length;
    console.log(`⏱️  Temps moyen: ${avgProcessingTime.toFixed(1)}ms`);
    console.log('   (Comparé à ~104ms pour le système basique)');
  }

  console.log('');

  // Détails par image
  console.log('📋 DÉTAILS PAR IMAGE:');
  results.forEach(result => {
    const status = result.isCorrect ? '✅' : (result.actual === 'error' ? '💥' : '❌');
    console.log(`${status} ${result.filename}: ${result.expected} → ${result.actual} (${(result.confidence * 100).toFixed(1)}%)`);
    
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
        if (fp.sources && fp.sources.colorAnalysis) {
          const color = fp.sources.colorAnalysis;
          console.log(`     Uniformité vert: ${(color.greenUniformity * 100).toFixed(1)}%, Vert clair: ${color.lightGreenPercentage.toFixed(1)}%`);
        }
      });
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
    console.log('   • Ajuster les seuils de détection de pelouse');
  } else {
    console.log('   🔧 Nécessite des améliorations importantes');
    console.log('   • Revoir les seuils de confiance');
    console.log('   • Améliorer la détection de pelouse');
    console.log('   • Ajouter une clé PlantNet API');
  }

  // Test spécifique pour la pelouse
  const lawnTest = results.find(r => r.filename.includes('gazon') || r.filename.includes('maison'));
  if (lawnTest) {
    console.log('\n🏠 ANALYSE SPÉCIFIQUE PELOUSE:');
    if (lawnTest.actual === 'non-agricultural') {
      console.log('   ✅ Pelouse correctement rejetée');
    } else {
      console.log('   ❌ Pelouse incorrectement acceptée');
      console.log('   🔧 Suggestions d\'amélioration:');
      console.log('   • Réduire le seuil d\'uniformité verte');
      console.log('   • Augmenter la pénalité pour vert clair');
      console.log('   • Améliorer la détection de texture uniforme');
    }
  }
}

// Exécuter le test
if (require.main === module) {
  testImprovedValidation()
    .then(() => {
      console.log('🎉 Tests améliorés terminés!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur lors des tests:', error);
      process.exit(1);
    });
}

export { testImprovedValidation };
