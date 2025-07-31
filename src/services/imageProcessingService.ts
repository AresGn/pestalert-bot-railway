import sharp from 'sharp';

/**
 * Service de prétraitement des images selon les spécifications OpenEPI
 * Inclut maintenant la validation d'images agricoles
 */
export class ImageProcessingService {
  
  /**
   * Prétraiter une image selon les spécifications OpenEPI
   * - Redimensionnement à 256x256
   * - Extraction du centre 224x224
   * - Conversion en JPEG avec qualité 85%
   */
  async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Redimensionnement et normalisation selon les specs OpenEPI
      const processedImage = await sharp(imageBuffer)
        .resize(256, 256, {
          fit: 'cover',
          position: 'center'
        })
        .extract({ left: 16, top: 16, width: 224, height: 224 })
        .jpeg({ quality: 85 })
        .toBuffer();

      return processedImage;
    } catch (error: any) {
      throw new Error(`Image preprocessing failed: ${error.message}`);
    }
  }

  /**
   * Valider le format et la taille de l'image
   */
  async validateImage(imageBuffer: Buffer): Promise<{ valid: boolean; error?: string; metadata?: any }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      // Vérifications de base
      if (!metadata.width || !metadata.height) {
        return { valid: false, error: 'Impossible de lire les dimensions de l\'image' };
      }

      if (metadata.width < 100 || metadata.height < 100) {
        return { valid: false, error: 'Image trop petite (minimum 100x100 pixels)' };
      }

      if (metadata.width > 4000 || metadata.height > 4000) {
        return { valid: false, error: 'Image trop grande (maximum 4000x4000 pixels)' };
      }

      // Vérifier le format
      const supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];
      if (!metadata.format || !supportedFormats.includes(metadata.format)) {
        return { valid: false, error: 'Format d\'image non supporté (JPEG, PNG, WebP uniquement)' };
      }

      return { 
        valid: true, 
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: metadata.size
        }
      };
    } catch (error: any) {
      return { valid: false, error: `Erreur lors de la validation: ${error.message}` };
    }
  }

  /**
   * Optimiser une image pour l'analyse
   * Combine validation et prétraitement
   */
  async optimizeForAnalysis(imageBuffer: Buffer): Promise<{ success: boolean; processedImage?: Buffer; error?: string; metadata?: any }> {
    try {
      // Validation
      const validation = await this.validateImage(imageBuffer);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Prétraitement
      const processedImage = await this.preprocessImage(imageBuffer);
      
      return { 
        success: true, 
        processedImage,
        metadata: validation.metadata
      };
    } catch (error: any) {
      return { success: false, error: `Optimisation échouée: ${error.message}` };
    }
  }

  /**
   * Créer une miniature pour l'affichage
   */
  async createThumbnail(imageBuffer: Buffer, size: number = 150): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (error: any) {
      throw new Error(`Thumbnail creation failed: ${error.message}`);
    }
  }

  /**
   * Extraire les métadonnées EXIF si disponibles
   */
  async extractMetadata(imageBuffer: Buffer): Promise<any> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space,
        channels: metadata.channels,
        depth: metadata.depth,
        density: metadata.density,
        hasProfile: metadata.hasProfile,
        hasAlpha: metadata.hasAlpha,
        exif: metadata.exif ? this.parseExifData(metadata.exif) : null
      };
    } catch (error: any) {
      throw new Error(`Metadata extraction failed: ${error.message}`);
    }
  }

  /**
   * Parser les données EXIF (basique)
   */
  private parseExifData(exifBuffer: Buffer): any {
    try {
      // Parsing basique des données EXIF
      // Pour une implémentation complète, utiliser une bibliothèque comme 'exif-parser'
      return {
        size: exifBuffer.length,
        available: true
      };
    } catch (error) {
      return { available: false };
    }
  }

  /**
   * Convertir une image en base64 pour l'affichage
   */
  async toBase64(imageBuffer: Buffer, format: 'jpeg' | 'png' = 'jpeg'): Promise<string> {
    try {
      let processedBuffer: Buffer;

      if (format === 'jpeg') {
        processedBuffer = await sharp(imageBuffer).jpeg({ quality: 85 }).toBuffer();
      } else {
        processedBuffer = await sharp(imageBuffer).png().toBuffer();
      }

      return `data:image/${format};base64,${processedBuffer.toString('base64')}`;
    } catch (error: any) {
      throw new Error(`Base64 conversion failed: ${error.message}`);
    }
  }

  /**
   * Analyser les caractéristiques visuelles de l'image pour détecter des éléments agricoles
   * Utilise des heuristiques basées sur les couleurs et la texture
   */
  async analyzeAgriculturalContent(imageBuffer: Buffer): Promise<{
    isLikelyAgricultural: boolean;
    confidence: number;
    reasons: string[];
    colorAnalysis: any;
  }> {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      // Redimensionner pour l'analyse (plus rapide)
      const analysisImage = await image
        .resize(256, 256, { fit: 'cover' })
        .raw()
        .toBuffer();

      // Analyser les couleurs dominantes
      const colorAnalysis = await this.analyzeColors(analysisImage, 256, 256, metadata.channels || 3);

      // Analyser la texture et les motifs
      const textureAnalysis = await this.analyzeTexture(imageBuffer);

      // Calculer la probabilité que ce soit une image agricole
      const agriculturalScore = this.calculateAgriculturalScore(colorAnalysis, textureAnalysis);

      return {
        isLikelyAgricultural: agriculturalScore.score > 0.6,
        confidence: agriculturalScore.score,
        reasons: agriculturalScore.reasons,
        colorAnalysis: colorAnalysis
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'analyse du contenu agricole:', error);
      // En cas d'erreur, on assume que c'est potentiellement agricole pour éviter les faux négatifs
      return {
        isLikelyAgricultural: true,
        confidence: 0.5,
        reasons: ['Analyse impossible - image acceptée par défaut'],
        colorAnalysis: null
      };
    }
  }

  /**
   * Analyser les couleurs dominantes dans l'image
   */
  private async analyzeColors(buffer: Buffer, width: number, height: number, channels: number): Promise<any> {
    const pixels = new Uint8Array(buffer);
    const colorCounts = new Map<string, number>();
    let greenPixels = 0;
    let brownPixels = 0;
    let totalPixels = 0;

    // Analyser chaque pixel
    for (let i = 0; i < pixels.length; i += channels) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      totalPixels++;

      // Détecter les verts (végétation)
      if (g > r && g > b && g > 80) {
        greenPixels++;
      }

      // Détecter les bruns (terre, troncs)
      if (r > 100 && g > 60 && b < 80 && Math.abs(r - g) < 50) {
        brownPixels++;
      }

      // Compter les couleurs dominantes
      const colorKey = `${Math.floor(r/32)}-${Math.floor(g/32)}-${Math.floor(b/32)}`;
      colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
    }

    const greenPercentage = (greenPixels / totalPixels) * 100;
    const brownPercentage = (brownPixels / totalPixels) * 100;

    return {
      greenPercentage,
      brownPercentage,
      totalPixels,
      dominantColors: Array.from(colorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    };
  }

  /**
   * Analyser la texture de l'image pour détecter des motifs organiques
   */
  private async analyzeTexture(imageBuffer: Buffer): Promise<any> {
    try {
      // Convertir en niveaux de gris pour l'analyse de texture
      const grayImage = await sharp(imageBuffer)
        .resize(128, 128)
        .greyscale()
        .raw()
        .toBuffer();

      // Calculer la variance (indicateur de texture)
      const pixels = new Uint8Array(grayImage);
      const mean = pixels.reduce((sum, pixel) => sum + pixel, 0) / pixels.length;
      const variance = pixels.reduce((sum, pixel) => sum + Math.pow(pixel - mean, 2), 0) / pixels.length;

      // Calculer les gradients (indicateur de contours/feuilles)
      let gradientSum = 0;
      for (let i = 1; i < pixels.length - 1; i++) {
        const gradient = Math.abs(pixels[i + 1] - pixels[i - 1]);
        gradientSum += gradient;
      }
      const averageGradient = gradientSum / (pixels.length - 2);

      return {
        variance,
        averageGradient,
        textureComplexity: variance / 255 // Normaliser entre 0 et 1
      };
    } catch (error) {
      return {
        variance: 0,
        averageGradient: 0,
        textureComplexity: 0
      };
    }
  }

  /**
   * Calculer le score de probabilité agricole basé sur les analyses
   */
  private calculateAgriculturalScore(colorAnalysis: any, textureAnalysis: any): {
    score: number;
    reasons: string[];
  } {
    let score = 0;
    const reasons: string[] = [];

    // Analyse des couleurs
    if (colorAnalysis) {
      // Bonus pour la végétation verte
      if (colorAnalysis.greenPercentage > 15) {
        score += 0.4;
        reasons.push(`Végétation verte détectée (${colorAnalysis.greenPercentage.toFixed(1)}%)`);
      } else if (colorAnalysis.greenPercentage > 5) {
        score += 0.2;
        reasons.push(`Peu de végétation verte (${colorAnalysis.greenPercentage.toFixed(1)}%)`);
      }

      // Bonus pour la terre/sol
      if (colorAnalysis.brownPercentage > 10) {
        score += 0.2;
        reasons.push(`Sol/terre détecté (${colorAnalysis.brownPercentage.toFixed(1)}%)`);
      }

      // Combinaison vert + brun = très probable
      if (colorAnalysis.greenPercentage > 10 && colorAnalysis.brownPercentage > 5) {
        score += 0.2;
        reasons.push('Combinaison végétation + sol détectée');
      }

      // NOUVEAU: Détection de gazon/pelouse (pénalité)
      if (this.isLikelyLawn(colorAnalysis, textureAnalysis)) {
        score -= 0.4;
        reasons.push('Gazon/pelouse détecté (non-agricole)');
      }
    }

    // Analyse de texture
    if (textureAnalysis) {
      // Texture complexe = feuilles, branches
      if (textureAnalysis.textureComplexity > 0.3) {
        score += 0.2;
        reasons.push('Texture organique complexe détectée');
      }
    }

    // Pénalités pour les images non-agricoles
    if (colorAnalysis && colorAnalysis.greenPercentage < 2 && colorAnalysis.brownPercentage < 2) {
      score -= 0.3;
      reasons.push('Absence de couleurs agricoles typiques');
    }

    // NOUVEAU: Pénalité pour végétation trop uniforme (caractéristique des pelouses)
    if (colorAnalysis && this.hasUniformGreenDistribution(colorAnalysis)) {
      score -= 0.3;
      reasons.push('Végétation trop uniforme (pelouse suspectée)');
    }

    // Normaliser le score entre 0 et 1
    score = Math.max(0, Math.min(1, score));

    return { score, reasons };
  }

  /**
   * Détecter si l'image ressemble à une pelouse/gazon
   */
  private isLikelyLawn(colorAnalysis: any, textureAnalysis: any): boolean {
    // Caractéristiques d'une pelouse :
    // - Beaucoup de vert (>30%) mais peu de brun (<15%)
    // - Texture relativement uniforme (faible complexité)
    // - Distribution uniforme des couleurs vertes

    const hasLawnColorProfile = colorAnalysis.greenPercentage > 30 &&
                               colorAnalysis.brownPercentage < 15;

    const hasUniformTexture = textureAnalysis && textureAnalysis.textureComplexity < 0.4;

    return hasLawnColorProfile && hasUniformTexture;
  }

  /**
   * Vérifier si la distribution du vert est trop uniforme (caractéristique des pelouses)
   */
  private hasUniformGreenDistribution(colorAnalysis: any): boolean {
    // Si on a beaucoup de vert (>35%) mais très peu de variation de couleurs dominantes,
    // c'est probablement une pelouse
    if (colorAnalysis.greenPercentage > 35 && colorAnalysis.dominantColors) {
      // Compter les couleurs dominantes avec du vert
      const greenDominantColors = colorAnalysis.dominantColors.filter((color: any) => {
        const [r, g, b] = color[0].split('-').map(Number);
        return g > r && g > b; // Couleurs à dominance verte
      });

      // Si moins de 3 couleurs vertes dominantes différentes, c'est suspect
      return greenDominantColors.length < 3;
    }

    return false;
  }
}
