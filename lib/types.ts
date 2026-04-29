/**
 * Core data types for Gym Progress Pro
 */

export type ProgressionStrategy = 'linear' | 'double' | 'rpe' | 'arbitrary';
export type WorkoutSplitType = 'ppl' | 'upper-lower' | 'full-body' | 'bro-split' | 'custom';
export type ExerciseCategory = 'compound' | 'isolation' | 'cardio';

/**
 * Exercise definition
 */
export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  description?: string;
}

/**
 * Workout split template
 */
export interface WorkoutSplit {
  id: string;
  name: string;
  type: WorkoutSplitType;
  description: string;
  daysPerWeek: number;
  days: WorkoutDay[];
}

export interface WorkoutDay {
  id: string;
  name: string; // e.g., "Push", "Pull", "Legs"
  exercises: string[]; // Exercise IDs
}

/**
 * Single exercise session log
 */
export interface ExerciseLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weight: number; // in kg or lbs
  reps: number;
  sets: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
  timestamp: number; // Unix timestamp
}

/**
 * Workout session (collection of exercise logs)
 */
export interface WorkoutSession {
  id: string;
  date: number; // Unix timestamp
  splitDay?: string; // e.g., "Push", "Pull", "Legs"
  exercises: ExerciseLog[];
  totalVolume: number; // weight * reps * sets (sum of all exercises)
  duration?: number; // in minutes
  notes?: string;
}

/**
 * Progression recommendation
 */
export interface ProgressionRecommendation {
  exerciseId: string;
  exerciseName: string;
  currentWeight: number;
  currentReps: number;
  currentSets: number;
  recommendedWeight: number;
  recommendedReps?: number;
  recommendedSets?: number;
  strategy: ProgressionStrategy;
  rationale: string;
  confidence: number; // 0-1
}

/**
 * User profile and settings
 */
export interface UserProfile {
  id: string;
  name: string;
  weightUnit: 'kg' | 'lbs';
  selectedSplit: WorkoutSplitType;
  progressionStrategy: ProgressionStrategy;
  createdAt: number;
  lastWorkoutDate?: number;
}

/**
 * Weekly progress summary
 */
export interface WeeklyProgress {
  week: number; // Week number or ISO week
  startDate: number; // Unix timestamp
  endDate: number; // Unix timestamp
  totalVolume: number; // Sum of all volumes in week
  workoutCount: number;
  exerciseData: {
    [exerciseId: string]: {
      exerciseName: string;
      volume: number;
      avgWeight: number;
      maxWeight: number;
      reps: number[];
    };
  };
}

/**
 * Progression history for an exercise
 */
export interface ExerciseProgressionHistory {
  exerciseId: string;
  exerciseName: string;
  logs: ExerciseLog[];
  personalRecords: {
    maxWeight: number;
    maxReps: number;
    maxVolume: number;
  };
}
