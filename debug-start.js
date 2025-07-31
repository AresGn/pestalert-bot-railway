console.log('🔍 Debug démarrage...');

try {
  console.log('1. Chargement dotenv...');
  require('dotenv').config();
  
  console.log('2. Variables env importantes:');
  console.log('   SIMPLIFIED_MODE:', process.env.SIMPLIFIED_MODE);
  console.log('   OPENEPI_BASE_URL:', process.env.OPENEPI_BASE_URL ? 'OK' : 'MANQUANT');
  
  console.log('3. Test import express...');
  const express = require('express');
  console.log('   Express OK');
  
  console.log('4. Test import whatsapp-web.js...');
  const { Client } = require('whatsapp-web.js');
  console.log('   WhatsApp Web OK');
  
  console.log('5. Test import services...');
  const { AudioService } = require('./dist/services/audioService');
  console.log('   AudioService OK');
  
  const { UserSessionService } = require('./dist/services/userSessionService');
  console.log('   UserSessionService OK');
  
  const { SimplifiedMenuService } = require('./dist/services/simplifiedMenuService');
  console.log('   SimplifiedMenuService OK');
  
  console.log('6. Test création instances...');
  const audioService = new AudioService();
  console.log('   AudioService instance OK');
  
  const userSessionService = new UserSessionService();
  console.log('   UserSessionService instance OK');
  
  const simplifiedMenuService = new SimplifiedMenuService(audioService, userSessionService);
  console.log('   SimplifiedMenuService instance OK');
  
  console.log('✅ Tous les imports et instances fonctionnent !');
  console.log('🔍 Le problème est probablement dans l\'initialisation du client WhatsApp...');
  
} catch (error) {
  console.error('❌ Erreur détectée:', error.message);
  console.error('Stack:', error.stack);
}
