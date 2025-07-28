#!/usr/bin/env node

/**
 * 🎯 Test de Précision - Scénarios Multiples
 * Validation approfondie du système d'alertes prédictives
 */

const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

console.log('🎯 === TEST DE PRÉCISION - SCÉNARIOS MULTIPLES ===\n');

const OPENWEATHER_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const WEATHERAPI_KEY = process.env.WEATHERAPI_KEY;

/**
 * Scénarios de test avec données simulées
 */
const TEST_SCENARIOS = [
  {
    name: 'Conditions Idéales (Saison Sèche)',
    weather: { temperature: 22, humidity: 45, rainfall: 0, windSpeed: 12, pressure: 1020 },
    season: 'dry',
    history: { lastAttack: 90 },
    expectedRisk: 'LOW'
  },
  {
    name: 'Risque Modéré (Transition)',
    weather: { temperature: 26, humidity: 65, rainfall: 10, windSpeed: 8, pressure: 1015 },
    season: 'transition',
    history: { lastAttack: 60 },
    expectedRisk: 'MODERATE'
  },
  {
    name: 'Risque Élevé (Conditions Favorables)',
    weather: { temperature: 28, humidity: 75, rainfall: 30, windSpeed: 4, pressure: 1005 },
    season: 'rainy',
    history: { lastAttack: 45 },
    expectedRisk: 'HIGH'
  },
  {
    name: 'Risque Critique (Conditions Extrêmes)',
    weather: { temperature: 30, humidity: 85, rainfall: 60, windSpeed: 2, pressure: 995 },
    season: 'rainy',
    history: { lastAttack: 15 },
    expectedRisk: 'CRITICAL'
  },
  {
    name: 'Conditions Actuelles Réelles (Abidjan)',
    weather: { temperature: 24, humidity: 88, rainfall: 0, windSpeed: 3, pressure: 1013 },
    season: 'rainy',
    history: { lastAttack: 45 },
    expectedRisk: 'CRITICAL'
  }
];

/**
 * Calculer le risque de ravageurs
 */
function calculatePestRisk(weatherData, season, history) {
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

  return { riskScore, riskLevel, factors };
}

/**
 * Générer recommandations selon le niveau de risque
 */
function generateRecommendations(riskLevel, factors) {
  const recommendations = [];

  switch (riskLevel) {
    case 'CRITICAL':
      recommendations.push('🚨 URGENT: Inspectez vos cultures immédiatement');
      recommendations.push('🛡️ Appliquez un traitement préventif maintenant');
      recommendations.push('📞 Contactez un expert agricole local');
      break;

    case 'HIGH':
      recommendations.push('⚠️ Surveillez vos cultures de près');
      recommendations.push('🔍 Inspectez quotidiennement les feuilles');
      recommendations.push('🛡️ Préparez un traitement préventif');
      break;

    case 'MODERATE':
      recommendations.push('👀 Surveillez vos cultures régulièrement');
      recommendations.push('🌱 Renforcez la nutrition des plantes');
      if (factors.humidity > 0.3) {
        recommendations.push('💨 Améliorez la ventilation si possible');
      }
      break;

    case 'LOW':
      recommendations.push('✅ Continuez vos pratiques actuelles');
      recommendations.push('📅 Surveillance normale suffisante');
      break;
  }

  // Recommandations spécifiques selon les facteurs
  if (factors.rainfall > 0.15) {
    recommendations.push('☔ Attention aux maladies fongiques après la pluie');
  }
  if (factors.temperature > 0.25) {
    recommendations.push('🌡️ Assurez-vous d\'un arrosage suffisant');
  }

  return recommendations;
}

/**
 * Tester un scénario
 */
function testScenario(scenario) {
  console.log(`\n🧪 === TEST: ${scenario.name} ===`);
  
  // Afficher les conditions
  console.log('🌡️ Conditions météo:');
  console.log(`   Température: ${scenario.weather.temperature}°C`);
  console.log(`   Humidité: ${scenario.weather.humidity}%`);
  console.log(`   Précipitations: ${scenario.weather.rainfall}mm`);
  console.log(`   Vent: ${scenario.weather.windSpeed}m/s`);
  console.log(`   Pression: ${scenario.weather.pressure}hPa`);
  console.log(`🌿 Saison: ${scenario.season}`);
  console.log(`📅 Dernière attaque: ${scenario.history.lastAttack} jours`);

  // Calculer le risque
  const result = calculatePestRisk(scenario.weather, scenario.season, scenario.history);
  
  // Générer recommandations
  const recommendations = generateRecommendations(result.riskLevel, result.factors);

  // Vérifier la précision
  const isAccurate = result.riskLevel === scenario.expectedRisk;
  const accuracyIcon = isAccurate ? '✅' : '❌';

  console.log('\n📊 Résultats:');
  console.log(`🎯 Risque calculé: ${result.riskLevel}`);
  console.log(`📈 Score: ${(result.riskScore * 100).toFixed(1)}%`);
  console.log(`🎯 Risque attendu: ${scenario.expectedRisk}`);
  console.log(`${accuracyIcon} Précision: ${isAccurate ? 'CORRECTE' : 'INCORRECTE'}`);

  console.log('\n🔍 Détail des facteurs:');
  Object.entries(result.factors).forEach(([factor, value]) => {
    const percentage = (value * 100).toFixed(1);
    const icon = value > 0.2 ? '🔴' : value > 0.1 ? '🟡' : '🟢';
    console.log(`   ${icon} ${factor}: +${percentage}%`);
  });

  console.log('\n💡 Recommandations:');
  recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec}`);
  });

  return {
    scenario: scenario.name,
    calculated: result.riskLevel,
    expected: scenario.expectedRisk,
    accurate: isAccurate,
    score: result.riskScore,
    factors: result.factors
  };
}

/**
 * Test de validation avec données réelles
 */
async function testRealWeatherData() {
  console.log('\n🌍 === TEST AVEC DONNÉES RÉELLES ===');
  
  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'your_key_here') {
    console.log('⚠️ Clé OpenWeatherMap manquante, test ignoré');
    return null;
  }

  try {
    // Test avec Abidjan (conditions actuelles)
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat: 5.3600,
        lon: -4.0083,
        appid: OPENWEATHER_API_KEY,
        units: 'metric'
      }
    });

    const data = response.data;
    const realWeather = {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      rainfall: data.rain?.['1h'] || 0,
      windSpeed: data.wind.speed,
      pressure: data.main.pressure
    };

    console.log('📡 Données météo réelles (Abidjan):');
    console.log(`   Température: ${realWeather.temperature}°C`);
    console.log(`   Humidité: ${realWeather.humidity}%`);
    console.log(`   Précipitations: ${realWeather.rainfall}mm`);
    console.log(`   Vent: ${realWeather.windSpeed}m/s`);

    // Calculer le risque avec données réelles
    const realRisk = calculatePestRisk(realWeather, 'rainy', { lastAttack: 45 });
    
    console.log(`\n🎯 Risque avec données réelles: ${realRisk.riskLevel}`);
    console.log(`📈 Score: ${(realRisk.riskScore * 100).toFixed(1)}%`);

    return {
      weather: realWeather,
      risk: realRisk
    };

  } catch (error) {
    console.log(`❌ Erreur récupération données réelles: ${error.message}`);
    return null;
  }
}

/**
 * Analyser la sensibilité du modèle
 */
function analyzeSensitivity() {
  console.log('\n🔬 === ANALYSE DE SENSIBILITÉ ===');
  
  const baseWeather = { temperature: 25, humidity: 70, rainfall: 20, windSpeed: 5, pressure: 1013 };
  const baseSeason = 'rainy';
  const baseHistory = { lastAttack: 45 };
  
  const baseResult = calculatePestRisk(baseWeather, baseSeason, baseHistory);
  console.log(`📊 Risque de base: ${baseResult.riskLevel} (${(baseResult.riskScore * 100).toFixed(1)}%)`);

  // Test sensibilité température
  console.log('\n🌡️ Sensibilité à la température:');
  [20, 25, 30, 35].forEach(temp => {
    const testWeather = { ...baseWeather, temperature: temp };
    const result = calculatePestRisk(testWeather, baseSeason, baseHistory);
    const change = ((result.riskScore - baseResult.riskScore) * 100).toFixed(1);
    console.log(`   ${temp}°C: ${result.riskLevel} (${change > 0 ? '+' : ''}${change}%)`);
  });

  // Test sensibilité humidité
  console.log('\n💧 Sensibilité à l\'humidité:');
  [50, 70, 80, 90].forEach(humidity => {
    const testWeather = { ...baseWeather, humidity };
    const result = calculatePestRisk(testWeather, baseSeason, baseHistory);
    const change = ((result.riskScore - baseResult.riskScore) * 100).toFixed(1);
    console.log(`   ${humidity}%: ${result.riskLevel} (${change > 0 ? '+' : ''}${change}%)`);
  });

  // Test sensibilité historique
  console.log('\n📅 Sensibilité à l\'historique:');
  [15, 30, 60, 90].forEach(lastAttack => {
    const testHistory = { lastAttack };
    const result = calculatePestRisk(baseWeather, baseSeason, testHistory);
    const change = ((result.riskScore - baseResult.riskScore) * 100).toFixed(1);
    console.log(`   ${lastAttack} jours: ${result.riskLevel} (${change > 0 ? '+' : ''}${change}%)`);
  });
}

/**
 * Fonction principale
 */
async function main() {
  const results = [];

  // Tester tous les scénarios
  console.log('🧪 Test des scénarios prédéfinis...');
  for (const scenario of TEST_SCENARIOS) {
    const result = testScenario(scenario);
    results.push(result);
  }

  // Test avec données réelles
  const realDataResult = await testRealWeatherData();

  // Analyse de sensibilité
  analyzeSensitivity();

  // Statistiques finales
  console.log('\n🎯 === STATISTIQUES DE PRÉCISION ===');
  const accurateResults = results.filter(r => r.accurate);
  const accuracy = (accurateResults.length / results.length * 100).toFixed(1);
  
  console.log(`📊 Scénarios testés: ${results.length}`);
  console.log(`✅ Prédictions correctes: ${accurateResults.length}`);
  console.log(`🎯 Précision globale: ${accuracy}%`);

  console.log('\n📈 Distribution des risques calculés:');
  const riskDistribution = results.reduce((acc, r) => {
    acc[r.calculated] = (acc[r.calculated] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(riskDistribution).forEach(([level, count]) => {
    console.log(`   ${level}: ${count} scénarios`);
  });

  console.log('\n🔍 Analyse des erreurs:');
  const errors = results.filter(r => !r.accurate);
  if (errors.length === 0) {
    console.log('   ✅ Aucune erreur détectée !');
  } else {
    errors.forEach(error => {
      console.log(`   ❌ ${error.scenario}: ${error.calculated} au lieu de ${error.expected}`);
    });
  }

  console.log('\n✅ Test de précision terminé !');
  
  if (accuracy >= 80) {
    console.log('🎉 EXCELLENT: Précision supérieure à 80% !');
  } else if (accuracy >= 60) {
    console.log('👍 BON: Précision acceptable, quelques ajustements possibles');
  } else {
    console.log('⚠️ ATTENTION: Précision faible, révision du modèle recommandée');
  }
}

// Exécuter le test
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}
