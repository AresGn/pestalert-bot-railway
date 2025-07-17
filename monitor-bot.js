#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Moniteur de surveillance pour le bot PestAlert
 * Redémarre automatiquement le bot en cas de crash ou d'erreur
 */

let restartCount = 0;
const maxRestarts = 10; // Maximum 10 redémarrages par session
let lastRestartTime = 0;

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

function shouldRestart() {
  const now = Date.now();
  const timeSinceLastRestart = now - lastRestartTime;
  
  // Réinitialiser le compteur si plus de 30 minutes se sont écoulées
  if (timeSinceLastRestart > 30 * 60 * 1000) {
    restartCount = 0;
  }
  
  if (restartCount >= maxRestarts) {
    console.log(`❌ Limite de redémarrages atteinte (${maxRestarts}). Arrêt du moniteur.`);
    return false;
  }
  
  return true;
}

function startBot() {
  if (!shouldRestart()) {
    process.exit(1);
  }
  
  console.log(`🚀 Démarrage du bot PestAlert (tentative ${restartCount + 1})...`);
  
  // Nettoyer les sessions avant de démarrer
  cleanupSessions();
  
  // Compiler d'abord
  console.log('🔨 Compilation du TypeScript...');
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
  });
  
  buildProcess.on('close', (buildCode) => {
    if (buildCode !== 0) {
      console.error('❌ Erreur de compilation');
      setTimeout(() => {
        startBot();
      }, 10000);
      return;
    }
    
    console.log('✅ Compilation réussie, démarrage du bot...');
    
    // Démarrer le bot
    const botProcess = spawn('node', ['dist/index.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    const startTime = Date.now();
    lastRestartTime = startTime;
    restartCount++;
    
    botProcess.on('close', (code) => {
      const runTime = Date.now() - startTime;
      console.log(`\n📵 Bot arrêté avec le code: ${code} (durée: ${Math.round(runTime/1000)}s)`);
      
      // Si le bot a tourné moins de 60 secondes, c'est probablement un crash
      if (runTime < 60000) {
        console.log('⚠️ Arrêt rapide détecté, attente avant redémarrage...');
        setTimeout(() => {
          startBot();
        }, 15000); // Attendre 15 secondes
      } else {
        console.log('🔄 Redémarrage automatique dans 5 secondes...');
        setTimeout(() => {
          startBot();
        }, 5000);
      }
    });
    
    botProcess.on('error', (error) => {
      console.error('❌ Erreur lors du démarrage:', error);
      console.log('🔄 Nouvelle tentative dans 20 secondes...');
      setTimeout(() => {
        startBot();
      }, 20000);
    });
    
    // Gestionnaire d'arrêt propre
    process.on('SIGINT', () => {
      console.log('\n🛑 Arrêt du moniteur demandé...');
      botProcess.kill('SIGTERM');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Arrêt du moniteur (SIGTERM)...');
      botProcess.kill('SIGTERM');
      process.exit(0);
    });
  });
  
  buildProcess.on('error', (error) => {
    console.error('❌ Erreur lors de la compilation:', error);
    setTimeout(() => {
      startBot();
    }, 15000);
  });
}

console.log('🔍 Moniteur PestAlert Bot démarré');
console.log(`📊 Configuration: max ${maxRestarts} redémarrages par 30 minutes`);
console.log('🛑 Utilisez Ctrl+C pour arrêter le moniteur\n');

// Démarrer le bot
startBot();
