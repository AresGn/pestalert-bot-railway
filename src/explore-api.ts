/**
 * Script pour explorer l'API OpenEPI et trouver les bonnes routes
 */

import dotenv from 'dotenv';
import { AuthService } from './services/authService';

// Charger les variables d'environnement
dotenv.config();

async function exploreAPI() {
  console.log('🔍 Exploration de l\'API OpenEPI\n');

  const authService = new AuthService();

  try {
    // Obtenir le token
    const token = await authService.getAccessToken();
    console.log('✅ Token obtenu\n');

    // Routes à tester
    const routesToTest = [
      // Routes de base
      'https://api.openepi.io',
      'https://api.openepi.io/crop-health',
      'https://api.openepi.io/crop-health/ping',
      'https://api.openepi.io/crop-health/health',
      'https://api.openepi.io/crop-health/status',
      
      // Routes de prédiction possibles
      'https://api.openepi.io/crop-health/predict',
      'https://api.openepi.io/crop-health/predictions',
      'https://api.openepi.io/crop-health/predictionsWithBinary',
      'https://api.openepi.io/crop-health/predictionsWithProbabilities',
      'https://api.openepi.io/crop-health/prediction/binary',
      'https://api.openepi.io/crop-health/prediction/probabilities',
      
      // Autres possibilités
      'https://api.openepi.io/v1/crop-health/predictions',
      'https://api.openepi.io/api/crop-health/predictions',
    ];

    console.log('🧪 Test des routes disponibles:\n');

    for (const route of routesToTest) {
      try {
        console.log(`Testing: ${route}`);
        
        const response = await fetch(route, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        console.log(`  Status: ${response.status}`);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              const data = await response.json();
              console.log(`  ✅ SUCCESS: ${JSON.stringify(data)}`);
            } catch {
              const text = await response.text();
              console.log(`  ✅ SUCCESS: ${text}`);
            }
          } else {
            const text = await response.text();
            console.log(`  ✅ SUCCESS: ${text}`);
          }
        } else {
          const errorText = await response.text();
          console.log(`  ❌ ERROR: ${errorText}`);
        }
        
      } catch (error: any) {
        console.log(`  💥 EXCEPTION: ${error.message}`);
      }
      
      console.log(''); // Ligne vide
    }

    // Test spécial pour obtenir la documentation OpenAPI
    console.log('📚 Tentative de récupération de la documentation OpenAPI:\n');
    
    const openApiRoutes = [
      'https://api.openepi.io/crop-health/openapi.json',
      'https://api.openepi.io/crop-health/docs',
      'https://api.openepi.io/crop-health/swagger.json',
      'https://api.openepi.io/openapi.json',
      'https://api.openepi.io/docs'
    ];

    for (const route of openApiRoutes) {
      try {
        console.log(`Testing OpenAPI: ${route}`);
        
        const response = await fetch(route, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        console.log(`  Status: ${response.status}`);
        
        if (response.ok) {
          const data: any = await response.json();
          console.log(`  ✅ OpenAPI found!`);
          console.log(`  Paths available:`, Object.keys(data.paths || {}));

          // Sauvegarder la documentation
          require('fs').writeFileSync('./openapi-spec.json', JSON.stringify(data, null, 2));
          console.log(`  💾 Saved to openapi-spec.json`);
          break;
        }
        
      } catch (error: any) {
        console.log(`  ❌ Error: ${error.message}`);
      }
      
      console.log('');
    }

  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  }
}

if (require.main === module) {
  exploreAPI();
}
