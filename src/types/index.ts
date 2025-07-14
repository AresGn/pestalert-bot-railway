/**
 * Types pour l'intégration OpenEPI
 */

export interface Location {
  lat: number;
  lon: number;
}

export interface FarmerData {
  phone: string;
  location: Location;
  subscription?: 'basic' | 'premium';
}

export interface BinaryAnalysisResult {
  prediction: 'healthy' | 'diseased';
  confidence: number;
  timestamp: string;
  processing_time?: number;
  raw_score?: number; // Score HLT brut (0-1)
  image_quality?: 'poor' | 'fair' | 'good' | 'excellent';
  model_version?: string;
}

export interface MultiClassPrediction {
  disease: string;
  confidence: number;
  risk_level: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface MultiClassAnalysisResult {
  top_prediction: MultiClassPrediction;
  all_predictions: MultiClassPrediction[];
  timestamp: string;
  analysis_type: string;
  processing_time?: number;
  model_used?: 'single-HLT' | 'multi-HLT' | 'binary';
  image_quality?: 'poor' | 'fair' | 'good' | 'excellent';
  total_classes?: number;
}

export interface WeatherAnalysis {
  current_risk: number;
  forecast_risk: number;
  alert_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
}

export interface AlertDecision {
  critical: boolean;
  preventive: boolean;
  message: string;
  actions: string[];
}

export interface AlertDecisionWithConfidence extends AlertDecision {
  uncertain: boolean;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  binaryConfidence: number;
  topPredictionConfidence: number;
  reasoning: string;
}

export interface AnalysisResponse {
  analysis: {
    crop_health: {
      binaryResult: BinaryAnalysisResult;
      multiClassResult: MultiClassAnalysisResult;
    };
    weather: WeatherAnalysis;
    alert: AlertDecisionWithConfidence;
  };
  timestamp: string;
}

export interface ImageMetadata {
  location?: Location;
  crop_type?: string;
  filename?: string;
}

// Nouveaux types pour le système de confiance amélioré
export type ConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type AnalysisQuality = 'poor' | 'fair' | 'good' | 'excellent';

export interface ConfidenceInterval {
  level: ConfidenceLevel;
  min: number;
  max: number;
  description: string;
  audio_file: string;
  recommendations: string[];
}

export interface DetailedHealthAnalysis {
  binary: BinaryAnalysisResult;
  multiClass: MultiClassAnalysisResult;
  confidence_level: ConfidenceLevel;
  analysis_quality: AnalysisQuality;
  confidence_interval: ConfidenceInterval;
  detailed_metrics: {
    binary_confidence: number;
    top_disease_confidence: number;
    confidence_spread: number; // Écart entre top prédictions
    prediction_consistency: number; // Cohérence entre modèles
  };
  recommendations: {
    immediate: string[];
    short_term: string[];
    monitoring: string[];
  };
  risk_assessment: {
    level: 'minimal' | 'low' | 'moderate' | 'high' | 'critical';
    factors: string[];
    urgency: 'none' | 'low' | 'medium' | 'high' | 'immediate';
  };
}
