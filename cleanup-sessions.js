#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour nettoyer les sessions WhatsApp
 * Utilise ce script si vous avez des erreurs EBUSY ou des problèmes de connexion
 */

function killChromeProcesses() {
  console.log('🔍 Recherche des processus Chrome/Chromium...');

  try {
    const { execSync } = require('child_process');

    // Sur Windows
    if (process.platform === 'win32') {
      try {
        execSync('taskkill /F /IM chrome.exe /T', { stdio: 'ignore' });
        execSync('taskkill /F /IM chromium.exe /T', { stdio: 'ignore' });
        console.log('✅ Processus Chrome/Chromium fermés (Windows)');
      } catch (e) {
        // Ignorer si aucun processus trouvé
      }
    } else {
      // Sur Linux/Mac
      try {
        execSync('pkill -f chrome', { stdio: 'ignore' });
        execSync('pkill -f chromium', { stdio: 'ignore' });
        console.log('✅ Processus Chrome/Chromium fermés (Unix)');
      } catch (e) {
        // Ignorer si aucun processus trouvé
      }
    }
  } catch (error) {
    console.log('⚠️ Impossible de fermer les processus Chrome automatiquement');
  }
}

function cleanupSessions(preserveAuth = false) {
  const sessionPath = process.env.WHATSAPP_SESSION_PATH || './sessions';

  console.log('🧹 Nettoyage des sessions WhatsApp...');
  console.log(`📁 Chemin des sessions: ${sessionPath}`);
  console.log(`🔐 Préserver l'authentification: ${preserveAuth ? 'OUI' : 'NON'}`);

  // Tenter de fermer les processus Chrome d'abord
  killChromeProcesses();

  // Attendre un peu pour que les processus se ferment
  setTimeout(() => {
    try {
      if (fs.existsSync(sessionPath)) {
        console.log('📂 Dossier sessions trouvé...');

        if (preserveAuth) {
          // Nettoyage sélectif - garder les fichiers d'authentification
          console.log('🔐 Nettoyage sélectif en cours (préservation de l\'auth)...');

          // Chercher le dossier de session (peut être 'session' ou 'session-pestalert-bot')
          const sessionDirs = fs.readdirSync(sessionPath).filter(item =>
            item.startsWith('session') && fs.statSync(path.join(sessionPath, item)).isDirectory()
          );

          if (sessionDirs.length > 0) {
            const sessionDir = path.join(sessionPath, sessionDirs[0]);
            console.log(`📂 Dossier de session trouvé: ${sessionDirs[0]}`);

            if (fs.existsSync(sessionDir)) {
            const items = fs.readdirSync(sessionDir);

            for (const item of items) {
              const itemPath = path.join(sessionDir, item);

              // Préserver les fichiers et dossiers d'authentification importants
              if (item.includes('Local State') ||
                  item.includes('Preferences') ||
                  item.includes('Cookies') ||
                  item.includes('Login Data') ||
                  item.includes('Web Data') ||
                  item === 'Default') {  // Le dossier Default contient l'authentification WhatsApp
                console.log(`🔒 Préservé: ${item}`);
                continue;
              }

              // Supprimer les autres fichiers/dossiers
              try {
                if (fs.statSync(itemPath).isDirectory()) {
                  fs.rmSync(itemPath, { recursive: true, force: true });
                  console.log(`🗑️ Dossier supprimé: ${item}`);
                } else {
                  fs.unlinkSync(itemPath);
                  console.log(`🗑️ Fichier supprimé: ${item}`);
                }
              } catch (err) {
                console.log(`⚠️ Impossible de supprimer ${item}: ${err.message}`);
              }
            }
            }
          } else {
            console.log('ℹ️ Aucun dossier de session trouvé dans le répertoire');
          }

          console.log('✅ Nettoyage sélectif terminé (authentification préservée)');

        } else {
          // Nettoyage complet - supprimer tout
          console.log('🗑️ Nettoyage complet en cours...');
          fs.rmSync(sessionPath, { recursive: true, force: true });
          fs.mkdirSync(sessionPath, { recursive: true });
          console.log('✅ Sessions complètement supprimées');
        }

      } else {
        console.log('ℹ️ Aucun dossier sessions trouvé');
        fs.mkdirSync(sessionPath, { recursive: true });
      }

      console.log('🎉 Nettoyage terminé ! Vous pouvez maintenant redémarrer le bot.');

    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error.message);

      if (error.code === 'EBUSY') {
        console.log('⚠️ Fichiers verrouillés détectés. Solutions:');
        console.log('   1. Fermez manuellement tous les processus Chrome/Chromium');
        console.log('   2. Redémarrez votre système');
        console.log('   3. Utilisez le moniteur: npm run start:monitor');
      }

      process.exit(1);
    }
  }, 2000); // Attendre 2 secondes
}

// Vérifier les arguments de ligne de commande
const args = process.argv.slice(2);
const preserveAuth = args.includes('--preserve-auth') || args.includes('-p');
const forceClean = args.includes('--force') || args.includes('-f');

if (forceClean) {
  console.log('🚨 Mode FORCE activé - Suppression complète des sessions');
  cleanupSessions(false);
} else if (preserveAuth) {
  console.log('🔐 Mode PRÉSERVATION activé - Conservation de l\'authentification');
  cleanupSessions(true);
} else {
  console.log('❓ Quel type de nettoyage souhaitez-vous ?');
  console.log('   1. Nettoyage sélectif (préserve l\'authentification) - RECOMMANDÉ');
  console.log('   2. Nettoyage complet (supprime tout, QR code requis)');
  console.log('');
  console.log('💡 Utilisez:');
  console.log('   npm run cleanup -- --preserve-auth  (ou -p) pour le nettoyage sélectif');
  console.log('   npm run cleanup -- --force         (ou -f) pour le nettoyage complet');
  console.log('');

  // Par défaut, utiliser le nettoyage sélectif
  console.log('🔐 Utilisation du nettoyage sélectif par défaut...');
  cleanupSessions(true);
}
