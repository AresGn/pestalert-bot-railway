#!/usr/bin/env node

/**
 * Nettoyage COMPLET - Supprime tout y compris l'authentification
 * Utilise ce script seulement si vous voulez repartir de zéro
 */

const { spawn } = require('child_process');

console.log('🚨 Nettoyage COMPLET des sessions WhatsApp');
console.log('⚠️  ATTENTION: Supprime votre authentification (nouveau QR code requis)');
console.log('🗑️  Supprime TOUS les fichiers de session\n');

const cleanup = spawn('node', ['cleanup-sessions.js', '--force'], {
  stdio: 'inherit',
  shell: true
});

cleanup.on('close', (code) => {
  if (code === 0) {
    console.log('\n🎉 Nettoyage complet terminé !');
    console.log('⚠️  Vous devrez rescanner le QR code au prochain démarrage');
  } else {
    console.log('\n❌ Erreur lors du nettoyage complet');
  }
});

cleanup.on('error', (error) => {
  console.error('❌ Erreur:', error);
});
