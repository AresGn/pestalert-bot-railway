import FormData from 'form-data';
import fs from 'node:fs';
import path from 'path';
import sharp from 'sharp';
import axios from 'axios';

// Charger les variables d'environnement
require('dotenv').config();

/**
 * Service de validation basé sur PlantNet API (approche recommandée)
 * Implémente la stratégie du fichier free-apis-implementation.js
 * Focus sur PlantNet comme API principale avec fallback intelligent
 */

export interface PlantNetValidationResult {
  isValid: boolean;
  confidence: number;
  reasons: string[];
  suggestion?: string;
  errorType?: 'NOT_AGRICULTURAL' | 'POOR_QUALITY' | 'TECHNICAL_ERROR' | 'API_LIMIT';
  sources: {
    plantnet?: any;
    fallback?: any;
    metadata?: any;
  };
  species?: {
    scientific: string;
    common: string;
    family: string;
  };
  agricultural: {
    isCrop: boolean;
    category: string;
    confidence: number;
    matchedSpecies?: string;
    plantNetConfidence?: number;
  };
}

export class PlantNetValidationService {
  
  // Configuration PlantNet API
  private readonly PLANTNET_CONFIG = {
    baseURL: 'https://my-api.plantnet.org/v2/identify',
    project: 'all', // Changé de 'weurope' à 'all' pour inclure cultures tropicales
    dailyLimit: 500,
    apiKey: process.env.PLANTNET_API_KEY
  };

  // Seuils améliorés basés sur les tests et recommandations
  private readonly THRESHOLDS = {
    MIN_PLANTNET_CONFIDENCE: 0.6,  // Seuil PlantNet pour accepter
    MIN_AGRICULTURAL_CONFIDENCE: 0.7, // Seuil final pour validation
    MIN_SPECIES_MATCH: 0.8, // Seuil pour correspondance espèce agricole
    FALLBACK_CONFIDENCE: 0.4 // Seuil pour fallback local
  };

  // Cultures agricoles supportées (basé sur OpenEPI + cultures tropicales)
  private readonly AGRICULTURAL_SPECIES = [
    // Cultures principales OpenEPI
    'zea mays',           // Maïs
    'manihot esculenta',  // Manioc
    'phaseolus vulgaris', // Haricots
    'theobroma cacao',    // Cacao
    'musa',               // Banane

    // Variantes et synonymes
    'zea',                // Maïs (genre)
    'manihot',            // Manioc (genre)
    'phaseolus',          // Haricots (genre)
    'theobroma',          // Cacao (genre)
    'musa acuminata',     // Banane (espèce)
    'musa paradisiaca',   // Plantain

    // Autres cultures importantes
    'sorghum bicolor',    // Sorgho
    'pennisetum glaucum', // Mil
    'vigna unguiculata',  // Niébé
    'oryza sativa',       // Riz
    'arachis hypogaea',   // Arachide
    'ipomoea batatas',    // Patate douce
    'dioscorea',          // Igname

    // Cultures tropicales additionnelles
    'coffea',             // Café
    'saccharum officinarum', // Canne à sucre
    'cocos nucifera',     // Cocotier
    'elaeis guineensis'   // Palmier à huile
  ];

  // Compteur d'usage pour éviter dépassement
  private usage = {
    today: 0,
    limit: 500,
    lastReset: new Date().toDateString()
  };

  constructor() {
    this.resetDailyUsageIfNeeded();
  }

  /**
   * Méthode principale de validation avec PlantNet
   */
  async validateAgriculturalImage(imageBuffer: Buffer): Promise<PlantNetValidationResult> {
    try {
      console.log('🌱 Début validation PlantNet...');

      // 1. Validation technique de base
      const basicValidation = await this.validateImageQuality(imageBuffer);
      if (!basicValidation.isValid) {
        return this.createErrorResult('POOR_QUALITY', basicValidation.reason || 'Image invalide');
      }

      // 2. Vérifier les limites d'usage
      if (!this.canUsePlantNet()) {
        console.log('⚠️ Limite PlantNet atteinte, utilisation du fallback');
        return await this.fallbackValidation(imageBuffer);
      }

      // 3. Appel PlantNet API
      const plantNetResult = await this.callPlantNetAPI(imageBuffer);
      
      if (plantNetResult.success) {
        console.log(`✅ PlantNet réussi: ${plantNetResult.species} (${(plantNetResult.confidence * 100).toFixed(1)}%)`);
        
        // 4. Analyser si c'est une culture agricole
        const agriculturalAnalysis = this.analyzeAgriculturalSpecies(plantNetResult);
        
        // 5. Décision finale
        const finalResult = this.makeFinalDecision(plantNetResult, agriculturalAnalysis);
        
        return {
          isValid: finalResult.isValid,
          confidence: finalResult.confidence,
          reasons: finalResult.reasons,
          suggestion: finalResult.isValid ? undefined : this.generateSuggestion(finalResult),
          errorType: finalResult.isValid ? undefined : 'NOT_AGRICULTURAL',
          sources: {
            plantnet: plantNetResult,
            metadata: {
              usage: this.usage,
              thresholds: this.THRESHOLDS
            }
          },
          species: plantNetResult.species ? {
            scientific: plantNetResult.species,
            common: plantNetResult.commonName || 'Non spécifié',
            family: plantNetResult.family || 'Non spécifié'
          } : undefined,
          agricultural: agriculturalAnalysis
        };
      } else {
        console.log('❌ PlantNet échoué, utilisation du fallback');
        return await this.fallbackValidation(imageBuffer);
      }

    } catch (error: any) {
      console.error('❌ Erreur validation PlantNet:', error);
      return this.createErrorResult('TECHNICAL_ERROR', error.message);
    }
  }

  /**
   * Appel à l'API PlantNet (selon documentation officielle)
   */
  private async callPlantNetAPI(imageBuffer: Buffer): Promise<any> {
    if (!this.PLANTNET_CONFIG.apiKey) {
      return { success: false, reason: 'Clé API PlantNet manquante' };
    }

    try {
      // Sauvegarder temporairement l'image pour FormData (compatible Windows)
      const os = require('os');
      const tempDir = os.tmpdir();
      const tempPath = path.join(tempDir, `temp_image_${Date.now()}.jpg`);
      await sharp(imageBuffer).jpeg().toFile(tempPath);

      // Créer FormData selon la documentation officielle PlantNet
      const form = new FormData();

      // Ajouter l'organe AVANT l'image (ordre important selon doc)
      form.append('organs', 'leaf');

      // Ajouter l'image (paramètre requis) - utiliser 'images' au pluriel
      form.append('images', fs.createReadStream(tempPath), {
        filename: 'image.jpg',
        contentType: 'image/jpeg'
      });

      // URL selon la documentation : /v2/identify/{project}?api-key=YOUR_API_KEY
      const url = `https://my-api.plantnet.org/v2/identify/${this.PLANTNET_CONFIG.project}?api-key=${this.PLANTNET_CONFIG.apiKey}`;

      console.log(`🌱 Appel PlantNet: ${url.replace(this.PLANTNET_CONFIG.apiKey, 'API_KEY_HIDDEN')}`);

      // Utiliser axios avec FormData (plus compatible que fetch pour multipart)
      const response = await axios.post(url, form, {
        headers: {
          ...form.getHeaders()
        },
        timeout: 15000
      });

      console.log(`📊 PlantNet status: ${response.status}`);

      // Nettoyer le fichier temporaire
      try {
        fs.unlinkSync(tempPath);
      } catch (e) {
        // Ignorer les erreurs de nettoyage
      }

      this.usage.today++;

      const json = response.data;
      console.log(`📋 PlantNet résultats: ${json.results?.length || 0} espèces trouvées`);

      if (json.results && json.results.length > 0) {
        const bestMatch = json.results[0];

        console.log(`🔬 Meilleure correspondance: ${bestMatch.species.scientificNameWithoutAuthor} (${(bestMatch.score * 100).toFixed(1)}%)`);

        return {
          success: true,
          species: bestMatch.species.scientificNameWithoutAuthor,
          commonName: bestMatch.species.commonNames?.[0] || 'Non spécifié',
          family: bestMatch.species.family?.scientificNameWithoutAuthor,
          confidence: bestMatch.score,
          source: 'PlantNet',
          raw: bestMatch,
          allResults: json.results.slice(0, 5) // Top 5 pour analyse
        };
      }

      return { success: false, reason: 'Aucun résultat PlantNet' };

    } catch (error: any) {
      // Vérifier si c'est une réponse 404 "Species not found" (réponse normale de PlantNet)
      if (error.response?.status === 404 &&
          error.response?.data?.message === 'Species not found') {
        console.log('📋 PlantNet: Aucune espèce trouvée (réponse normale)');

        // Nettoyer le fichier temporaire
        try {
          const os = require('os');
          const tempDir = os.tmpdir();
          const tempPath = path.join(tempDir, `temp_image_${Date.now()}.jpg`);
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        } catch (e) {
          // Ignorer
        }

        return { success: false, reason: 'Aucune espèce identifiée par PlantNet' };
      }

      console.error('❌ Erreur appel PlantNet:', error.response?.data || error.message);

      // Nettoyer le fichier temporaire en cas d'erreur
      try {
        const os = require('os');
        const tempDir = os.tmpdir();
        const tempPath = path.join(tempDir, `temp_image_${Date.now()}.jpg`);
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (e) {
        // Ignorer
      }

      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Analyser si l'espèce identifiée est agricole
   */
  private analyzeAgriculturalSpecies(plantNetResult: any): any {
    const scientificName = plantNetResult.species?.toLowerCase() || '';
    const commonName = plantNetResult.commonName?.toLowerCase() || '';

    // Vérifier correspondance avec espèces agricoles connues
    let isAgriculturalSpecies = false;
    let matchedSpecies = '';
    let speciesConfidence = 0;

    for (const species of this.AGRICULTURAL_SPECIES) {
      if (scientificName.includes(species.toLowerCase())) {
        isAgriculturalSpecies = true;
        matchedSpecies = species;
        speciesConfidence = plantNetResult.confidence || 0;
        break;
      }
    }

    // Vérifier aussi dans le nom commun
    const agriculturalCommonNames = [
      'maïs', 'corn', 'manioc', 'cassava', 'haricot', 'bean',
      'cacao', 'cocoa', 'banane', 'banana', 'sorgho', 'sorghum'
    ];

    if (!isAgriculturalSpecies) {
      for (const commonAgri of agriculturalCommonNames) {
        if (commonName.includes(commonAgri)) {
          isAgriculturalSpecies = true;
          matchedSpecies = commonAgri;
          speciesConfidence = (plantNetResult.confidence || 0) * 0.8; // Légèrement moins fiable
          break;
        }
      }
    }

    // NOUVEAU: Vérifier dans tous les résultats PlantNet pour Theobroma
    if (!isAgriculturalSpecies && plantNetResult.allResults) {
      for (const result of plantNetResult.allResults) {
        const resultSpecies = result.species?.scientificNameWithoutAuthor?.toLowerCase() || '';
        if (resultSpecies.includes('theobroma cacao')) {
          isAgriculturalSpecies = true;
          matchedSpecies = 'theobroma cacao';
          speciesConfidence = result.score;
          console.log(`🍫 Theobroma cacao trouvé dans les résultats (${(result.score * 100).toFixed(1)}%)`);
          break;
        }
      }
    }

    return {
      isCrop: isAgriculturalSpecies,
      category: isAgriculturalSpecies ? 'Culture agricole' : 'Plante sauvage/ornementale',
      confidence: speciesConfidence,
      matchedSpecies: matchedSpecies,
      plantNetConfidence: plantNetResult.confidence || 0
    };
  }

  /**
   * Prendre la décision finale de validation
   */
  private makeFinalDecision(plantNetResult: any, agriculturalAnalysis: any): any {
    const reasons: string[] = [];
    let finalConfidence = 0;
    let isValid = false;

    // 1. Vérifier confiance PlantNet
    if (plantNetResult.confidence >= this.THRESHOLDS.MIN_PLANTNET_CONFIDENCE) {
      reasons.push(`PlantNet confiance élevée (${(plantNetResult.confidence * 100).toFixed(1)}%)`);
      finalConfidence += 0.4;
    } else {
      reasons.push(`PlantNet confiance faible (${(plantNetResult.confidence * 100).toFixed(1)}%)`);
    }

    // 2. Vérifier si c'est agricole
    if (agriculturalAnalysis.isCrop) {
      reasons.push(`Espèce agricole identifiée: ${agriculturalAnalysis.matchedSpecies}`);
      finalConfidence += 0.5;
      
      // Bonus si correspondance exacte avec espèce agricole
      if (agriculturalAnalysis.confidence >= this.THRESHOLDS.MIN_SPECIES_MATCH) {
        reasons.push(`Correspondance espèce exacte`);
        finalConfidence += 0.1;
      }
    } else {
      reasons.push(`Espèce non-agricole: ${agriculturalAnalysis.category}`);
      finalConfidence -= 0.3;
    }

    // 3. Décision finale avec bonus pour Theobroma cacao
    let threshold = this.THRESHOLDS.MIN_AGRICULTURAL_CONFIDENCE;

    // Bonus spécial pour Theobroma cacao (culture importante mais difficile à identifier)
    if (agriculturalAnalysis.matchedSpecies === 'theobroma cacao') {
      threshold = 0.5; // Seuil réduit pour le cacao
      reasons.push('Seuil réduit pour Theobroma cacao (culture tropicale)');
    }

    isValid = finalConfidence >= threshold && agriculturalAnalysis.isCrop;
    
    if (!isValid) {
      reasons.push(`Score final insuffisant (${(finalConfidence * 100).toFixed(1)}% < ${(this.THRESHOLDS.MIN_AGRICULTURAL_CONFIDENCE * 100).toFixed(1)}%)`);
    }

    return {
      isValid,
      confidence: Math.max(0, Math.min(1, finalConfidence)),
      reasons: [`Décision: ${isValid ? 'VALIDE' : 'REJETÉ'}`, ...reasons]
    };
  }

  /**
   * Validation fallback si PlantNet n'est pas disponible
   */
  private async fallbackValidation(imageBuffer: Buffer): Promise<PlantNetValidationResult> {
    // Utiliser l'analyse basique des couleurs comme fallback
    try {
      const colorAnalysis = await this.basicColorAnalysis(imageBuffer);
      
      const isLikelyPlant = colorAnalysis.greenPercentage > 15 && colorAnalysis.brownPercentage > 5;
      const confidence = isLikelyPlant ? this.THRESHOLDS.FALLBACK_CONFIDENCE : 0.2;

      return {
        isValid: isLikelyPlant && confidence >= this.THRESHOLDS.FALLBACK_CONFIDENCE,
        confidence: confidence,
        reasons: [
          'Fallback: PlantNet indisponible',
          `Analyse couleurs: ${colorAnalysis.greenPercentage.toFixed(1)}% vert, ${colorAnalysis.brownPercentage.toFixed(1)}% brun`,
          isLikelyPlant ? 'Végétation détectée' : 'Peu de végétation'
        ],
        suggestion: 'Réessayez plus tard quand PlantNet sera disponible',
        errorType: 'API_LIMIT',
        sources: {
          fallback: colorAnalysis,
          metadata: { reason: 'PlantNet limit reached' }
        },
        agricultural: {
          isCrop: false, // Conservateur en fallback
          category: 'Analyse limitée',
          confidence: confidence
        }
      };
    } catch (error: any) {
      return this.createErrorResult('TECHNICAL_ERROR', `Fallback échoué: ${error.message}`);
    }
  }

  /**
   * Analyse basique des couleurs pour fallback
   */
  private async basicColorAnalysis(imageBuffer: Buffer): Promise<any> {
    const image = await sharp(imageBuffer)
      .resize(128, 128)
      .raw()
      .toBuffer();

    const pixels = new Uint8Array(image);
    let greenPixels = 0;
    let brownPixels = 0;
    const totalPixels = pixels.length / 3;

    for (let i = 0; i < pixels.length; i += 3) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      if (g > r && g > b && g > 80) greenPixels++;
      if (r > 100 && g > 60 && b < 80) brownPixels++;
    }

    return {
      greenPercentage: (greenPixels / totalPixels) * 100,
      brownPercentage: (brownPixels / totalPixels) * 100,
      totalPixels
    };
  }

  /**
   * Validation qualité image
   */
  private async validateImageQuality(imageBuffer: Buffer): Promise<{ isValid: boolean; reason?: string }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        return { isValid: false, reason: 'Dimensions illisibles' };
      }

      if (metadata.width < 100 || metadata.height < 100) {
        return { isValid: false, reason: 'Image trop petite' };
      }

      if (imageBuffer.length > 10 * 1024 * 1024) { // 10MB
        return { isValid: false, reason: 'Image trop volumineuse' };
      }

      return { isValid: true };
    } catch (error: any) {
      return { isValid: false, reason: `Erreur validation: ${error.message}` };
    }
  }

  /**
   * Vérifier si on peut utiliser PlantNet
   */
  private canUsePlantNet(): boolean {
    this.resetDailyUsageIfNeeded();
    return this.usage.today < this.usage.limit && !!this.PLANTNET_CONFIG.apiKey;
  }

  /**
   * Reset compteur quotidien si nécessaire
   */
  private resetDailyUsageIfNeeded(): void {
    const today = new Date().toDateString();
    if (this.usage.lastReset !== today) {
      this.usage.today = 0;
      this.usage.lastReset = today;
    }
  }

  /**
   * Créer un résultat d'erreur
   */
  private createErrorResult(errorType: string, message: string): PlantNetValidationResult {
    return {
      isValid: false,
      confidence: 0,
      reasons: [message],
      suggestion: this.generateErrorSuggestion(errorType),
      errorType: errorType as any,
      sources: {},
      agricultural: {
        isCrop: false,
        category: 'Erreur',
        confidence: 0
      }
    };
  }

  /**
   * Générer suggestion selon le contexte
   */
  private generateSuggestion(result: any): string {
    return '📷 Prenez une photo claire de vos cultures\n' +
           '🌱 Assurez-vous que la plante est bien visible\n' +
           '☀️ Utilisez un bon éclairage naturel\n' +
           '🌾 Concentrez-vous sur les cultures agricoles';
  }

  /**
   * Générer suggestion d'erreur
   */
  private generateErrorSuggestion(errorType: string): string {
    switch (errorType) {
      case 'API_LIMIT':
        return 'Limite API atteinte. Réessayez dans quelques heures.';
      case 'POOR_QUALITY':
        return 'Améliorez la qualité de votre image.';
      default:
        return 'Réessayez avec une autre image.';
    }
  }

  /**
   * Obtenir statistiques d'usage
   */
  getUsageStats(): any {
    this.resetDailyUsageIfNeeded();
    return {
      plantnet: {
        used: this.usage.today,
        remaining: this.usage.limit - this.usage.today,
        percentage: (this.usage.today / this.usage.limit) * 100,
        resetTime: this.usage.lastReset
      },
      thresholds: this.THRESHOLDS,
      supportedSpecies: this.AGRICULTURAL_SPECIES.length,
      version: '3.0.0'
    };
  }
}
