import axios from 'axios';
import sharp from 'sharp';

/**
 * Service de validation d'images amélioré sans TensorFlow
 * Utilise PlantNet API + analyse avancée des couleurs et textures
 * Approche plus robuste que l'analyse basique précédente
 */

export interface ImprovedValidationResult {
  isValid: boolean;
  confidence: number;
  reasons: string[];
  suggestion?: string;
  errorType?: 'NOT_AGRICULTURAL' | 'POOR_QUALITY' | 'TECHNICAL_ERROR';
  sources: {
    plantnet?: any;
    colorAnalysis?: any;
    textureAnalysis?: any;
    consensus?: any;
  };
}

export class ImprovedImageValidationService {
  
  // Seuils améliorés basés sur les tests
  private readonly MIN_AGRICULTURAL_CONFIDENCE = 0.75; // Plus strict
  private readonly MIN_GREEN_PERCENTAGE = 8; // Augmenté
  private readonly MAX_UNIFORM_GREEN = 0.85; // Nouveau: détection pelouse
  private readonly MIN_TEXTURE_COMPLEXITY = 0.25; // Nouveau: texture minimale

  constructor() {}

  /**
   * Validation améliorée principale
   */
  async validateAgriculturalImage(imageBuffer: Buffer): Promise<ImprovedValidationResult> {
    try {
      console.log('🔍 Début de la validation améliorée...');

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

      // 2. Analyse avancée des couleurs et textures
      const colorAnalysis = await this.advancedColorAnalysis(imageBuffer);
      const textureAnalysis = await this.advancedTextureAnalysis(imageBuffer);
      
      console.log(`🎨 Couleurs: ${colorAnalysis.greenPercentage.toFixed(1)}% vert, ${colorAnalysis.brownPercentage.toFixed(1)}% brun`);
      console.log(`🖼️  Texture: complexité ${textureAnalysis.complexity.toFixed(2)}, uniformité ${textureAnalysis.uniformity.toFixed(2)}`);

      // 3. Analyse PlantNet (si disponible)
      let plantnetResult = null;
      if (process.env.PLANTNET_API_KEY) {
        plantnetResult = await this.analyzeWithPlantNet(imageBuffer);
        console.log(`🌿 PlantNet: ${plantnetResult.isPlant ? 'PLANTE' : 'NON-PLANTE'} (${(plantnetResult.confidence * 100).toFixed(1)}%)`);
      }

      // 4. Consensus amélioré
      const consensusResult = this.calculateImprovedConsensus(colorAnalysis, textureAnalysis, plantnetResult);
      
      console.log(`🎯 Consensus: ${consensusResult.isValid ? 'VALIDE' : 'REJETÉ'} (${(consensusResult.confidence * 100).toFixed(1)}%)`);

      return {
        isValid: consensusResult.isValid,
        confidence: consensusResult.confidence,
        reasons: consensusResult.reasons,
        suggestion: consensusResult.isValid ? undefined : this.generateImprovedSuggestion(consensusResult),
        errorType: consensusResult.isValid ? undefined : 'NOT_AGRICULTURAL',
        sources: {
          plantnet: plantnetResult,
          colorAnalysis: colorAnalysis,
          textureAnalysis: textureAnalysis,
          consensus: consensusResult
        }
      };

    } catch (error: any) {
      console.error('❌ Erreur validation améliorée:', error);
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
   * Analyse avancée des couleurs avec détection de pelouse
   */
  private async advancedColorAnalysis(imageBuffer: Buffer): Promise<any> {
    const image = sharp(imageBuffer);
    const { width, height } = await image.metadata();
    
    // Redimensionner pour l'analyse
    const analysisImage = await image
      .resize(256, 256, { fit: 'cover' })
      .raw()
      .toBuffer();

    const pixels = new Uint8Array(analysisImage);
    const totalPixels = pixels.length / 3;
    
    let greenPixels = 0;
    let brownPixels = 0;
    let darkGreenPixels = 0; // Nouveau: vert foncé (cultures)
    let lightGreenPixels = 0; // Nouveau: vert clair (pelouse)
    let bluePixels = 0; // Nouveau: détection ciel/eau
    
    const colorDistribution = new Map<string, number>();
    const greenShades: number[] = [];

    // Analyser chaque pixel
    for (let i = 0; i < pixels.length; i += 3) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Détecter les différents types de vert
      if (g > r && g > b && g > 60) {
        greenPixels++;
        greenShades.push(g);
        
        // Distinguer vert foncé (cultures) vs vert clair (pelouse)
        if (g > 120 && r < 100 && b < 100) {
          darkGreenPixels++;
        } else if (g > 100 && r > 80 && b > 80) {
          lightGreenPixels++;
        }
      }
      
      // Détecter le brun (terre, troncs)
      if (r > 80 && g > 50 && b < 80 && Math.abs(r - g) < 60) {
        brownPixels++;
      }
      
      // Détecter le bleu (ciel, eau - non agricole)
      if (b > r && b > g && b > 100) {
        bluePixels++;
      }
      
      // Distribution des couleurs
      const colorKey = `${Math.floor(r/32)}-${Math.floor(g/32)}-${Math.floor(b/32)}`;
      colorDistribution.set(colorKey, (colorDistribution.get(colorKey) || 0) + 1);
    }

    const greenPercentage = (greenPixels / totalPixels) * 100;
    const brownPercentage = (brownPixels / totalPixels) * 100;
    const darkGreenPercentage = (darkGreenPixels / totalPixels) * 100;
    const lightGreenPercentage = (lightGreenPixels / totalPixels) * 100;
    const bluePercentage = (bluePixels / totalPixels) * 100;
    
    // Calculer l'uniformité du vert (indicateur de pelouse)
    const greenUniformity = this.calculateGreenUniformity(greenShades);
    
    return {
      greenPercentage,
      brownPercentage,
      darkGreenPercentage,
      lightGreenPercentage,
      bluePercentage,
      greenUniformity,
      totalPixels,
      dominantColors: Array.from(colorDistribution.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
    };
  }

  /**
   * Calculer l'uniformité des nuances de vert
   */
  private calculateGreenUniformity(greenShades: number[]): number {
    if (greenShades.length < 10) return 0;
    
    const mean = greenShades.reduce((sum, shade) => sum + shade, 0) / greenShades.length;
    const variance = greenShades.reduce((sum, shade) => sum + Math.pow(shade - mean, 2), 0) / greenShades.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Normaliser: plus la déviation est faible, plus c'est uniforme
    return Math.max(0, 1 - (standardDeviation / 50));
  }

  /**
   * Analyse avancée de la texture
   */
  private async advancedTextureAnalysis(imageBuffer: Buffer): Promise<any> {
    // Convertir en niveaux de gris
    const grayImage = await sharp(imageBuffer)
      .resize(256, 256)
      .greyscale()
      .raw()
      .toBuffer();

    const pixels = new Uint8Array(grayImage);
    const width = 256;
    const height = 256;
    
    // Calculer les gradients dans différentes directions
    const gradients = this.calculateGradients(pixels, width, height);
    
    // Calculer la complexité de texture
    const complexity = this.calculateTextureComplexity(pixels, width, height);
    
    // Calculer l'uniformité (inverse de la variance)
    const uniformity = this.calculateUniformity(pixels);
    
    return {
      complexity,
      uniformity,
      gradients,
      edgeStrength: gradients.magnitude
    };
  }

  /**
   * Calculer les gradients d'image
   */
  private calculateGradients(pixels: Uint8Array, width: number, height: number): any {
    let totalGradientX = 0;
    let totalGradientY = 0;
    let totalMagnitude = 0;
    let edgePixels = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Gradient horizontal (Sobel X)
        const gx = -pixels[idx - width - 1] - 2 * pixels[idx - 1] - pixels[idx + width - 1] +
                   pixels[idx - width + 1] + 2 * pixels[idx + 1] + pixels[idx + width + 1];
        
        // Gradient vertical (Sobel Y)
        const gy = -pixels[idx - width - 1] - 2 * pixels[idx - width] - pixels[idx - width + 1] +
                   pixels[idx + width - 1] + 2 * pixels[idx + width] + pixels[idx + width + 1];
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        
        totalGradientX += Math.abs(gx);
        totalGradientY += Math.abs(gy);
        totalMagnitude += magnitude;
        
        if (magnitude > 30) { // Seuil pour détecter les contours
          edgePixels++;
        }
      }
    }

    const totalPixels = (width - 2) * (height - 2);
    
    return {
      averageGradientX: totalGradientX / totalPixels,
      averageGradientY: totalGradientY / totalPixels,
      magnitude: totalMagnitude / totalPixels,
      edgePercentage: (edgePixels / totalPixels) * 100
    };
  }

  /**
   * Calculer la complexité de texture
   */
  private calculateTextureComplexity(pixels: Uint8Array, width: number, height: number): number {
    // Utiliser la variance locale comme mesure de complexité
    let totalVariance = 0;
    const windowSize = 5;
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let y = halfWindow; y < height - halfWindow; y++) {
      for (let x = halfWindow; x < width - halfWindow; x++) {
        let sum = 0;
        let count = 0;
        
        // Calculer la moyenne dans la fenêtre
        for (let dy = -halfWindow; dy <= halfWindow; dy++) {
          for (let dx = -halfWindow; dx <= halfWindow; dx++) {
            const idx = (y + dy) * width + (x + dx);
            sum += pixels[idx];
            count++;
          }
        }
        
        const mean = sum / count;
        
        // Calculer la variance dans la fenêtre
        let variance = 0;
        for (let dy = -halfWindow; dy <= halfWindow; dy++) {
          for (let dx = -halfWindow; dx <= halfWindow; dx++) {
            const idx = (y + dy) * width + (x + dx);
            variance += Math.pow(pixels[idx] - mean, 2);
          }
        }
        
        totalVariance += variance / count;
      }
    }
    
    const totalWindows = (width - windowSize + 1) * (height - windowSize + 1);
    const averageVariance = totalVariance / totalWindows;
    
    // Normaliser entre 0 et 1
    return Math.min(1, averageVariance / 1000);
  }

  /**
   * Calculer l'uniformité de l'image
   */
  private calculateUniformity(pixels: Uint8Array): number {
    const mean = pixels.reduce((sum, pixel) => sum + pixel, 0) / pixels.length;
    const variance = pixels.reduce((sum, pixel) => sum + Math.pow(pixel - mean, 2), 0) / pixels.length;
    
    // Uniformité = inverse de la variance normalisée
    return Math.max(0, 1 - (variance / 10000));
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
   * Calculer le consensus amélioré
   */
  private calculateImprovedConsensus(colorAnalysis: any, textureAnalysis: any, plantnetResult: any): any {
    let score = 0;
    const reasons: string[] = [];

    // 1. Analyse des couleurs (40% du score)
    let colorScore = 0;
    
    // Bonus pour végétation verte appropriée
    if (colorAnalysis.darkGreenPercentage > 5) {
      colorScore += 0.3;
      reasons.push(`Végétation verte foncée détectée (${colorAnalysis.darkGreenPercentage.toFixed(1)}%)`);
    }
    
    // Bonus pour présence de sol/terre
    if (colorAnalysis.brownPercentage > 8) {
      colorScore += 0.2;
      reasons.push(`Sol/terre détecté (${colorAnalysis.brownPercentage.toFixed(1)}%)`);
    }
    
    // Pénalité pour pelouse (trop uniforme)
    if (colorAnalysis.greenUniformity > this.MAX_UNIFORM_GREEN && colorAnalysis.lightGreenPercentage > 20) {
      colorScore -= 0.4;
      reasons.push(`Pelouse détectée (uniformité: ${(colorAnalysis.greenUniformity * 100).toFixed(1)}%)`);
    }
    
    // Pénalité pour trop de bleu (ciel/eau)
    if (colorAnalysis.bluePercentage > 25) {
      colorScore -= 0.3;
      reasons.push(`Trop de bleu détecté (${colorAnalysis.bluePercentage.toFixed(1)}%)`);
    }
    
    score += Math.max(0, colorScore) * 0.4;

    // 2. Analyse de texture (30% du score)
    let textureScore = 0;
    
    if (textureAnalysis.complexity > this.MIN_TEXTURE_COMPLEXITY) {
      textureScore += 0.3;
      reasons.push(`Texture complexe détectée (${(textureAnalysis.complexity * 100).toFixed(1)}%)`);
    }
    
    if (textureAnalysis.edgeStrength > 15) {
      textureScore += 0.2;
      reasons.push(`Contours organiques détectés`);
    }
    
    score += textureScore * 0.3;

    // 3. PlantNet (30% du score si disponible)
    if (plantnetResult && plantnetResult.source === 'plantnet') {
      if (plantnetResult.isPlant) {
        score += plantnetResult.confidence * 0.3;
        reasons.push(`PlantNet: plante identifiée (${(plantnetResult.confidence * 100).toFixed(1)}%)`);
      } else {
        score -= 0.2;
        reasons.push(`PlantNet: aucune plante identifiée`);
      }
    }

    // Normaliser le score
    score = Math.max(0, Math.min(1, score));
    
    const isValid = score >= this.MIN_AGRICULTURAL_CONFIDENCE;

    return {
      isValid,
      confidence: score,
      reasons: [`Score final: ${(score * 100).toFixed(1)}%`, ...reasons]
    };
  }

  /**
   * Générer une suggestion d'amélioration
   */
  private generateImprovedSuggestion(consensusResult: any): string {
    return '📷 Prenez une photo rapprochée de vos cultures\n' +
           '🌱 Assurez-vous que les feuilles des plantes sont visibles\n' +
           '🌿 Évitez les photos de pelouse ou gazon\n' +
           '☀️ Utilisez un bon éclairage naturel';
  }

  /**
   * Obtenir les statistiques du service
   */
  getStats(): any {
    return {
      plantnetAvailable: !!process.env.PLANTNET_API_KEY,
      minAgriculturalConfidence: this.MIN_AGRICULTURAL_CONFIDENCE,
      minGreenPercentage: this.MIN_GREEN_PERCENTAGE,
      maxUniformGreen: this.MAX_UNIFORM_GREEN,
      minTextureComplexity: this.MIN_TEXTURE_COMPLEXITY,
      version: '2.0.0'
    };
  }
}
