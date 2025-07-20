import fs from 'fs';
import path from 'path';
import { PlantNetValidationService } from './services/plantNetValidationService';
import { HealthAnalysisService } from './services/healthAnalysisService';

/**
 * Test du flux complet : PlantNet → OpenEPI
 * Montre comment les deux systèmes travaillent ensemble
 */

async function testCompleteFlow() {
  console.log('🧪 TEST FLUX COMPLET : PlantNet → OpenEPI\n');
  console.log('='.repeat(60));

  const plantNetService = new PlantNetValidationService();
  const healthAnalysisService = new HealthAnalysisService();

  // Vérifier la configuration
  const stats = plantNetService.getUsageStats();
  console.log('📊 Configuration:');
  console.log(`   🔑 PlantNet API: ${process.env.PLANTNET_API_KEY ? 'CONFIGURÉE ✅' : 'MANQUANTE ❌'}`);
  console.log(`   🔑 OpenEPI API: ${process.env.OPENEPI_API_KEY ? 'CONFIGURÉE ✅' : 'MANQUANTE ❌'}`);
  console.log(`   🌿 Limite PlantNet: ${stats.plantnet.remaining} requêtes restantes`);
  console.log('');

  // Images de test
  const testCases = [
    {
      filename: 'mais.jpg',
      description: 'Maïs (devrait passer PlantNet → OpenEPI)',
      expectedFlow: 'PlantNet ✅ → OpenEPI 🔬'
    },
    {
      filename: 'cacao.jpg', 
      description: 'Cacao (devrait passer PlantNet → OpenEPI)',
      expectedFlow: 'PlantNet ✅ → OpenEPI 🔬'
    },
    {
      filename: 'maison_villa_avec_gazon.jpeg',
      description: 'Maison avec gazon (devrait être rejetée par PlantNet)',
      expectedFlow: 'PlantNet ❌ → Pas d\'OpenEPI'
    }
  ];

  const imagesPath = path.join(process.cwd(), 'images', 'test');

  for (const testCase of testCases) {
    const imagePath = path.join(imagesPath, testCase.filename);
    
    console.log(`🔍 TEST: ${testCase.description}`);
    console.log(`📁 Fichier: ${testCase.filename}`);
    console.log(`🎯 Flux attendu: ${testCase.expectedFlow}`);
    console.log('-'.repeat(50));
    
    if (!fs.existsSync(imagePath)) {
      console.log(`❌ Image non trouvée: ${imagePath}\n`);
      continue;
    }

    try {
      const imageBuffer = fs.readFileSync(imagePath);
      console.log(`📊 Taille image: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

      // ÉTAPE 1: Validation PlantNet
      console.log('\n🌱 ÉTAPE 1: Validation PlantNet...');
      const startPlantNet = Date.now();
      const plantNetResult = await plantNetService.validateAgriculturalImage(imageBuffer);
      const plantNetTime = Date.now() - startPlantNet;

      console.log(`   Résultat: ${plantNetResult.isValid ? '✅ VALIDE' : '❌ REJETÉ'}`);
      console.log(`   Confiance: ${(plantNetResult.confidence * 100).toFixed(1)}%`);
      console.log(`   Temps: ${plantNetTime}ms`);
      
      if (plantNetResult.species) {
        console.log(`   🔬 Espèce: ${plantNetResult.species.scientific}`);
        console.log(`   📛 Nom: ${plantNetResult.species.common}`);
      }

      if (plantNetResult.isValid) {
        // ÉTAPE 2: Analyse OpenEPI (seulement si PlantNet valide)
        console.log('\n🔬 ÉTAPE 2: Analyse OpenEPI...');
        const startOpenEPI = Date.now();
        
        try {
          const openEPIResult = await healthAnalysisService.analyzeCropHealth(imageBuffer, 'test-user');
          const openEPITime = Date.now() - startOpenEPI;

          console.log(`   Santé: ${openEPIResult.isHealthy ? '🌿 SAINE' : '🚨 PROBLÈME'}`);
          console.log(`   Confiance: ${(openEPIResult.confidence * 100).toFixed(1)}%`);
          console.log(`   Temps: ${openEPITime}ms`);
          
          if (openEPIResult.textMessage) {
            const shortMessage = openEPIResult.textMessage.substring(0, 100) + '...';
            console.log(`   📝 Message: ${shortMessage}`);
          }

          // RÉSUMÉ FLUX COMPLET
          console.log('\n🎯 FLUX COMPLET RÉUSSI:');
          console.log(`   1️⃣ PlantNet: ${plantNetResult.species?.scientific || 'Culture'} identifiée`);
          console.log(`   2️⃣ OpenEPI: ${openEPIResult.isHealthy ? 'Plante saine' : 'Problème détecté'}`);
          console.log(`   ⏱️ Temps total: ${plantNetTime + openEPITime}ms`);

        } catch (openEPIError: any) {
          console.log(`   ❌ Erreur OpenEPI: ${openEPIError.message}`);
          console.log('\n🎯 FLUX PARTIEL:');
          console.log(`   1️⃣ PlantNet: ✅ Culture validée`);
          console.log(`   2️⃣ OpenEPI: ❌ Échec technique`);
        }

      } else {
        // Image rejetée par PlantNet
        console.log('\n🚫 ÉTAPE 2: OpenEPI NON APPELÉ');
        console.log(`   Raison: ${plantNetResult.reasons.join(', ')}`);
        
        if (plantNetResult.suggestion) {
          console.log(`   💡 Suggestion: ${plantNetResult.suggestion}`);
        }

        console.log('\n🎯 FLUX PROTECTION:');
        console.log(`   1️⃣ PlantNet: ❌ Image non-agricole rejetée`);
        console.log(`   2️⃣ OpenEPI: 🛡️ Protégé des faux positifs`);
        console.log(`   💰 Économie: Pas de gaspillage d'appels API`);
      }

    } catch (error: any) {
      console.error(`❌ Erreur générale: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  // Statistiques finales
  const finalStats = plantNetService.getUsageStats();
  console.log('📈 STATISTIQUES FINALES:');
  console.log(`   🌿 PlantNet utilisé: ${finalStats.plantnet.used} requêtes`);
  console.log(`   🔬 OpenEPI appelé: Seulement pour images validées`);
  console.log(`   💰 Économies: Faux positifs évités`);
  console.log('');

  console.log('🎯 AVANTAGES DU SYSTÈME:');
  console.log('   ✅ PlantNet filtre les images non-agricoles');
  console.log('   ✅ OpenEPI analyse seulement les vraies cultures');
  console.log('   ✅ Pas de faux positifs sur maisons/voitures');
  console.log('   ✅ Économie d\'appels API OpenEPI');
  console.log('   ✅ Messages d\'erreur précis pour utilisateurs');
  console.log('');

  console.log('🔄 FLUX OPTIMAL:');
  console.log('   Image → PlantNet (identification) → OpenEPI (santé) → Résultat');
  console.log('   Image → PlantNet (rejet) → Message d\'aide → Pas d\'OpenEPI');
}

// Fonction pour tester juste la validation PlantNet
async function testPlantNetOnly() {
  console.log('🌱 TEST PLANTNET SEUL\n');
  
  const plantNetService = new PlantNetValidationService();
  const imagePath = path.join(process.cwd(), 'images', 'test', 'mais.jpg');
  
  if (fs.existsSync(imagePath)) {
    const imageBuffer = fs.readFileSync(imagePath);
    const result = await plantNetService.validateAgriculturalImage(imageBuffer);
    
    console.log('Résultat PlantNet:');
    console.log(JSON.stringify(result, null, 2));
  }
}

// Exécuter le test
if (require.main === module) {
  const testType = process.argv[2];
  
  if (testType === 'plantnet') {
    testPlantNetOnly()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Erreur:', error);
        process.exit(1);
      });
  } else {
    testCompleteFlow()
      .then(() => {
        console.log('🎉 Test flux complet terminé!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Erreur lors du test:', error);
        process.exit(1);
      });
  }
}

export { testCompleteFlow };
