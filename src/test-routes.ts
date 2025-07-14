/**
 * Script pour tester les routes spécifiques de l'API OpenEPI
 */

import dotenv from 'dotenv';
import { AuthService } from './services/authService';

// Charger les variables d'environnement
dotenv.config();

async function testSpecificRoutes() {
  console.log('🔍 Test des routes spécifiques OpenEPI\n');

  const authService = new AuthService();

  try {
    // Obtenir le token
    const token = await authService.getAccessToken();
    console.log('✅ Token obtenu\n');

    // Routes spécifiques à tester
    const routes = [
      {
        name: 'Crop Health Ping',
        url: 'https://api.openepi.io/crop-health/ping',
        method: 'GET'
      },
      {
        name: 'Crop Health Status',
        url: 'https://api.openepi.io/crop-health/status',
        method: 'GET'
      },
      {
        name: 'Crop Health Health Check',
        url: 'https://api.openepi.io/crop-health/health',
        method: 'GET'
      },
      {
        name: 'Crop Health Root',
        url: 'https://api.openepi.io/crop-health/',
        method: 'GET'
      },
      {
        name: 'Predictions Binary (GET)',
        url: 'https://api.openepi.io/crop-health/predictionsWithBinary',
        method: 'GET'
      },
      {
        name: 'Predictions Probabilities (GET)',
        url: 'https://api.openepi.io/crop-health/predictionsWithProbabilities',
        method: 'GET'
      }
    ];

    for (const route of routes) {
      console.log(`🧪 Testing: ${route.name}`);
      console.log(`   URL: ${route.url}`);
      console.log(`   Method: ${route.method}`);
      
      try {
        const response = await fetch(route.url, {
          method: route.method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'User-Agent': 'OpenEPI-NodeJS-Client/1.0'
          }
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          console.log(`   Content-Type: ${contentType}`);
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const data = await response.json();
              console.log(`   ✅ Response: ${JSON.stringify(data, null, 2)}`);
            } catch {
              const text = await response.text();
              console.log(`   ✅ Response: ${text.substring(0, 200)}...`);
            }
          } else {
            const text = await response.text();
            console.log(`   ✅ Response: ${text.substring(0, 200)}...`);
          }
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Error: ${errorText}`);
        }
        
      } catch (error: any) {
        console.log(`   💥 Exception: ${error.message}`);
      }
      
      console.log(''); // Ligne vide
    }

    // Test spécial pour POST avec une image factice
    console.log('🖼️ Test POST avec image factice:\n');
    
    const postRoutes = [
      'https://api.openepi.io/crop-health/predictionsWithBinary',
      'https://api.openepi.io/crop-health/predictionsWithProbabilities',
      'https://api.openepi.io/crop-health/predict',
      'https://api.openepi.io/crop-health/predictions'
    ];

    for (const url of postRoutes) {
      console.log(`🧪 Testing POST: ${url}`);
      
      try {
        // Créer un FormData factice
        const formData = new FormData();
        
        // Créer un blob d'image factice (1x1 pixel PNG)
        const imageData = new Uint8Array([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
          0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
          0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
          0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
          0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        
        const blob = new Blob([imageData], { type: 'image/png' });
        formData.append('image', blob, 'test.png');

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: formData
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ SUCCESS: ${JSON.stringify(data, null, 2)}`);
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Error: ${errorText}`);
        }
        
      } catch (error: any) {
        console.log(`   💥 Exception: ${error.message}`);
      }
      
      console.log('');
    }

  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  }
}

if (require.main === module) {
  testSpecificRoutes();
}
