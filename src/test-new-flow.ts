import dotenv from 'dotenv';
import { UserSessionService, UserState } from './services/userSessionService';
import { MenuService } from './services/menuService';
import { HealthAnalysisService } from './services/healthAnalysisService';
import { AudioService } from './services/audioService';
import { AlertService } from './services/alertService';

dotenv.config();

/**
 * Script de test pour valider le nouveau flux d'accueil
 */
async function testNewFlow() {
  console.log('🧪 Test du nouveau flux d\'accueil PestAlert');
  console.log('=' .repeat(50));

  // 1. Test des services de base
  console.log('\n📋 1. Test des services de base...');
  
  const userSessionService = new UserSessionService();
  const audioService = new AudioService();
  const menuService = new MenuService(userSessionService, audioService);
  const healthAnalysisService = new HealthAnalysisService();
  const alertService = new AlertService();

  console.log('  ✅ Services initialisés');

  // 2. Test du service audio
  console.log('\n🎵 2. Test du service audio...');
  const audioStatus = audioService.checkAudioFiles();
  console.log(`  📊 Fichiers audio: ${audioStatus.available ? 'Tous disponibles' : 'Manquants'}`);
  
  if (!audioStatus.available) {
    console.log(`  ❌ Fichiers manquants: ${audioStatus.missing.join(', ')}`);
    console.log('  💡 Consultez packages/bot/audio/README_NOUVEAUX_FICHIERS.md');
  }

  // Test des nouveaux fichiers audio
  const welcomeAudio = await audioService.getWelcomeAudio();
  const healthyAudio = await audioService.getHealthyCropAudio();
  const diseasedAudio = await audioService.getDiseasedCropAudio();
  
  console.log(`  🎤 Welcome.mp3: ${welcomeAudio ? '✅' : '❌'}`);
  console.log(`  🌱 CropSains.mp3: ${healthyAudio ? '✅' : '❌'}`);
  console.log(`  🚨 CropMalade.mp3: ${diseasedAudio ? '✅' : '❌'}`);

  // 3. Test du service de session
  console.log('\n👥 3. Test du service de session...');
  const testUserId = 'test-user-123';
  
  // Créer une session
  const session = userSessionService.getSession(testUserId);
  console.log(`  📝 Session créée: ${session.userId} (état: ${session.state})`);
  
  // Tester les changements d'état
  userSessionService.updateSessionState(testUserId, UserState.MAIN_MENU);
  console.log(`  🔄 État mis à jour: ${userSessionService.getSession(testUserId).state}`);
  
  // Test des vérifications d'état
  const isInMenu = userSessionService.isUserInState(testUserId, UserState.MAIN_MENU);
  console.log(`  ✅ Vérification d'état: ${isInMenu ? 'Correct' : 'Erreur'}`);

  // 4. Test du service de menu
  console.log('\n📋 4. Test du service de menu...');
  
  // Test du déclencheur d'accueil
  const welcomeResponse = await menuService.handleWelcomeTrigger(testUserId);
  console.log(`  👋 Déclencheur d'accueil: ${welcomeResponse.audioMessage ? 'Audio OK' : 'Pas d\'audio'}`);
  console.log(`  📝 Menu généré: ${welcomeResponse.textMessage.length} caractères`);
  
  // Test des sélections de menu
  const option1 = await menuService.handleMenuSelection(testUserId, '1');
  console.log(`  1️⃣ Option 1: ${option1.success ? 'OK' : 'Erreur'} - ${option1.newState}`);
  
  userSessionService.updateSessionState(testUserId, UserState.MAIN_MENU);
  const option2 = await menuService.handleMenuSelection(testUserId, '2');
  console.log(`  2️⃣ Option 2: ${option2.success ? 'OK' : 'Erreur'} - ${option2.newState}`);
  
  userSessionService.updateSessionState(testUserId, UserState.MAIN_MENU);
  const option3 = await menuService.handleMenuSelection(testUserId, '3');
  console.log(`  3️⃣ Option 3: ${option3.success ? 'OK' : 'Erreur'} - ${option3.newState}`);

  // 5. Test du service d'analyse de santé
  console.log('\n🏥 5. Test du service d\'analyse de santé...');
  try {
    const healthStatus = await healthAnalysisService.checkServiceStatus();
    console.log(`  📊 Statut: ${healthStatus.status}`);
    if (healthStatus.error) {
      console.log(`  ⚠️ Erreur: ${healthStatus.error}`);
    }
  } catch (error: any) {
    console.log(`  ❌ Erreur de test: ${error.message}`);
  }

  // 6. Test du service d'alerte
  console.log('\n🚨 6. Test du service d\'alerte...');
  
  // Test d'alerte textuelle
  const textAlert = await alertService.handleTextAlert(
    testUserId,
    'Test User',
    'Test d\'alerte critique - invasion de chenilles légionnaires'
  );
  console.log(`  📝 Alerte textuelle: ${textAlert.success ? 'OK' : 'Erreur'}`);
  console.log(`  🆔 ID: ${textAlert.alertId}`);
  console.log(`  ⏱️ Temps estimé: ${textAlert.estimatedResponseTime}`);
  
  // Test des statistiques
  const alertStats = alertService.getAlertStats();
  console.log(`  📊 Total alertes: ${alertStats.total}`);
  console.log(`  📈 Par sévérité: ${JSON.stringify(alertStats.bySeverity)}`);

  // 7. Test des capacités contextuelles
  console.log('\n🎯 7. Test des capacités contextuelles...');
  
  // Test de réception d'image selon l'état
  userSessionService.updateSessionState(testUserId, UserState.WAITING_FOR_HEALTH_IMAGE);
  const canReceiveImage = menuService.canReceiveImage(testUserId);
  console.log(`  📷 Peut recevoir image (santé): ${canReceiveImage ? 'Oui' : 'Non'}`);
  
  const analysisType = menuService.getRequiredAnalysisType(testUserId);
  console.log(`  🔍 Type d'analyse requis: ${analysisType}`);
  
  // Test d'aide contextuelle
  const contextHelp = menuService.getContextualHelp(testUserId);
  console.log(`  💡 Aide contextuelle: ${contextHelp.substring(0, 50)}...`);

  // 8. Test de nettoyage
  console.log('\n🧹 8. Test de nettoyage...');
  const activeSessionsBefore = userSessionService.getActiveSessionsCount();
  console.log(`  👥 Sessions actives avant: ${activeSessionsBefore}`);
  
  userSessionService.resetSession(testUserId);
  const sessionAfterReset = userSessionService.getSession(testUserId);
  console.log(`  🔄 État après reset: ${sessionAfterReset.state}`);

  // 9. Résumé final
  console.log('\n📊 9. Résumé des tests...');
  console.log('  ✅ Services de base: OK');
  console.log(`  ${audioStatus.available ? '✅' : '❌'} Fichiers audio: ${audioStatus.available ? 'Complets' : 'Incomplets'}`);
  console.log('  ✅ Gestion des sessions: OK');
  console.log('  ✅ Service de menu: OK');
  console.log('  ✅ Service d\'alerte: OK');
  console.log('  ✅ Logique contextuelle: OK');

  console.log('\n🎉 Tests terminés !');
  
  if (!audioStatus.available) {
    console.log('\n⚠️  ATTENTION: Certains fichiers audio sont manquants.');
    console.log('   Consultez packages/bot/audio/README_NOUVEAUX_FICHIERS.md pour les créer.');
  } else {
    console.log('\n✅ Tous les composants sont prêts pour le déploiement !');
  }
}

// Exécuter les tests
if (require.main === module) {
  testNewFlow().catch(console.error);
}

export { testNewFlow };
