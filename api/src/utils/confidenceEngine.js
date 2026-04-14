const config = require('../config');

function calculateConfidence(visionResult, details) {
  let score = 0;
  const factors = [];

  const photoQuality = visionResult?.confidence_modifiers?.photo_quality || 'none';
  const qualityScores = { high: 25, medium: 15, low: 5, none: 0 };
  const photoScore = qualityScores[photoQuality] || 0;
  score += photoScore;
  factors.push({ name: 'Photo quality', score: photoScore, maxScore: 25, level: photoQuality });

  const vehicleIdentifiable = visionResult?.confidence_modifiers?.vehicle_identifiable || false;
  const vehicleScore = vehicleIdentifiable ? 20 : 0;
  score += vehicleScore;
  factors.push({ name: 'Vehicle identifiable', score: vehicleScore, maxScore: 20, level: vehicleIdentifiable ? 'confirmed' : 'uncertain' });

  const chromeComplexity = visionResult?.confidence_modifiers?.chrome_complexity || 'none';
  const chromeScores = { none: 20, low: 15, medium: 5, high: -5 };
  const chromeScore = chromeScores[chromeComplexity] || 0;
  score += chromeScore;
  factors.push({ name: 'Chrome complexity', score: chromeScore, maxScore: 20, level: chromeComplexity });

  const existingFilm = visionResult?.confidence_modifiers?.existing_film_detected || false;
  const filmScore = existingFilm ? 5 : 15;
  score += filmScore;
  factors.push({ name: 'Existing film', score: filmScore, maxScore: 15, level: existingFilm ? 'detected' : 'none' });

  const paintClear = visionResult?.confidence_modifiers?.paint_condition_clear || false;
  const paintScore = paintClear ? 10 : 0;
  score += paintScore;
  factors.push({ name: 'Paint condition clear', score: paintScore, maxScore: 10, level: paintClear ? 'clear' : 'unclear' });

  const allFlagsAnswered = details && Object.keys(details).length > 0;
  const flagsScore = allFlagsAnswered ? 10 : 0;
  score += flagsScore;
  factors.push({ name: 'Service scope completeness', score: flagsScore, maxScore: 10, level: allFlagsAnswered ? 'complete' : 'incomplete' });

  score = Math.max(0, Math.min(100, score));

  let tier;
  if (score >= 75) tier = 'high';
  else if (score >= 50) tier = 'moderate';
  else tier = 'low';

  return { score, tier, factors };
}

module.exports = { calculateConfidence };
