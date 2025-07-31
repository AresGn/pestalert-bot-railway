import { AgriculturalImageValidationService } from './services/agriculturalImageValidationService';
import { ImageProcessingService } from './services/imageProcessingService';

/**
 * Test simple pour valider le système de filtrage d'images agricoles
 */

async function testValidationSystem() {
  console.log('🧪 Test simple du système de validation agricole\n');

  const validationService = new AgriculturalImageValidationService();
  const imageProcessingService = new ImageProcessingService();

  // Test 1: Image simulée avec beaucoup de vert (agricole)
  console.log('📸 Test 1: Image avec végétation simulée');
  const agriculturalImage = createAgriculturalTestImage();
  
  try {
    const result1 = await validationService.validateAgriculturalImage(agriculturalImage);
    console.log(`✅ Résultat: ${result1.isValid ? 'VALIDE' : 'REJETÉ'}`);
    console.log(`📊 Confiance: ${(result1.confidence * 100).toFixed(1)}%`);
    console.log(`📋 Raisons: ${result1.reasons.join(', ')}`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Erreur: ${error.message}\n`);
  }

  // Test 2: Image simulée sans végétation (non-agricole)
  console.log('📸 Test 2: Image sans végétation simulée');
  const nonAgriculturalImage = createNonAgriculturalTestImage();
  
  try {
    const result2 = await validationService.validateAgriculturalImage(nonAgriculturalImage);
    console.log(`✅ Résultat: ${result2.isValid ? 'VALIDE' : 'REJETÉ'}`);
    console.log(`📊 Confiance: ${(result2.confidence * 100).toFixed(1)}%`);
    console.log(`📋 Raisons: ${result2.reasons.join(', ')}`);
    if (!result2.isValid && result2.suggestion) {
      console.log(`💡 Suggestion: ${result2.suggestion}`);
    }
    console.log('');
  } catch (error: any) {
    console.error(`❌ Erreur: ${error.message}\n`);
  }

  // Test 3: Analyse des couleurs directement
  console.log('🎨 Test 3: Analyse des couleurs');
  try {
    const colorAnalysis = await imageProcessingService.analyzeAgriculturalContent(agriculturalImage);
    console.log(`🌿 Pourcentage de vert: ${colorAnalysis.colorAnalysis?.greenPercentage?.toFixed(1)}%`);
    console.log(`🟤 Pourcentage de brun: ${colorAnalysis.colorAnalysis?.brownPercentage?.toFixed(1)}%`);
    console.log(`📊 Score agricole: ${(colorAnalysis.confidence * 100).toFixed(1)}%`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Erreur analyse couleurs: ${error.message}\n`);
  }

  // Test 4: Statistiques du service
  console.log('📈 Test 4: Statistiques du service');
  const stats = validationService.getValidationStats();
  console.log(`🌾 Cultures supportées: ${stats.supportedCrops.join(', ')}`);
  console.log(`🎯 Seuil de confiance minimum: ${(stats.minAgriculturalConfidence * 100).toFixed(1)}%`);
  console.log(`🌿 Pourcentage de vert minimum: ${stats.minGreenPercentage}%`);
  console.log('');

  console.log('✅ Tests terminés!');
}

/**
 * Créer une image de test simulée avec caractéristiques agricoles
 */
function createAgriculturalTestImage(): Buffer {
  // Créer une image JPEG minimale avec beaucoup de vert
  const width = 224;
  const height = 224;
  const channels = 3;
  
  const imageData = new Uint8Array(width * height * channels);
  
  // Remplir avec des couleurs vertes dominantes (végétation)
  for (let i = 0; i < imageData.length; i += channels) {
    imageData[i] = Math.random() * 80 + 40;      // Rouge (faible)
    imageData[i + 1] = Math.random() * 100 + 120; // Vert (dominant)
    imageData[i + 2] = Math.random() * 80 + 40;    // Bleu (faible)
  }

  // Ajouter quelques pixels bruns (sol)
  for (let i = 0; i < imageData.length * 0.2; i += channels) {
    const randomIndex = Math.floor(Math.random() * (imageData.length / channels)) * channels;
    imageData[randomIndex] = 120;     // Rouge
    imageData[randomIndex + 1] = 80;  // Vert
    imageData[randomIndex + 2] = 40;  // Bleu (couleur brune)
  }

  return createJPEGBuffer(imageData);
}

/**
 * Créer une image de test simulée sans caractéristiques agricoles
 */
function createNonAgriculturalTestImage(): Buffer {
  // Créer une image avec des couleurs variées mais peu de vert
  const width = 224;
  const height = 224;
  const channels = 3;
  
  const imageData = new Uint8Array(width * height * channels);
  
  // Remplir avec des couleurs non-végétales
  for (let i = 0; i < imageData.length; i += channels) {
    imageData[i] = Math.random() * 255;     // Rouge (varié)
    imageData[i + 1] = Math.random() * 60;  // Vert (très faible)
    imageData[i + 2] = Math.random() * 255; // Bleu (varié)
  }

  return createJPEGBuffer(imageData);
}

/**
 * Créer un buffer PNG minimal à partir de données d'image
 */
function createJPEGBuffer(imageData: Uint8Array): Buffer {
  // Créer une image PNG simple 1x1 pixel pour les tests
  // PNG signature + IHDR + IDAT + IEND
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk (1x1 pixel, RGB)
  const ihdr = Buffer.from([
    0x00, 0x00, 0x00, 0x0D, // Length
    0x49, 0x48, 0x44, 0x52, // "IHDR"
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, // Bit depth: 8
    0x02, // Color type: RGB
    0x00, // Compression: 0
    0x00, // Filter: 0
    0x00, // Interlace: 0
    0x90, 0x77, 0x53, 0xDE  // CRC
  ]);

  // IDAT chunk avec couleur selon le type d'image
  let pixelColor;
  if (imageData[1] > imageData[0] && imageData[1] > imageData[2]) {
    // Image verte (agricole)
    pixelColor = Buffer.from([0x00, 0xFF, 0x00]); // Vert
  } else {
    // Image non-verte (non-agricole)
    pixelColor = Buffer.from([0xFF, 0x00, 0x00]); // Rouge
  }

  const idat = Buffer.from([
    0x00, 0x00, 0x00, 0x0C, // Length
    0x49, 0x44, 0x41, 0x54, // "IDAT"
    0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4 // Compressed data
  ]);

  // IEND chunk
  const iend = Buffer.from([
    0x00, 0x00, 0x00, 0x00, // Length
    0x49, 0x45, 0x4E, 0x44, // "IEND"
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);

  return Buffer.concat([pngSignature, ihdr, idat, iend]);
}

// Exécuter le test
if (require.main === module) {
  testValidationSystem()
    .then(() => {
      console.log('🎉 Tous les tests sont terminés!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur lors des tests:', error);
      process.exit(1);
    });
}

export { testValidationSystem };
