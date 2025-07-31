import fs from 'fs';
import path from 'path';
import { PlantNetValidationService } from './services/plantNetValidationService';

/**
 * Test spécifique pour l'image de cacao
 */

async function testCacaoSpecific() {
  console.log('🍫 TEST SPÉCIFIQUE CACAO\n');
  console.log('='.repeat(50));

  const plantNetService = new PlantNetValidationService();
  
  // Tester l'image de cacao
  const imagePath = path.join(process.cwd(), 'images', 'test', 'cacao.jpg');
  
  if (!fs.existsSync(imagePath)) {
    console.log('❌ Image cacao.jpg non trouvée');
    return;
  }

  try {
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`📊 Taille image cacao: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

    console.log('\n🌱 Test avec projet "all" (au lieu de "weurope")...');
    const result = await plantNetService.validateAgriculturalImage(imageBuffer);

    console.log('\n📋 RÉSULTATS DÉTAILLÉS:');
    console.log(`✅ Valide: ${result.isValid}`);
    console.log(`📊 Confiance: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`📝 Raisons: ${result.reasons.join(', ')}`);

    if (result.species) {
      console.log('\n🔬 ESPÈCE IDENTIFIÉE:');
      console.log(`   📛 Scientifique: ${result.species.scientific}`);
      console.log(`   🗣️  Commun: ${result.species.common}`);
      console.log(`   👨‍🔬 Famille: ${result.species.family}`);
    }

    if (result.sources.plantnet) {
      const plantnet = result.sources.plantnet;
      console.log('\n🌿 DÉTAILS PLANTNET:');
      console.log(`   🔬 Espèce: ${plantnet.species}`);
      console.log(`   📊 Confiance PlantNet: ${(plantnet.confidence * 100).toFixed(1)}%`);
      console.log(`   📛 Nom commun: ${plantnet.commonName}`);
      console.log(`   👨‍🔬 Famille: ${plantnet.family}`);
      
      if (plantnet.allResults && plantnet.allResults.length > 1) {
        console.log('\n🔍 TOP 5 RÉSULTATS PLANTNET:');
        plantnet.allResults.forEach((r: any, i: number) => {
          console.log(`   ${i + 1}. ${r.species.scientificNameWithoutAuthor} (${(r.score * 100).toFixed(1)}%)`);
        });
      }
    }

    if (result.agricultural) {
      console.log('\n🌾 ANALYSE AGRICOLE:');
      console.log(`   ✅ Est culture: ${result.agricultural.isCrop}`);
      console.log(`   📂 Catégorie: ${result.agricultural.category}`);
      console.log(`   📊 Confiance agricole: ${(result.agricultural.confidence * 100).toFixed(1)}%`);
      if (result.agricultural.matchedSpecies) {
        console.log(`   🎯 Espèce correspondante: ${result.agricultural.matchedSpecies}`);
      }
    }

    // Vérifier si Theobroma cacao est dans les résultats
    if (result.sources.plantnet?.allResults) {
      console.log('\n🔍 RECHERCHE THEOBROMA CACAO:');
      const cacaoResults = result.sources.plantnet.allResults.filter((r: any) => 
        r.species.scientificNameWithoutAuthor.toLowerCase().includes('theobroma')
      );
      
      if (cacaoResults.length > 0) {
        console.log('   ✅ Theobroma trouvé dans les résultats:');
        cacaoResults.forEach((r: any) => {
          console.log(`      • ${r.species.scientificNameWithoutAuthor} (${(r.score * 100).toFixed(1)}%)`);
        });
      } else {
        console.log('   ❌ Aucun Theobroma dans les résultats');
        console.log('   💡 Possible problème: qualité image ou angle de vue');
      }
    }

    // Suggestions d'amélioration
    console.log('\n💡 SUGGESTIONS:');
    if (!result.isValid) {
      console.log('   🔧 Pour améliorer la détection du cacao:');
      console.log('   • 📷 Prendre photo des feuilles caractéristiques');
      console.log('   • 🍫 Inclure les cabosses si présentes');
      console.log('   • ☀️ Meilleur éclairage naturel');
      console.log('   • 🎯 Angle plus rapproché de la plante');
    } else {
      console.log('   ✅ Cacao correctement identifié!');
    }

  } catch (error: any) {
    console.error(`❌ Erreur: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50));
}

// Test aussi l'image caco_malade.jpg
async function testCacaoMalade() {
  console.log('\n🍫 TEST CACAO MALADE\n');
  console.log('='.repeat(50));

  const plantNetService = new PlantNetValidationService();
  
  const imagePath = path.join(process.cwd(), 'images', 'test', 'caco_malade.jpg');
  
  if (!fs.existsSync(imagePath)) {
    console.log('❌ Image caco_malade.jpg non trouvée');
    return;
  }

  try {
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`📊 Taille image cacao malade: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

    const result = await plantNetService.validateAgriculturalImage(imageBuffer);

    console.log('\n📋 RÉSULTATS CACAO MALADE:');
    console.log(`✅ Valide: ${result.isValid}`);
    console.log(`📊 Confiance: ${(result.confidence * 100).toFixed(1)}%`);

    if (result.species) {
      console.log(`🔬 Espèce: ${result.species.scientific}`);
    }

    if (result.sources.plantnet?.allResults) {
      console.log('\n🔍 TOP 3 RÉSULTATS:');
      result.sources.plantnet.allResults.slice(0, 3).forEach((r: any, i: number) => {
        console.log(`   ${i + 1}. ${r.species.scientificNameWithoutAuthor} (${(r.score * 100).toFixed(1)}%)`);
      });
    }

  } catch (error: any) {
    console.error(`❌ Erreur: ${error.message}`);
  }
}

// Exécuter les tests
if (require.main === module) {
  testCacaoSpecific()
    .then(() => testCacaoMalade())
    .then(() => {
      console.log('\n🎉 Tests cacao terminés!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur:', error);
      process.exit(1);
    });
}

export { testCacaoSpecific };
