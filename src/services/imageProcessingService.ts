import sharp from 'sharp';

/**
 * Service de prétraitement des images selon les spécifications OpenEPI
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
}
