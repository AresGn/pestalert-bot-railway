#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script de démarrage amélioré pour le bot PestAlert
 * Nettoie automatiquement les sessions si nécessaire
 */

function cleanupSessions() {
  const sessionPath = process.env.WHATSAPP_SESSION_PATH || './sessions';
  
  try {
    if (fs.existsSync(sessionPath)) {
      console.log('🧹 Nettoyage préventif des sessions...');
      fs.rmSync(sessionPath, { recursive: true, force: true });
      fs.mkdirSync(sessionPath, { recursive: true });
      console.log('✅ Sessions nettoyées');
    }
  } catch (error) {
    console.warn('⚠️ Impossible de nettoyer les sessions:', error.message);
  }
}

function startBot() {
  console.log('🚀 Démarrage du bot PestAlert...');
  
  // Nettoyer les sessions avant de démarrer
  cleanupSessions();
  
  // Démarrer le bot
  const botProcess = spawn('npm', ['run', 'start'], {
    stdio: 'inherit',
    shell: true
  });
  
  botProcess.on('close', (code) => {
    console.log(`\n📵 Bot arrêté avec le code: ${code}`);
    
    if (code !== 0) {
      console.log('🔄 Redémarrage automatique dans 10 secondes...');
      setTimeout(() => {
        startBot();
      }, 10000);
    }
  });
  
  botProcess.on('error', (error) => {
    console.error('❌ Erreur lors du démarrage:', error);
    console.log('🔄 Nouvelle tentative dans 15 secondes...');
    setTimeout(() => {
      startBot();
    }, 15000);
  });
  
  // Gestionnaire d'arrêt propre
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt demandé...');
    botProcess.kill('SIGTERM');
    process.exit(0);
  });
}

// Démarrer le bot
startBot();
