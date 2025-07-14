/**
 * Script pour tester l'authentification OpenEPI
 */

import dotenv from 'dotenv';
import { AuthService } from './services/authService';

// Charger les variables d'environnement
dotenv.config();

// Debug: vérifier le chargement des variables
console.log('🔍 Debug variables d\'environnement:');
console.log('OPENEPI_CLIENT_ID:', process.env.OPENEPI_CLIENT_ID);
console.log('OPENEPI_CLIENT_SECRET:', process.env.OPENEPI_CLIENT_SECRET ? 'Défini' : 'Non défini');
console.log('');

async function testAuthentication() {
  console.log('🔐 Test d\'authentification OpenEPI\n');

  const authService = new AuthService();

  console.log('📋 Configuration actuelle:');
  console.log('- Client ID:', process.env.OPENEPI_CLIENT_ID);
  console.log('- Client Secret:', process.env.OPENEPI_CLIENT_SECRET ? '***' + process.env.OPENEPI_CLIENT_SECRET.slice(-4) : 'Non défini');
  console.log('- Auth URL:', process.env.OPENEPI_AUTH_URL);
  console.log('');

  if (!authService.isConfigured()) {
    console.log('❌ Configuration incomplète');
    return;
  }

  try {
    console.log('🔄 Tentative d\'obtention du token...');
    const token = await authService.getAccessToken();
    console.log('✅ Token obtenu avec succès!');
    console.log('Token (premiers caractères):', token.substring(0, 20) + '...');
    
    // Test d'un appel API simple
    console.log('\n🧪 Test d\'appel API...');
    const testResponse = await fetch('https://api.openepi.io/crop-health/ping', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    console.log('Status:', testResponse.status);
    if (testResponse.ok) {
      const data = await testResponse.text();
      console.log('✅ API accessible:', data);
    } else {
      const errorText = await testResponse.text();
      console.log('❌ Erreur API:', errorText);
    }

  } catch (error: any) {
    console.log('❌ Erreur:', error.message);
    
    if (error.message.includes('invalid_client')) {
      console.log('\n💡 Suggestions:');
      console.log('- Vérifiez que les clés Client ID et Client Secret sont correctes');
      console.log('- Vérifiez que les clés ne sont pas expirées');
      console.log('- Contactez OpenEPI pour vérifier vos credentials');
    }
  }
}

if (require.main === module) {
  testAuthentication();
}
