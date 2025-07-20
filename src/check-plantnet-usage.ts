import { PlantNetValidationService } from './services/plantNetValidationService';

/**
 * Vérifier l'usage PlantNet
 */

async function checkPlantNetUsage() {
  console.log('📊 VÉRIFICATION USAGE PLANTNET\n');

  const plantNetService = new PlantNetValidationService();
  const stats = plantNetService.getUsageStats();

  console.log('📈 STATISTIQUES ACTUELLES:');
  console.log(`   🔢 Utilisé aujourd'hui: ${stats.plantnet.used}`);
  console.log(`   🔢 Restant: ${stats.plantnet.remaining}`);
  console.log(`   📊 Pourcentage: ${stats.plantnet.percentage.toFixed(1)}%`);
  console.log(`   📅 Dernière réinitialisation: ${stats.plantnet.resetTime}`);
  console.log(`   🔑 API disponible: ${!!process.env.PLANTNET_API_KEY}`);

  console.log('\n🎯 SEUILS CONFIGURÉS:');
  console.log(`   🌿 PlantNet minimum: ${(stats.thresholds.MIN_PLANTNET_CONFIDENCE * 100).toFixed(1)}%`);
  console.log(`   🌾 Agricole minimum: ${(stats.thresholds.MIN_AGRICULTURAL_CONFIDENCE * 100).toFixed(1)}%`);
  console.log(`   🎯 Correspondance espèce: ${(stats.thresholds.MIN_SPECIES_MATCH * 100).toFixed(1)}%`);
  console.log(`   🔄 Fallback: ${(stats.thresholds.FALLBACK_CONFIDENCE * 100).toFixed(1)}%`);

  console.log('\n🌱 ESPÈCES SUPPORTÉES:');
  console.log(`   📊 Nombre total: ${stats.supportedSpecies}`);

  if (stats.plantnet.remaining <= 0) {
    console.log('\n⚠️  LIMITE ATTEINTE:');
    console.log('   🚫 Plus de requêtes PlantNet disponibles aujourd\'hui');
    console.log('   🔄 Le système utilise le fallback automatiquement');
    console.log('   ⏰ Réinitialisation à minuit (UTC)');
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    
    const hoursUntilReset = Math.ceil((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60));
    console.log(`   ⏳ Réinitialisation dans ~${hoursUntilReset} heures`);
  } else {
    console.log('\n✅ PLANTNET DISPONIBLE:');
    console.log(`   🎯 ${stats.plantnet.remaining} requêtes restantes`);
    console.log('   💡 Utilisez-les avec parcimonie pour les tests importants');
  }

  console.log('\n💡 RECOMMANDATIONS:');
  if (stats.plantnet.remaining <= 0) {
    console.log('   🔄 Système en mode fallback - fonctionnel mais moins précis');
    console.log('   ⏰ Attendre la réinitialisation pour tests PlantNet');
    console.log('   🎯 Le cacao sera mieux identifié avec PlantNet demain');
  } else {
    console.log('   💰 Économiser les requêtes pour les tests critiques');
    console.log('   🎯 Tester le cacao quand PlantNet sera disponible');
  }
}

if (require.main === module) {
  checkPlantNetUsage()
    .then(() => {
      console.log('\n✅ Vérification terminée!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

export { checkPlantNetUsage };
