/**
 * Science-based progression algorithms for Gym Progress Pro
 * Based on research from Stronger by Science and exercise science literature
 */

import type { ExerciseLog, ProgressionRecommendation, ProgressionStrategy } from './types';

/**
 * Calculate linear progression (fixed weight increase)
 * Recommended for novice to intermediate lifters
 * Increase: 2.5-5kg per week depending on exercise and experience
 */
export function calculateLinearProgression(
  currentWeight: number,
  currentReps: number,
  currentSets: number,
  rpe?: number,
  exerciseType: 'compound' | 'isolation' = 'compound'
): ProgressionRecommendation {
  // Determine increment based on exercise type and RPE
  let increment = 2.5;

  if (exerciseType === 'compound') {
    // Compound lifts: larger increments
    if (rpe && rpe <= 6) increment = 5; // Very easy, can progress faster
    else if (rpe && rpe <= 7) increment = 3.75;
    else if (rpe && rpe <= 8) increment = 2.5;
    else increment = 1.25; // Hard, smaller increments
  } else {
    // Isolation exercises: smaller increments
    if (rpe && rpe <= 6) increment = 2.5;
    else if (rpe && rpe <= 7) increment = 1.25;
    else increment = 1.25;
  }

  const recommendedWeight = currentWeight + increment;

  return {
    exerciseId: '',
    exerciseName: '',
    currentWeight,
    currentReps,
    currentSets,
    recommendedWeight,
    recommendedReps: currentReps,
    recommendedSets: currentSets,
    strategy: 'linear',
    rationale: `Add ${increment}kg to maintain progressive overload. RPE-based adjustment: ${
      rpe ? `you rated this ${rpe}/10` : 'track RPE for better adjustments'
    }`,
    confidence: 0.85,
  };
}

/**
 * Calculate double progression (increase reps first, then weight)
 * Recommended for intermediate lifters
 * First increase reps to upper limit, then reset reps and increase weight
 */
export function calculateDoubleProgression(
  currentWeight: number,
  currentReps: number,
  currentSets: number,
  rpe?: number,
  targetRepRange: { min: number; max: number } = { min: 6, max: 10 }
): ProgressionRecommendation {
  // If current reps are below max, increase reps
  if (currentReps < targetRepRange.max) {
    const recommendedReps = Math.min(currentReps + 1, targetRepRange.max);
    return {
      exerciseId: '',
      exerciseName: '',
      currentWeight,
      currentReps,
      currentSets,
      recommendedWeight: currentWeight,
      recommendedReps,
      recommendedSets: currentSets,
      strategy: 'double',
      rationale: `Increase reps to ${recommendedReps}. Once you reach ${targetRepRange.max} reps, increase weight by 2.5-5kg.`,
      confidence: 0.9,
    };
  }

  // If at max reps, increase weight and reset reps
  const weightIncrement = 2.5;
  return {
    exerciseId: '',
    exerciseName: '',
    currentWeight,
    currentReps,
    currentSets,
    recommendedWeight: currentWeight + weightIncrement,
    recommendedReps: targetRepRange.min,
    recommendedSets: currentSets,
    strategy: 'double',
    rationale: `You've reached ${targetRepRange.max} reps. Increase weight by ${weightIncrement}kg and reset to ${targetRepRange.min} reps.`,
    confidence: 0.9,
  };
}

/**
 * Calculate RPE-based progression (autoregulatory)
 * Recommended for intermediate to advanced lifters
 * Progression based on Rate of Perceived Exertion (1-10 scale)
 */
export function calculateRPEProgression(
  currentWeight: number,
  currentReps: number,
  currentSets: number,
  rpe?: number,
  exerciseType: 'compound' | 'isolation' = 'compound'
): ProgressionRecommendation {
  if (!rpe) {
    return {
      exerciseId: '',
      exerciseName: '',
      currentWeight,
      currentReps,
      currentSets,
      recommendedWeight: currentWeight,
      recommendedReps: currentReps,
      recommendedSets: currentSets,
      strategy: 'rpe',
      rationale: 'Track RPE (Rate of Perceived Exertion) to enable autoregulatory progression.',
      confidence: 0.5,
    };
  }

  let weightIncrement = 0;
  let repAdjustment = 0;
  let rationale = '';

  // RPE-based progression rules
  if (rpe >= 9) {
    // Very hard - no progression
    weightIncrement = 0;
    rationale = `RPE ${rpe}/10 (very hard). Maintain weight and reps. Focus on form and recovery.`;
  } else if (rpe >= 8) {
    // Hard - small increment
    weightIncrement = exerciseType === 'compound' ? 1.25 : 0.5;
    rationale = `RPE ${rpe}/10 (hard). Add ${weightIncrement}kg next session.`;
  } else if (rpe >= 7) {
    // Moderate-hard - normal increment
    weightIncrement = exerciseType === 'compound' ? 2.5 : 1.25;
    rationale = `RPE ${rpe}/10 (moderate-hard). Add ${weightIncrement}kg next session.`;
  } else if (rpe >= 6) {
    // Moderate - increase reps or weight
    weightIncrement = exerciseType === 'compound' ? 2.5 : 1.25;
    repAdjustment = 1;
    rationale = `RPE ${rpe}/10 (moderate). Add ${weightIncrement}kg or increase reps by 1.`;
  } else {
    // Easy - larger increment
    weightIncrement = exerciseType === 'compound' ? 5 : 2.5;
    rationale = `RPE ${rpe}/10 (easy). Add ${weightIncrement}kg next session.`;
  }

  return {
    exerciseId: '',
    exerciseName: '',
    currentWeight,
    currentReps,
    currentSets,
    recommendedWeight: currentWeight + weightIncrement,
    recommendedReps: currentReps + repAdjustment,
    recommendedSets: currentSets,
    strategy: 'rpe',
    rationale,
    confidence: 0.95,
  };
}

/**
 * Calculate APRE (Autoregulatory Progressive Resistance Exercise) progression
 * Based on performance of last set (plus set)
 */
export function calculateAPREProgression(
  currentWeight: number,
  currentReps: number,
  currentSets: number,
  lastSetReps: number,
  minReps: number = 4
): ProgressionRecommendation {
  let weightIncrement = 0;
  let rationale = '';

  // APRE rules: based on reps achieved on last set
  if (lastSetReps >= minReps + 5) {
    // 9-10 reps (for 4 min reps)
    weightIncrement = 7.5;
    rationale = `Achieved ${lastSetReps} reps on last set. Add 7.5kg next session.`;
  } else if (lastSetReps >= minReps + 3) {
    // 7-8 reps
    weightIncrement = 5;
    rationale = `Achieved ${lastSetReps} reps on last set. Add 5kg next session.`;
  } else if (lastSetReps >= minReps + 1) {
    // 5-6 reps
    weightIncrement = 2.5;
    rationale = `Achieved ${lastSetReps} reps on last set. Add 2.5kg next session.`;
  } else {
    // Below minimum
    weightIncrement = 0;
    rationale = `Achieved ${lastSetReps} reps on last set. Maintain weight, focus on form.`;
  }

  return {
    exerciseId: '',
    exerciseName: '',
    currentWeight,
    currentReps,
    currentSets,
    recommendedWeight: currentWeight + weightIncrement,
    recommendedReps: currentReps,
    recommendedSets: currentSets,
    strategy: 'arbitrary',
    rationale,
    confidence: 0.88,
  };
}

/**
 * Calculate volume progression (total volume = weight × reps × sets)
 * Ensure 5-10% weekly volume increase for continued progress
 */
export function calculateVolumeProgression(
  currentWeight: number,
  currentReps: number,
  currentSets: number,
  previousVolume: number
): ProgressionRecommendation {
  const currentVolume = currentWeight * currentReps * currentSets;
  const volumeIncrease = ((currentVolume - previousVolume) / previousVolume) * 100;

  let recommendation = { ...calculateLinearProgression(currentWeight, currentReps, currentSets) };

  if (volumeIncrease < 5) {
    recommendation.rationale = `Volume increased by ${volumeIncrease.toFixed(1)}%. Target 5-10% weekly increase. ${recommendation.rationale}`;
  } else if (volumeIncrease > 10) {
    recommendation.rationale = `Volume increased by ${volumeIncrease.toFixed(1)}%. Consider maintaining weight for recovery. ${recommendation.rationale}`;
  } else {
    recommendation.rationale = `Volume increased by ${volumeIncrease.toFixed(1)}%. Optimal progression. ${recommendation.rationale}`;
  }

  return recommendation;
}

/**
 * Select best progression strategy based on user level and history
 */
export function selectBestStrategy(
  logs: ExerciseLog[],
  userExperience: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
): ProgressionStrategy {
  if (userExperience === 'beginner' || logs.length < 4) {
    return 'linear'; // Simple, consistent progression
  } else if (userExperience === 'intermediate') {
    return 'double'; // More nuanced progression
  } else {
    return 'rpe'; // Autoregulatory for advanced lifters
  }
}
