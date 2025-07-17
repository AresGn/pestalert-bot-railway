#!/usr/bin/env node

/**
 * Nettoyage DOUX - Préserve l'authentification WhatsApp
 * Utilise ce script pour résoudre les erreurs EBUSY sans perdre la connexion
 */

const { spawn } = require('child_process');

console.log('🔐 Nettoyage DOUX des sessions WhatsApp');
console.log('✅ Préserve votre authentification (pas de nouveau QR code)');
console.log('🧹 Supprime seulement les fichiers temporaires problématiques\n');

const cleanup = spawn('node', ['cleanup-sessions.js', '--preserve-auth'], {
  stdio: 'inherit',
  shell: true
});

cleanup.on('close', (code) => {
  if (code === 0) {
    console.log('\n🎉 Nettoyage doux terminé avec succès !');
    console.log('💡 Vous pouvez maintenant redémarrer le bot sans rescanner le QR code');
  } else {
    console.log('\n❌ Erreur lors du nettoyage doux');
  }
});

cleanup.on('error', (error) => {
  console.error('❌ Erreur:', error);
});
