#!/usr/bin/env node

/**
 * 🔮 Script de Test - Système d'Alertes Prédictives PestAlert
 * Test de précision avec approche "brutalement honnête"
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

console.log('🔮 === TEST SYSTÈME D\'ALERTES PRÉDICTIVES PESTALERT ===\n');

// Configuration des APIs
const OPENEPI_BASE_URL = process.env.OPENEPI_BASE_URL || 'https://api.openepi.io';
const OPENWEATHER_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const WEATHERAPI_KEY = process.env.WEATHERAPI_KEY;

// Positions de test (Afrique de l'Ouest)
const TEST_LOCATIONS = [
  { name: 'Abidjan, Côte d\'Ivoire', lat: 5.3600, lon: -4.0083 },
  { name: 'Bamako, Mali', lat: 12.6392, lon: -8.0029 },
  { name: 'Lomé, Togo', lat: 6.1375, lon: 1.2123 },
  { name: 'Cotonou, Bénin', lat: 6.3703, lon: 2.3912 },
  { name: 'Ouagadougou, Burkina Faso', lat: 12.3714, lon: -1.5197 }
];

/**
 * COUCHE 1: Tester OpenEPI Weather API
 */
async function testOpenEPIWeather(lat, lon) {
  console.log('🎭 COUCHE 1: Test OpenEPI Weather API...');
  
  try {
    const response = await axios.get(`${OPENEPI_BASE_URL}/weather/current`, {
      params: { lat, lon },
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'PestAlert-Test/1.0'
      }
    });

    if (response.data && response.data.success) {
      const data = response.data.data;
      const weatherData = {
        temperature: data.temperature || 25,
        humidity: data.humidity || 60,
        rainfall: data.rainfall || 0,
        windSpeed: data.windSpeed || 5,
        pressure: data.pressure || 1013,
        source: 'OpenEPI'
      };
      
      console.log('✅ OpenEPI: Données récupérées');
      console.log(`   Temp: ${weatherData.temperature}°C, Humidité: ${weatherData.humidity}%`);
      return { success: true, data: weatherData, suspicious: isWeatherSuspicious(weatherData) };
    } else {
      console.log('⚠️ OpenEPI: Réponse invalide');
      return { success: false, error: 'Invalid response' };
    }
  } catch (error) {
    console.log(`❌ OpenEPI: Erreur - ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * COUCHE 2: Tester APIs de validation
 */
async function testValidationAPIs(lat, lon) {
  console.log('🔍 COUCHE 2: Test APIs de validation...');
  
  const validationResults = [];

  // Test OpenWeatherMap
  if (OPENWEATHER_API_KEY && OPENWEATHER_API_KEY !== 'your_key_here') {
    try {
      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          lat,
          lon,
          appid: OPENWEATHER_API_KEY,
          units: 'metric'
        },
        timeout: 15000
      });

      if (response.data) {
        const data = response.data;
        const weatherData = {
          temperature: data.main.temp,
          humidity: data.main.humidity,
          rainfall: data.rain?.['1h'] || 0,
          windSpeed: data.wind.speed,
          pressure: data.main.pressure,
          source: 'OpenWeatherMap'
        };
        
        validationResults.push(weatherData);
        console.log('✅ OpenWeatherMap: Données récupérées');
        console.log(`   Temp: ${weatherData.temperature}°C, Humidité: ${weatherData.humidity}%`);
      }
    } catch (error) {
      console.log(`❌ OpenWeatherMap: ${error.message}`);
    }
  } else {
    console.log('⚠️ OpenWeatherMap: Clé API manquante ou invalide');
  }

  // Test WeatherAPI.com
  if (WEATHERAPI_KEY && WEATHERAPI_KEY !== 'your_key_here') {
    try {
      const response = await axios.get('https://api.weatherapi.com/v1/current.json', {
        params: {
          key: WEATHERAPI_KEY,
          q: `${lat},${lon}`
        },
        timeout: 15000
      });

      if (response.data && response.data.current) {
        const data = response.data.current;
        const weatherData = {
          temperature: data.temp_c,
          humidity: data.humidity,
          rainfall: data.precip_mm,
          windSpeed: data.wind_kph / 3.6, // Convertir km/h en m/s
          pressure: data.pressure_mb,
          source: 'WeatherAPI.com'
        };
        
        validationResults.push(weatherData);
        console.log('✅ WeatherAPI.com: Données récupérées');
        console.log(`   Temp: ${weatherData.temperature}°C, Humidité: ${weatherData.humidity}%`);
      }
    } catch (error) {
      console.log(`❌ WeatherAPI.com: ${error.message}`);
    }
  } else {
    console.log('⚠️ WeatherAPI.com: Clé API manquante ou invalide');
  }

  return validationResults;
}

/**
 * Vérifier si les données météo sont suspectes
 */
function isWeatherSuspicious(weatherData) {
  return (
    weatherData.temperature < -10 || weatherData.temperature > 60 ||
    weatherData.humidity < 0 || weatherData.humidity > 100 ||
    weatherData.rainfall < 0 || weatherData.rainfall > 500 ||
    weatherData.windSpeed < 0 || weatherData.windSpeed > 200
  );
}

/**
 * COUCHE 3: Calculer consensus intelligent
 */
function calculateWeatherConsensus(openEPIData, validationData) {
  console.log('🧠 COUCHE 3: Calcul du consensus intelligent...');

  if (!openEPIData.success && validationData.length === 0) {
    console.log('❌ Aucune donnée disponible, utilisation fallback');
    return {
      consensusData: getFallbackWeatherData(),
      confidence: 0.2,
      source: 'Fallback_Mode'
    };
  }

  // Si OpenEPI fonctionne et n'est pas suspect
  if (openEPIData.success && !openEPIData.suspicious && validationData.length === 0) {
    console.log('✅ OpenEPI fiable, pas de validation nécessaire');
    return {
      consensusData: openEPIData.data,
      confidence: 0.8,
      source: 'OpenEPI_Only'
    };
  }

  // Calculer consensus avec pondération
  const allData = [];
  const weights = [];

  if (openEPIData.success) {
    allData.push(openEPIData.data);
    weights.push(0.4); // OpenEPI a 40% de poids
  }

  validationData.forEach(data => {
    allData.push(data);
    weights.push(0.6 / validationData.length); // Validation se partage 60%
  });

  if (allData.length === 0) {
    return {
      consensusData: getFallbackWeatherData(),
      confidence: 0.2,
      source: 'Fallback_Mode'
    };
  }

  // Calculer moyennes pondérées
  const consensusData = {
    temperature: calculateWeightedAverage(allData.map(d => d.temperature), weights),
    humidity: calculateWeightedAverage(allData.map(d => d.humidity), weights),
    rainfall: calculateWeightedAverage(allData.map(d => d.rainfall), weights),
    windSpeed: calculateWeightedAverage(allData.map(d => d.windSpeed), weights),
    pressure: calculateWeightedAverage(allData.map(d => d.pressure), weights),
    source: 'Consensus'
  };

  const confidence = Math.min(0.95, 0.6 + (validationData.length * 0.15));
  
  console.log(`✅ Consensus calculé (${allData.length} sources)`);
  console.log(`📊 Confiance: ${(confidence * 100).toFixed(1)}%`);

  return {
    consensusData,
    confidence,
    source: 'Hybrid_Validated'
  };
}

/**
 * Calculer moyenne pondérée
 */
function calculateWeightedAverage(values, weights) {
  const sum = values.reduce((acc, val, i) => acc + (val * weights[i]), 0);
  const weightSum = weights.reduce((acc, w) => acc + w, 0);
  return sum / weightSum;
}

/**
 * Données météo de fallback
 */
function getFallbackWeatherData() {
  return {
    temperature: 27,
    humidity: 65,
    rainfall: 5,
    windSpeed: 8,
    pressure: 1013,
    source: 'Fallback'
  };
}

/**
 * Calculer le risque de ravageurs (votre modèle)
 */
function calculatePestRisk(weatherData, season, history) {
  console.log('🧮 Calcul du risque de ravageurs...');
  
  const factors = {
    temperature: weatherData.temperature > 25 ? 0.3 : 0.1,
    humidity: weatherData.humidity > 70 ? 0.4 : 0.2,
    rainfall: weatherData.rainfall > 50 ? 0.2 : 0.1,
    season: season === 'rainy' ? 0.3 : 0.1,
    history: history.lastAttack < 30 ? 0.4 : 0.1,
    windSpeed: weatherData.windSpeed < 5 ? 0.2 : 0.1,
    pressure: weatherData.pressure < 1000 ? 0.1 : 0.05
  };

  const riskScore = Object.values(factors).reduce((sum, factor) => sum + factor, 0);
  
  let riskLevel;
  if (riskScore >= 0.85) riskLevel = 'CRITICAL';
  else if (riskScore >= 0.7) riskLevel = 'HIGH';
  else if (riskScore >= 0.4) riskLevel = 'MODERATE';
  else riskLevel = 'LOW';

  console.log(`🎯 Risque calculé: ${riskLevel} (Score: ${riskScore.toFixed(2)})`);
  console.log('📊 Facteurs:', factors);

  return { riskScore, riskLevel, factors };
}

/**
 * Déterminer la saison actuelle
 */
function getCurrentSeason(lat) {
  const now = new Date();
  const month = now.getMonth() + 1;

  if (lat > 0) { // Hémisphère Nord (Afrique de l'Ouest)
    if (month >= 6 && month <= 9) return 'rainy';
    else if (month >= 10 && month <= 2) return 'dry';
    else return 'transition';
  }
  return 'dry';
}

/**
 * Test complet pour une localisation
 */
async function testLocation(location) {
  console.log(`\n🌍 === TEST: ${location.name} ===`);
  console.log(`📍 Coordonnées: ${location.lat}, ${location.lon}`);

  // COUCHE 1: OpenEPI
  const openEPIResult = await testOpenEPIWeather(location.lat, location.lon);
  
  // COUCHE 2: Validation
  const validationResults = await testValidationAPIs(location.lat, location.lon);
  
  // COUCHE 3: Consensus
  const consensus = calculateWeatherConsensus(openEPIResult, validationResults);
  
  // Calcul du risque
  const season = getCurrentSeason(location.lat);
  const history = { lastAttack: 45 }; // Simulation: dernière attaque il y a 45 jours
  const riskResult = calculatePestRisk(consensus.consensusData, season, history);

  // Résumé
  console.log('\n📊 === RÉSUMÉ ===');
  console.log(`🌡️ Température finale: ${consensus.consensusData.temperature.toFixed(1)}°C`);
  console.log(`💧 Humidité finale: ${consensus.consensusData.humidity.toFixed(1)}%`);
  console.log(`🌧️ Précipitations: ${consensus.consensusData.rainfall.toFixed(1)}mm`);
  console.log(`📊 Source: ${consensus.source}`);
  console.log(`🎯 Confiance: ${(consensus.confidence * 100).toFixed(1)}%`);
  console.log(`🚨 Niveau de risque: ${riskResult.riskLevel}`);
  console.log(`📈 Score de risque: ${(riskResult.riskScore * 100).toFixed(1)}%`);

  return {
    location: location.name,
    weather: consensus.consensusData,
    confidence: consensus.confidence,
    source: consensus.source,
    risk: riskResult,
    openEPIWorked: openEPIResult.success,
    validationCount: validationResults.length
  };
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔧 Configuration:');
  console.log(`   OpenEPI URL: ${OPENEPI_BASE_URL}`);
  console.log(`   OpenWeatherMap: ${OPENWEATHER_API_KEY ? '✅ Configuré' : '❌ Manquant'}`);
  console.log(`   WeatherAPI: ${WEATHERAPI_KEY ? '✅ Configuré' : '❌ Manquant'}`);
  console.log('');

  const results = [];

  // Tester toutes les localisations
  for (const location of TEST_LOCATIONS) {
    try {
      const result = await testLocation(location);
      results.push(result);
      
      // Pause entre les tests pour éviter les limites de taux
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(`❌ Erreur pour ${location.name}: ${error.message}`);
    }
  }

  // Statistiques finales
  console.log('\n🎯 === STATISTIQUES FINALES ===');
  console.log(`📊 Localisations testées: ${results.length}`);
  console.log(`✅ OpenEPI réussi: ${results.filter(r => r.openEPIWorked).length}`);
  console.log(`🔍 Validation moyenne: ${(results.reduce((sum, r) => sum + r.validationCount, 0) / results.length).toFixed(1)} sources`);
  console.log(`📈 Confiance moyenne: ${(results.reduce((sum, r) => sum + r.confidence, 0) / results.length * 100).toFixed(1)}%`);
  
  const riskDistribution = results.reduce((acc, r) => {
    acc[r.risk.riskLevel] = (acc[r.risk.riskLevel] || 0) + 1;
    return acc;
  }, {});
  
  console.log('🚨 Distribution des risques:');
  Object.entries(riskDistribution).forEach(([level, count]) => {
    console.log(`   ${level}: ${count} locations`);
  });

  console.log('\n✅ Test terminé avec succès !');
}

// Exécuter le test
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}
