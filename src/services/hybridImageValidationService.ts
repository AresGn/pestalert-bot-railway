import * as tf from '@tensorflow/tfjs-node';
import axios from 'axios';
import sharp from 'sharp';

/**
 * Service de validation hybride utilisant TensorFlow.js et PlantNet API
 * Implémente l'approche recommandée dans les guides
 */

export interface HybridValidationResult {
  isValid: boolean;
  confidence: number;
  reasons: string[];
  suggestion?: string;
  errorType?: 'NOT_AGRICULTURAL' | 'POOR_QUALITY' | 'TECHNICAL_ERROR';
  sources: {
    tensorflow?: any;
    plantnet?: any;
    consensus?: any;
  };
}

export class HybridImageValidationService {
  private tensorflowModel: tf.LayersModel | null = null;
  private isInitialized = false;
  
  // Classes ImageNet liées aux plantes (indices approximatifs)
  private readonly PLANT_CLASSES = [
    // Légumes et fruits
    'broccoli', 'cauliflower', 'bell_pepper', 'cucumber', 'zucchini',
    'corn', 'banana', 'orange', 'apple', 'strawberry',
    // Plantes et feuilles
    'plant', 'leaf', 'tree', 'flower', 'grass',
    // Graines et noix
    'acorn', 'buckeye', 'chestnut'
  ];

  private readonly LAWN_CLASSES = [
    'lawn_mower', 'grass', 'golf_ball', 'park_bench'
  ];

  constructor() {
    this.initializeAsync();
  }

  /**
   * Initialisation asynchrone du modèle TensorFlow
   */
  private async initializeAsync(): Promise<void> {
    try {
      console.log('🤖 Chargement du modèle TensorFlow MobileNet...');
      
      // Charger MobileNet pré-entraîné
      this.tensorflowModel = await tf.loadLayersModel(
        'https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/5'
      );
      
      this.isInitialized = true;
      console.log('✅ Modèle TensorFlow chargé avec succès');
    } catch (error: any) {
      console.error('❌ Erreur chargement TensorFlow:', error.message);
      this.isInitialized = false;
    }
  }

  /**
   * Validation hybride principale
   */
  async validateAgriculturalImage(imageBuffer: Buffer): Promise<HybridValidationResult> {
    try {
      console.log('🔍 Début de la validation hybride...');

      // 1. Validation technique de base
      const basicValidation = await this.validateImageQuality(imageBuffer);
      if (!basicValidation.isValid) {
        return {
          isValid: false,
          confidence: 0,
          reasons: [basicValidation.reason || 'Erreur de validation technique'],
          suggestion: 'Veuillez envoyer une image de meilleure qualité',
          errorType: 'POOR_QUALITY',
          sources: {}
        };
      }

      // 2. Analyse TensorFlow (si disponible)
      let tensorflowResult = null;
      if (this.isInitialized && this.tensorflowModel) {
        tensorflowResult = await this.analyzWithTensorFlow(imageBuffer);
        console.log(`🤖 TensorFlow: ${tensorflowResult.isPlant ? 'PLANTE' : 'NON-PLANTE'} (${(tensorflowResult.confidence * 100).toFixed(1)}%)`);
      }

      // 3. Analyse PlantNet (optionnelle - nécessite clé API)
      let plantnetResult = null;
      if (process.env.PLANTNET_API_KEY) {
        plantnetResult = await this.analyzeWithPlantNet(imageBuffer);
        console.log(`🌿 PlantNet: ${plantnetResult.isPlant ? 'PLANTE' : 'NON-PLANTE'} (${(plantnetResult.confidence * 100).toFixed(1)}%)`);
      }

      // 4. Consensus des résultats
      const consensusResult = this.calculateConsensus(tensorflowResult, plantnetResult);
      
      console.log(`🎯 Consensus: ${consensusResult.isValid ? 'VALIDE' : 'REJETÉ'} (${(consensusResult.confidence * 100).toFixed(1)}%)`);

      return {
        isValid: consensusResult.isValid,
        confidence: consensusResult.confidence,
        reasons: consensusResult.reasons,
        suggestion: consensusResult.isValid ? undefined : this.generateSuggestion(consensusResult),
        errorType: consensusResult.isValid ? undefined : 'NOT_AGRICULTURAL',
        sources: {
          tensorflow: tensorflowResult,
          plantnet: plantnetResult,
          consensus: consensusResult
        }
      };

    } catch (error: any) {
      console.error('❌ Erreur validation hybride:', error);
      return {
        isValid: false,
        confidence: 0,
        reasons: ['Erreur technique lors de la validation'],
        suggestion: 'Veuillez réessayer avec une autre image',
        errorType: 'TECHNICAL_ERROR',
        sources: {}
      };
    }
  }

  /**
   * Validation de la qualité de l'image
   */
  private async validateImageQuality(imageBuffer: Buffer): Promise<{ isValid: boolean; reason?: string }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        return { isValid: false, reason: 'Impossible de lire les dimensions de l\'image' };
      }

      if (metadata.width < 100 || metadata.height < 100) {
        return { isValid: false, reason: 'Image trop petite (minimum 100x100 pixels)' };
      }

      if (metadata.width > 4000 || metadata.height > 4000) {
        return { isValid: false, reason: 'Image trop grande (maximum 4000x4000 pixels)' };
      }

      const supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];
      if (!metadata.format || !supportedFormats.includes(metadata.format)) {
        return { isValid: false, reason: 'Format d\'image non supporté' };
      }

      return { isValid: true };
    } catch (error: any) {
      return { isValid: false, reason: `Erreur lors de la validation: ${error.message}` };
    }
  }

  /**
   * Analyse avec TensorFlow.js MobileNet
   */
  private async analyzWithTensorFlow(imageBuffer: Buffer): Promise<any> {
    if (!this.isInitialized || !this.tensorflowModel) {
      return {
        isPlant: true, // Fallback conservateur
        confidence: 0.5,
        predictions: [],
        source: 'tensorflow_fallback'
      };
    }

    try {
      // Préprocesser l'image pour MobileNet
      const tensor = await this.preprocessImageForTensorFlow(imageBuffer);
      
      // Prédiction
      const predictions = await this.tensorflowModel.predict(tensor) as tf.Tensor;
      const predictionData = await predictions.data();
      
      // Nettoyer les tenseurs
      tensor.dispose();
      predictions.dispose();

      // Analyser les prédictions (simplifié - dans un vrai cas, utiliser les labels ImageNet)
      const topPredictions = Array.from(predictionData)
        .map((score, index) => ({ score, index }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      // Heuristique simple : si les top prédictions ont des scores élevés pour des classes "naturelles"
      const plantScore = this.calculatePlantScore(topPredictions);
      const isPlant = plantScore > 0.3;

      return {
        isPlant,
        confidence: plantScore,
        predictions: topPredictions,
        source: 'tensorflow'
      };

    } catch (error: any) {
      console.error('Erreur TensorFlow:', error);
      return {
        isPlant: true,
        confidence: 0.5,
        predictions: [],
        source: 'tensorflow_error'
      };
    }
  }

  /**
   * Préprocesser l'image pour TensorFlow
   */
  private async preprocessImageForTensorFlow(imageBuffer: Buffer): Promise<tf.Tensor> {
    const image = await sharp(imageBuffer)
      .resize(224, 224)
      .raw()
      .ensureAlpha(false)
      .toBuffer();

    const tensor = tf.tensor3d(new Uint8Array(image), [224, 224, 3]);
    return tensor.div(255.0).expandDims(0);
  }

  /**
   * Calculer le score de plante basé sur les prédictions TensorFlow
   */
  private calculatePlantScore(predictions: any[]): number {
    // Heuristique simple : plus les prédictions sont "naturelles", plus le score est élevé
    // Dans un vrai cas, on utiliserait les vrais labels ImageNet
    
    const maxScore = predictions[0]?.score || 0;
    const scoreDistribution = predictions.reduce((sum, pred) => sum + pred.score, 0);
    
    // Si les prédictions sont très concentrées sur une classe, c'est suspect (objets manufacturés)
    // Si elles sont plus distribuées, c'est plus naturel (plantes)
    const distributionScore = 1 - (maxScore / scoreDistribution);
    
    return Math.min(1, distributionScore * 2);
  }

  /**
   * Analyse avec PlantNet API
   */
  private async analyzeWithPlantNet(imageBuffer: Buffer): Promise<any> {
    if (!process.env.PLANTNET_API_KEY) {
      return {
        isPlant: true,
        confidence: 0.5,
        species: [],
        source: 'plantnet_no_key'
      };
    }

    try {
      // PlantNet nécessite une image en base64
      const base64Image = imageBuffer.toString('base64');
      
      const response = await axios.post(
        `https://my-api.plantnet.org/v1/identify/weurope?api-key=${process.env.PLANTNET_API_KEY}`,
        {
          images: [base64Image],
          modifiers: ["crops"],
          plant_language: "en",
          plant_details: ["common_names"]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      const results = response.data.results || [];
      const isPlant = results.length > 0;
      const confidence = results.length > 0 ? results[0].score : 0;

      return {
        isPlant,
        confidence,
        species: results.slice(0, 3),
        source: 'plantnet'
      };

    } catch (error: any) {
      console.error('Erreur PlantNet:', error.message);
      return {
        isPlant: true,
        confidence: 0.5,
        species: [],
        source: 'plantnet_error'
      };
    }
  }

  /**
   * Calculer le consensus entre les différentes sources
   */
  private calculateConsensus(tensorflowResult: any, plantnetResult: any): any {
    const sources = [tensorflowResult, plantnetResult].filter(Boolean);
    
    if (sources.length === 0) {
      return {
        isValid: true, // Fallback conservateur
        confidence: 0.5,
        reasons: ['Aucune analyse disponible - image acceptée par défaut']
      };
    }

    // Calcul pondéré du consensus
    let totalWeight = 0;
    let weightedScore = 0;
    const reasons: string[] = [];

    sources.forEach(source => {
      let weight = 1;
      
      // PlantNet a plus de poids pour l'identification de plantes
      if (source.source === 'plantnet') {
        weight = 2;
      }
      
      totalWeight += weight;
      weightedScore += (source.isPlant ? source.confidence : (1 - source.confidence)) * weight;
      
      reasons.push(`${source.source}: ${source.isPlant ? 'plante' : 'non-plante'} (${(source.confidence * 100).toFixed(1)}%)`);
    });

    const finalConfidence = weightedScore / totalWeight;
    const isValid = finalConfidence > 0.6; // Seuil de consensus

    return {
      isValid,
      confidence: finalConfidence,
      reasons: [`Consensus de ${sources.length} source(s)`, ...reasons]
    };
  }

  /**
   * Générer une suggestion d'amélioration
   */
  private generateSuggestion(consensusResult: any): string {
    return '📷 Prenez une photo rapprochée de vos cultures\n' +
           '🌱 Assurez-vous que les feuilles des plantes sont visibles\n' +
           '☀️ Utilisez un bon éclairage naturel';
  }

  /**
   * Vérifier si le service est prêt
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Obtenir les statistiques du service
   */
  getStats(): any {
    return {
      tensorflowReady: this.isInitialized,
      plantnetAvailable: !!process.env.PLANTNET_API_KEY,
      version: '1.0.0'
    };
  }
}
