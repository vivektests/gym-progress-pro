/**
 * Analytics and progress calculation utilities
 */

import type { WorkoutSession, ExerciseLog, WeeklyProgress } from './types';

/**
 * Get ISO week number from date
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get start of week (Monday)
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * Get end of week (Sunday)
 */
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Calculate total volume for a workout session
 */
export function calculateSessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce((total, log) => {
    return total + log.weight * log.reps * log.sets;
  }, 0);
}

/**
 * Calculate weekly progress summary
 */
export function calculateWeeklyProgress(workouts: WorkoutSession[], weekStart: number): WeeklyProgress {
  const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
  const weekWorkouts = workouts.filter((w) => w.date >= weekStart && w.date < weekEnd);

  const exerciseData: WeeklyProgress['exerciseData'] = {};
  let totalVolume = 0;

  weekWorkouts.forEach((workout) => {
    workout.exercises.forEach((log) => {
      if (!exerciseData[log.exerciseId]) {
        exerciseData[log.exerciseId] = {
          exerciseName: log.exerciseName,
          volume: 0,
          avgWeight: 0,
          maxWeight: 0,
          reps: [],
        };
      }

      const volume = log.weight * log.reps * log.sets;
      exerciseData[log.exerciseId].volume += volume;
      exerciseData[log.exerciseId].maxWeight = Math.max(exerciseData[log.exerciseId].maxWeight, log.weight);
      exerciseData[log.exerciseId].reps.push(log.reps);
      totalVolume += volume;
    });
  });

  // Calculate average weight per exercise
  Object.keys(exerciseData).forEach((exerciseId) => {
    const data = exerciseData[exerciseId];
    if (data.reps.length > 0) {
      data.avgWeight = data.maxWeight; // Simplified: use max weight as representative
    }
  });

  return {
    week: getWeekNumber(new Date(weekStart)),
    startDate: weekStart,
    endDate: weekEnd,
    totalVolume,
    workoutCount: weekWorkouts.length,
    exerciseData,
  };
}

/**
 * Calculate progress trend (percentage change week over week)
 */
export function calculateProgressTrend(currentWeek: WeeklyProgress, previousWeek: WeeklyProgress | null): number {
  if (!previousWeek || previousWeek.totalVolume === 0) {
    return 0;
  }
  return ((currentWeek.totalVolume - previousWeek.totalVolume) / previousWeek.totalVolume) * 100;
}

/**
 * Get exercise personal record (max weight achieved)
 */
export function getExercisePR(logs: ExerciseLog[]): number {
  if (logs.length === 0) return 0;
  return Math.max(...logs.map((log) => log.weight));
}

/**
 * Get exercise average weight over last N sessions
 */
export function getExerciseAverageWeight(logs: ExerciseLog[], sessions: number = 5): number {
  if (logs.length === 0) return 0;
  const recentLogs = logs.slice(-sessions);
  const sum = recentLogs.reduce((total, log) => total + log.weight, 0);
  return sum / recentLogs.length;
}

/**
 * Get exercise average reps over last N sessions
 */
export function getExerciseAverageReps(logs: ExerciseLog[], sessions: number = 5): number {
  if (logs.length === 0) return 0;
  const recentLogs = logs.slice(-sessions);
  const sum = recentLogs.reduce((total, log) => total + log.reps, 0);
  return sum / recentLogs.length;
}

/**
 * Calculate total volume for an exercise
 */
export function getExerciseTotalVolume(logs: ExerciseLog[]): number {
  return logs.reduce((total, log) => total + log.weight * log.reps * log.sets, 0);
}

/**
 * Get exercise progress over time (for charting)
 */
export interface ExerciseProgressPoint {
  date: number;
  weight: number;
  reps: number;
  sets: number;
  volume: number;
  rpe?: number;
}

export function getExerciseProgressOverTime(logs: ExerciseLog[]): ExerciseProgressPoint[] {
  return logs.map((log) => ({
    date: log.timestamp,
    weight: log.weight,
    reps: log.reps,
    sets: log.sets,
    volume: log.weight * log.reps * log.sets,
    rpe: log.rpe,
  }));
}

/**
 * Calculate consistency score (0-100)
 * Based on workouts per week and adherence to split
 */
export function calculateConsistencyScore(workouts: WorkoutSession[], lastWeeks: number = 4): number {
  if (workouts.length === 0) return 0;

  const now = Date.now();
  const weekAgo = now - lastWeeks * 7 * 24 * 60 * 60 * 1000;
  const recentWorkouts = workouts.filter((w) => w.date >= weekAgo);

  const expectedWorkouts = lastWeeks * 3.5; // Average 3.5 workouts per week
  const actualWorkouts = recentWorkouts.length;
  const score = Math.min((actualWorkouts / expectedWorkouts) * 100, 100);

  return Math.round(score);
}

/**
 * Get weekly volume trend (last N weeks)
 */
export function getWeeklyVolumeTrend(workouts: WorkoutSession[], weeks: number = 12): number[] {
  const trend: number[] = [];
  const now = Date.now();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
    const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
    const weekWorkouts = workouts.filter((w) => w.date >= weekStart && w.date < weekEnd);

    const volume = weekWorkouts.reduce((total, w) => total + calculateSessionVolume(w), 0);
    trend.push(volume);
  }

  return trend;
}

/**
 * Calculate body composition estimate (simplified)
 * Based on volume progression and consistency
 */
export function estimateProgressMetrics(workouts: WorkoutSession[], weeks: number = 12) {
  const volumeTrend = getWeeklyVolumeTrend(workouts, weeks);
  const consistency = calculateConsistencyScore(workouts, weeks);

  // Calculate volume growth
  const firstWeekVolume = volumeTrend[0] || 0;
  const lastWeekVolume = volumeTrend[volumeTrend.length - 1] || 0;
  const volumeGrowth =
    firstWeekVolume > 0 ? ((lastWeekVolume - firstWeekVolume) / firstWeekVolume) * 100 : 0;

  return {
    volumeGrowth: Math.round(volumeGrowth * 10) / 10,
    consistency,
    workoutCount: workouts.length,
    averageWeeklyVolume: volumeTrend.reduce((a, b) => a + b, 0) / Math.max(volumeTrend.length, 1),
  };
}
