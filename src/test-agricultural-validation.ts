import fs from 'fs';
import path from 'path';
import { AgriculturalImageValidationService } from './services/agriculturalImageValidationService';
import { HealthAnalysisService } from './services/healthAnalysisService';
import { UserGuidanceService } from './services/userGuidanceService';

/**
 * Script de test pour valider le système de filtrage d'images agricoles
 * Teste avec différents types d'images pour s'assurer que le filtrage fonctionne
 */

interface TestResult {
  filename: string;
  expectedType: 'agricultural' | 'non-agricultural';
  actualResult: boolean;
  confidence: number;
  reasons: string[];
  isCorrect: boolean;
  processingTime: number;
}

class AgriculturalValidationTester {
  private validationService: AgriculturalImageValidationService;
  private healthAnalysisService: HealthAnalysisService;
  private guidanceService: UserGuidanceService;

  constructor() {
    this.validationService = new AgriculturalImageValidationService();
    this.healthAnalysisService = new HealthAnalysisService();
    this.guidanceService = new UserGuidanceService();
  }

  /**
   * Exécuter une série de tests avec différents types d'images
   */
  async runTests(): Promise<void> {
    console.log('🧪 Début des tests de validation d\'images agricoles\n');

    // Tests avec des images simulées (vous pouvez remplacer par de vraies images)
    const testCases = [
      { name: 'corn_healthy.jpg', type: 'agricultural' as const, description: 'Maïs sain' },
      { name: 'cassava_diseased.jpg', type: 'agricultural' as const, description: 'Manioc malade' },
      { name: 'beans_leaves.jpg', type: 'agricultural' as const, description: 'Feuilles de haricots' },
      { name: 'house_photo.jpg', type: 'non-agricultural' as const, description: 'Photo de maison' },
      { name: 'car_image.jpg', type: 'non-agricultural' as const, description: 'Photo de voiture' },
      { name: 'person_selfie.jpg', type: 'non-agricultural' as const, description: 'Selfie' },
      { name: 'food_plate.jpg', type: 'non-agricultural' as const, description: 'Plat de nourriture' },
      { name: 'landscape.jpg', type: 'non-agricultural' as const, description: 'Paysage sans cultures' }
    ];

    const results: TestResult[] = [];

    for (const testCase of testCases) {
      console.log(`🔍 Test: ${testCase.description} (${testCase.name})`);
      
      try {
        // Créer une image de test simulée
        const testImageBuffer = this.createTestImageBuffer(testCase.type);
        
        const startTime = Date.now();
        const validationResult = await this.validationService.validateAgriculturalImage(testImageBuffer);
        const processingTime = Date.now() - startTime;

        const result: TestResult = {
          filename: testCase.name,
          expectedType: testCase.type,
          actualResult: validationResult.isValid,
          confidence: validationResult.confidence,
          reasons: validationResult.reasons,
          isCorrect: (testCase.type === 'agricultural') === validationResult.isValid,
          processingTime
        };

        results.push(result);

        // Afficher le résultat
        const status = result.isCorrect ? '✅' : '❌';
        console.log(`${status} Résultat: ${validationResult.isValid ? 'AGRICOLE' : 'NON-AGRICOLE'} (${(validationResult.confidence * 100).toFixed(1)}%)`);
        console.log(`   Raisons: ${validationResult.reasons.join(', ')}`);
        console.log(`   Temps: ${processingTime}ms\n`);

        // Tester les messages d'erreur si l'image est rejetée
        if (!validationResult.isValid) {
          console.log('📝 Message d\'erreur généré:');
          const errorMessage = this.generateTestErrorMessage(validationResult);
          console.log(errorMessage);
          console.log('');
        }

      } catch (error: any) {
        console.error(`❌ Erreur lors du test ${testCase.name}: ${error.message}\n`);
      }
    }

    // Afficher le résumé des résultats
    this.displayTestSummary(results);
  }

  /**
   * Créer un buffer d'image de test simulé
   */
  private createTestImageBuffer(type: 'agricultural' | 'non-agricultural'): Buffer {
    // Simulation d'un buffer d'image
    // Dans un vrai test, vous chargeriez de vraies images
    
    if (type === 'agricultural') {
      // Simuler une image avec beaucoup de vert (végétation)
      return this.createSimulatedImageBuffer(true);
    } else {
      // Simuler une image sans végétation
      return this.createSimulatedImageBuffer(false);
    }
  }

  /**
   * Créer un buffer d'image simulé avec ou sans caractéristiques agricoles
   */
  private createSimulatedImageBuffer(hasVegetation: boolean): Buffer {
    // Créer une image JPEG minimale simulée
    const width = 224;
    const height = 224;
    const channels = 3;
    
    const imageData = new Uint8Array(width * height * channels);
    
    for (let i = 0; i < imageData.length; i += channels) {
      if (hasVegetation) {
        // Simuler de la végétation (plus de vert)
        imageData[i] = Math.random() * 100 + 50;     // Rouge
        imageData[i + 1] = Math.random() * 100 + 150; // Vert (dominant)
        imageData[i + 2] = Math.random() * 100 + 50;   // Bleu
      } else {
        // Simuler une image non-végétale (couleurs variées sans dominance verte)
        imageData[i] = Math.random() * 255;     // Rouge
        imageData[i + 1] = Math.random() * 100; // Vert (faible)
        imageData[i + 2] = Math.random() * 255; // Bleu
      }
    }

    // Créer un header JPEG minimal
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43
    ]);

    const jpegFooter = Buffer.from([0xFF, 0xD9]);
    
    return Buffer.concat([jpegHeader, Buffer.from(imageData), jpegFooter]);
  }

  /**
   * Générer un message d'erreur de test
   */
  private generateTestErrorMessage(validationResult: any): string {
    const contextualHelp = this.guidanceService.getContextualHelp(
      validationResult.errorType || 'UNKNOWN',
      validationResult.confidence
    );
    
    return `🚫 **Test - Image rejetée**\n\n${contextualHelp}`;
  }

  /**
   * Afficher le résumé des tests
   */
  private displayTestSummary(results: TestResult[]): void {
    console.log('📊 RÉSUMÉ DES TESTS\n');
    console.log('='.repeat(50));

    const totalTests = results.length;
    const correctResults = results.filter(r => r.isCorrect).length;
    const accuracy = (correctResults / totalTests) * 100;

    console.log(`Total des tests: ${totalTests}`);
    console.log(`Résultats corrects: ${correctResults}`);
    console.log(`Précision: ${accuracy.toFixed(1)}%\n`);

    // Statistiques par type
    const agriculturalTests = results.filter(r => r.expectedType === 'agricultural');
    const nonAgriculturalTests = results.filter(r => r.expectedType === 'non-agricultural');

    const agriculturalAccuracy = (agriculturalTests.filter(r => r.isCorrect).length / agriculturalTests.length) * 100;
    const nonAgriculturalAccuracy = (nonAgriculturalTests.filter(r => r.isCorrect).length / nonAgriculturalTests.length) * 100;

    console.log(`Précision images agricoles: ${agriculturalAccuracy.toFixed(1)}%`);
    console.log(`Précision images non-agricoles: ${nonAgriculturalAccuracy.toFixed(1)}%\n`);

    // Temps de traitement
    const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    console.log(`Temps de traitement moyen: ${avgProcessingTime.toFixed(1)}ms\n`);

    // Détails des erreurs
    const errors = results.filter(r => !r.isCorrect);
    if (errors.length > 0) {
      console.log('❌ ERREURS DÉTECTÉES:');
      errors.forEach(error => {
        console.log(`   ${error.filename}: Attendu ${error.expectedType}, obtenu ${error.actualResult ? 'agricole' : 'non-agricole'}`);
      });
      console.log('');
    }

    // Recommandations
    if (accuracy < 90) {
      console.log('⚠️  RECOMMANDATIONS:');
      console.log('   • Ajuster les seuils de confiance');
      console.log('   • Améliorer l\'analyse des couleurs');
      console.log('   • Tester avec plus d\'images réelles');
    } else {
      console.log('✅ EXCELLENT! Le système de validation fonctionne bien.');
    }
  }

  /**
   * Tester avec une vraie image si disponible
   */
  async testWithRealImage(imagePath: string, expectedType: 'agricultural' | 'non-agricultural'): Promise<void> {
    if (!fs.existsSync(imagePath)) {
      console.log(`⚠️  Image non trouvée: ${imagePath}`);
      return;
    }

    console.log(`🔍 Test avec vraie image: ${path.basename(imagePath)}`);
    
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const validationResult = await this.validationService.validateAgriculturalImage(imageBuffer);
      
      console.log(`Résultat: ${validationResult.isValid ? 'AGRICOLE' : 'NON-AGRICOLE'}`);
      console.log(`Confiance: ${(validationResult.confidence * 100).toFixed(1)}%`);
      console.log(`Raisons: ${validationResult.reasons.join(', ')}`);
      
      const isCorrect = (expectedType === 'agricultural') === validationResult.isValid;
      console.log(`Correct: ${isCorrect ? '✅' : '❌'}\n`);
      
    } catch (error: any) {
      console.error(`❌ Erreur: ${error.message}\n`);
    }
  }
}

// Exécuter les tests si ce script est appelé directement
if (require.main === module) {
  const tester = new AgriculturalValidationTester();
  
  console.log('🚀 Lancement des tests de validation agricole...\n');
  
  tester.runTests()
    .then(() => {
      console.log('✅ Tests terminés avec succès!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur lors des tests:', error);
      process.exit(1);
    });
}

export { AgriculturalValidationTester };
