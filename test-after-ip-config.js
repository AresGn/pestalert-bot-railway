const axios = require('axios');
const fs = require('fs');

/**
 * Test de connectivité après changement d'IP
 * Vérifie les APIs OpenEPI et PlantNet
 */

async function testAfterIPConfig() {
  console.log('🌐 Test de connectivité après changement d\'IP');
  console.log('='.repeat(50));

  // 1. Vérifier l'IP actuelle
  console.log('\n📍 1. Vérification de l\'IP actuelle...');
  try {
    const ipResponse = await axios.get('https://api.ipify.org?format=json', { timeout: 10000 });
    const currentIP = ipResponse.data.ip;
    console.log(`   IP actuelle: ${currentIP}`);

    // Sauvegarder l'historique des IPs
    const ipHistory = {
      timestamp: new Date().toISOString(),
      ip: currentIP,
      test: 'after-ip-config'
    };

    try {
      let history = [];
      if (fs.existsSync('ip-history.json')) {
        history = JSON.parse(fs.readFileSync('ip-history.json', 'utf8'));
      }
      history.push(ipHistory);
      fs.writeFileSync('ip-history.json', JSON.stringify(history, null, 2));
      console.log(`   ✅ IP sauvegardée dans ip-history.json`);
    } catch (error) {
      console.log(`   ⚠️ Erreur sauvegarde IP: ${error.message}`);
    }

  } catch (error) {
    console.log(`   ❌ Erreur récupération IP: ${error.message}`);
  }

  // 2. Test OpenEPI APIs
  console.log('\n🔬 2. Test des APIs OpenEPI...');
  
  const openEPITests = [
    {
      name: 'Auth Token',
      url: 'https://openepi.io/api/auth/token',
      method: 'POST',
      data: {
        username: process.env.OPENEPI_USERNAME || 'test',
        password: process.env.OPENEPI_PASSWORD || 'test'
      }
    },
    {
      name: 'Crop Health Status',
      url: 'https://openepi.io/api/crop-health/status',
      method: 'GET'
    }
  ];

  for (const test of openEPITests) {
    try {
      console.log(`   🧪 Test ${test.name}...`);
      const config = {
        method: test.method,
        url: test.url,
        timeout: 15000,
        headers: {
          'User-Agent': 'PestAlert-Bot/1.0',
          'Accept': 'application/json'
        }
      };

      if (test.data) {
        config.data = test.data;
        config.headers['Content-Type'] = 'application/json';
      }

      const response = await axios(config);
      console.log(`   ✅ ${test.name}: ${response.status} ${response.statusText}`);
      
      if (response.data) {
        const dataStr = JSON.stringify(response.data).substring(0, 100);
        console.log(`      Données: ${dataStr}...`);
      }

    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.response?.status || 'TIMEOUT'} - ${error.message}`);
      if (error.response?.data) {
        const errorStr = JSON.stringify(error.response.data).substring(0, 100);
        console.log(`      Erreur: ${errorStr}...`);
      }
    }
  }

  // 3. Test PlantNet API
  console.log('\n🌱 3. Test PlantNet API...');
  
  if (process.env.PLANTNET_API_KEY) {
    try {
      console.log('   🧪 Test PlantNet status...');
      
      // Test simple avec une requête de base
      const plantNetUrl = `https://my-api.plantnet.org/v2/projects?api-key=${process.env.PLANTNET_API_KEY}`;
      
      const response = await axios.get(plantNetUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'PestAlert-Bot/1.0',
          'Accept': 'application/json'
        }
      });

      console.log(`   ✅ PlantNet: ${response.status} ${response.statusText}`);
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`      Projets disponibles: ${response.data.length}`);
        response.data.slice(0, 3).forEach(project => {
          console.log(`      - ${project}`);
        });
      }

    } catch (error) {
      console.log(`   ❌ PlantNet: ${error.response?.status || 'TIMEOUT'} - ${error.message}`);
      if (error.response?.data) {
        const errorStr = JSON.stringify(error.response.data).substring(0, 100);
        console.log(`      Erreur: ${errorStr}...`);
      }
    }
  } else {
    console.log('   ⚠️ PLANTNET_API_KEY non configurée');
  }

  // 4. Test de connectivité générale
  console.log('\n🌐 4. Test de connectivité générale...');
  
  const connectivityTests = [
    { name: 'Google DNS', url: 'https://8.8.8.8', timeout: 5000 },
    { name: 'Cloudflare', url: 'https://1.1.1.1', timeout: 5000 },
    { name: 'GitHub', url: 'https://api.github.com', timeout: 10000 }
  ];

  for (const test of connectivityTests) {
    try {
      console.log(`   🧪 Test ${test.name}...`);
      const start = Date.now();
      await axios.get(test.url, { timeout: test.timeout });
      const duration = Date.now() - start;
      console.log(`   ✅ ${test.name}: OK (${duration}ms)`);
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.code || error.message}`);
    }
  }

  // 5. Résumé
  console.log('\n📊 5. Résumé...');
  console.log('   🔧 Actions recommandées si des tests échouent:');
  console.log('      1. Vérifier la connexion internet');
  console.log('      2. Vérifier les clés API dans .env');
  console.log('      3. Redémarrer le bot: npm run restart');
  console.log('      4. Vérifier les logs du bot pour plus de détails');
  
  console.log('\n✅ Test de connectivité terminé');
}

// Exécuter le test
if (require.main === module) {
  // Charger les variables d'environnement
  require('dotenv').config();
  
  testAfterIPConfig().catch(error => {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  });
}

module.exports = { testAfterIPConfig };
